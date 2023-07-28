import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Track, TrackDocument} from "./schema/track.schema";
import {Model, ObjectId} from "mongoose";
import {Comment, CommentDocument} from "./schema/comment.schema";
import {FileService, FileType} from "../file/file.service";
import {createTrackDto} from "./dto/create.track.dto";
import {User, UserDocument} from "../user/schema/user.schema";
import {editTrackDescriptionDto} from "./dto/edit.track.description.dto";
import {Playlist, PlaylistDocument} from "../playlist/schema/playlist.schema";
import {GenreService} from "../genre/genre.service";
import {Genre, GenreDocument} from "../genre/schema/genre.schema";

@Injectable()
export class TrackService {

    private trackException = (e) => new HttpException(`Track service: Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)

    constructor(
        @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
        @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
        private genreService: GenreService,
        private fileService: FileService,
    ) {
    }

    async getAllTracks(limit = 10, page = 0): Promise<Track[]> {

        const tracksList = await this.trackModel.find().skip(page).limit(limit)

        return tracksList
    }

    async getMostLiked(): Promise<Track[]> {
        const tracks = await this.trackModel.find().sort({favorites: -1}).limit(10)

        return tracks
    }

    async getMostListens(): Promise<Track[]> {
        const tracks = await this.trackModel.find().sort({listens: -1}).limit(10)

        return tracks
    }

    async getTracksByGenre(gId: ObjectId): Promise<Track[]> {
        const tracksList = await this.trackModel.find({
            genre: gId
        })

        return tracksList
    }

    async getTrackById(tId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(tId)
            .populate([
                {path: 'comments', populate: {path: 'user', select: '-password'}},
                {path: 'artist', select: '-password'},
                {path: 'album'},
                {path: 'genre'}
            ])

        return track
    }

    async searchTrackByName(name: string): Promise<Track[]> {

        const track = await this.trackModel.find({
            name: {$regex: new RegExp(name, 'i')}
        }).populate([
            {path: 'album'},
        ])

        return track
    }

    async createTrack(uId: ObjectId, dto: createTrackDto, audio, image): Promise<Track> {
        try {
            const user = await this.userModel.findById(uId)
            const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
            const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)
            const tName = [user.username, dto.name]

            const track = await this.trackModel.create({
                ...dto,
                name: tName,
                artist: user._id,
                audio: audioFile,
                image: imageFile,
                createdTime: Date.now()
            })
            await user.updateOne({$addToSet: {tracks: track._id}})

            return track
        } catch (e) {
            throw this.trackException(e)
        }
    }

    async addGenre(uId: ObjectId, tId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, tId, gId, true)
        return 'Genre add successfully'
    }

    async incrementTrackListens(tId: ObjectId): Promise<any> {

        await this.trackModel.findByIdAndUpdate(tId, {$inc: {listens: 1}})
        return 'Thanks for listening this song'
    }

    async addTrackToCollection(uId: ObjectId, tId: ObjectId): Promise<any> {

        await this.collectionControl(uId, tId, true)
        return 'Track add to your collection successfully'
    }

    async addTrackToPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistControl(uId, tId, pId, true)
        return 'Track add to your playlist successfully'
    }

    async addComment(uId, tId: ObjectId, text: string): Promise<any> {

        const user = await this.userModel.findById(uId)
        const track = await this.trackModel.findById(tId)

        try {
            if (!user.ban) {
                const comment = await this.commentModel.create({user: user._id, text: text, track: track._id})
                await user.updateOne({$addToSet: {comments: comment._id}})
                await track.updateOne({$addToSet: {comments: comment._id}})

                return 'Comment add successfully'
            } else {
                throw new HttpException(`You are banned. Ban reason: ${user.banReason}`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }

    }

    async editTrackDescription(uId: ObjectId, tId: ObjectId, dto: editTrackDescriptionDto): Promise<any> {

        const track = await this.trackModel.findById(tId)

        try {
            if (track.artist.toString() === uId.toString()) {
                if (dto.name) {
                    await track.updateOne({$set: {name: dto.name}})
                }

                if (dto.description) {
                    await track.updateOne({$set: {description: dto.description}})
                }

                return 'Changes update successfully'
            } else {
                throw new HttpException(`It's not your track`, HttpStatus.BAD_REQUEST)
            }

        } catch (e) {
            throw this.trackException(e)
        }
    }

    async editTrackArtist(uId: ObjectId, tId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')
        const trackOwner = await this.userModel.findById(track.artist._id).populate('tracks')
        const newOwner = await this.userModel.findById(uId).populate('roles')

        const newOwnerName = newOwner.username
        const trackName = track.name.pop()

        try {
            if (!track.protectedDeletion && newOwner._id !== trackOwner._id) {
                if(newOwner.roles.findIndex(role => role.role === 'artist') !== -1) {
                    this.fileService.moveFile(track.audio, 'audio', 'track', trackOwner.username, newOwner.username)
                    this.fileService.moveFile(track.image, 'image', 'track', trackOwner.username, newOwner.username)

                    await trackOwner.updateOne({$pull: {tracks: track._id}})
                    await track.updateOne({$set: {artist: newOwner._id, name: [newOwnerName, trackName]}})
                    await newOwner.updateOne({$addToSet: {tracks: track._id}})

                    return 'Artist successfully updated'
                }else {
                    throw new HttpException('Current user is not an artist', HttpStatus.BAD_REQUEST)
                }
            } else {
                throw new HttpException('Permission denied', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    async editTrackAudio(uId: ObjectId, tId: ObjectId, audio): Promise<any> {

        await this.editFileControl(uId, tId, audio, 'audio')
        return 'Audio successfully updated'
    }

    async editTrackImage(uId: ObjectId, tId: ObjectId, image): Promise<any> {

        await this.editFileControl(uId, tId, image, 'image')
        return 'Image successfully updated'
    }

    async editCommentById(uId: ObjectId, cId: ObjectId, text: string): Promise<any> {

        const comment = await this.commentModel.findById(cId)

        try {
            if (uId.toString() === comment.user.toString()) {
                await comment.updateOne({$set: {text: text}, $inc: {__v: 1}})

                return 'Comment successfully changed'
            } else {
                throw new HttpException(`Not your comment`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    async removeGenre(uId: ObjectId, tId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, tId, gId, false)
        return 'Genre remove successfully'
    }

    async removeTrackFromCollection(uId: ObjectId, tId: ObjectId): Promise<any> {

        await this.collectionControl(uId, tId, false)
        return 'Track remove from your collection successfully'
    }

    async removeTrackFromPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistControl(uId, tId, pId, false)
        return 'Track remove from your playlist successfully'
    }

    async deleteCommentById(uId: ObjectId, cId: ObjectId): Promise<any> {

        const comment = await this.commentModel.findById(cId).populate(['user', 'track'])
        const user = await this.userModel.findById(uId).populate('roles')

        try {
            if (user['id'] === comment.user['id'] || user.roles.find(role => role.role === 'admin')) {
                await user.updateOne({$pull: {comments: comment['id']}})
                await this.trackModel.findByIdAndUpdate(comment.track['id'], {$pull: {comments: comment['id']}})

                comment.deleteOne()

                return 'Comment successfully deleted'
            } else {
                throw new HttpException(`Not your comment`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    async deleteTrackById(tId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
            if (!track.protectedDeletion) {
                await this.userModel.find().populate('comments').updateMany({}, {
                    $pullAll: {
                        comments: [...track.comments],
                        tracks: [track],
                        tracksCollection: [track]
                    }
                })
                await this.playlistModel.find().updateMany({}, {$pullAll: {tracks: [track]}})
                await this.commentModel.deleteMany({track: track})
                await this.genreModel.find().updateMany({}, {$pullAll: {tracks: [track]}})

                this.fileService.removeFile(track.audio, 'track', track.artist.username)
                this.fileService.removeFile(track.image, 'track', track.artist.username)

                track.deleteOne()
            } else {
                throw new HttpException('Permission denied: Track has protection.First remove it from album', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }

        return 'Track successfully deleted'
    }

    private async genreControl(uId: ObjectId, tId: ObjectId, gId: ObjectId, add: boolean) {

        const track = await this.trackModel.findById(tId)

        try {
            if (track.artist.toString() === uId.toString()) {
                if (add) {
                    if (track.genre.findIndex(g => g.toString() === gId.toString()) === -1) {
                        await this.genreService.addEntityToGenre(gId, tId, 'track')
                        await track.updateOne({$addToSet: {genre: gId}})
                    } else {
                        throw new HttpException('Track has this genre already', HttpStatus.BAD_REQUEST)
                    }
                }

                if (!add) {
                    if (track.genre.findIndex(g => g.toString() === gId.toString()) !== -1) {
                        await this.genreService.removeEntityFromGenre(gId, tId, 'track')
                        await track.updateOne({$pull: {genre: gId}})
                    } else {
                        throw new HttpException('Track has not this genre', HttpStatus.BAD_REQUEST)
                    }
                }
            } else {
                throw new HttpException(`It's not your track`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    private async collectionControl(uId: ObjectId, tId: ObjectId, add: boolean): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        try {
            if (add) {
                if (user.tracksCollection.findIndex(t => t.toString() === tId.toString()) === -1) {
                    await track.updateOne({$inc: {favorites: 1}})
                    await user.updateOne({$addToSet: {tracksCollection: track._id}})
                } else {
                    throw new HttpException('You already has this track in your collection', HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.tracksCollection.findIndex(t => t.toString() === tId.toString()) !== -1) {
                    await track.updateOne({$inc: {favorites: -1}})
                    await user.updateOne({$pull: {tracksCollection: track._id}})
                } else {
                    throw new HttpException(`You have not this track in your collection`, HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    private async playlistControl(uId: ObjectId, tId: ObjectId, pId: ObjectId, add: boolean): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const playlist = await this.playlistModel.findById(pId)

        try {
            if (playlist.user.toString() === uId.toString()) {
                if (add) {
                    if (playlist.tracks.findIndex(t => t.toString() === tId.toString()) === -1) {
                        await playlist.updateOne({$addToSet: {tracks: tId}})
                        await track.updateOne({$inc: {favorites: 1}})
                    } else {
                        throw new HttpException(`Playlist include this track already`, HttpStatus.FORBIDDEN)
                    }
                }

                if (!add) {
                    if (playlist.tracks.findIndex(t => t.toString() === tId.toString()) !== -1) {
                        await playlist.updateOne({$pull: {tracks: tId}})
                        await track.updateOne({$inc: {favorites: -1}})
                    } else {
                        throw new HttpException(`Playlist not include this track`, HttpStatus.FORBIDDEN)
                    }
                }
            } else {
                throw new HttpException(`It's not your playlist`, HttpStatus.FORBIDDEN)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    private async editFileControl(uId: ObjectId, tId: ObjectId, file, type): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')
        try {
            if (track && track.artist._id.toString() === uId.toString()) {
                if (type === 'audio') {
                    const audioFile = this.fileService.updateFile(track.audio, file, FileType.AUDIO, 'track', track.artist.username)
                    await track.updateOne({$set: {audio: audioFile}})
                }

                if (type === 'image') {
                    const imageFile = this.fileService.updateFile(track.image, file, FileType.IMAGE, 'track', track.artist.username)
                    await track.updateOne({$set: {image: imageFile}})
                }
            } else {
                throw new HttpException('Permission denied', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }
}