import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Track, TrackDocument} from "./schema/track.schema";
import {Model, ObjectId} from "mongoose";
import {Comment, CommentDocument} from "./schema/comment.schema";
import {FileService, FileType} from "../file/file.service";
import {createTrackDto} from "./dto/create.track.dto";
import {createCommentDto} from "./dto/create.comment.dto";
import {User, UserDocument} from "../user/schema/user.schema";
import {editTrackDescriptionDto} from "./dto/edit.track.description.dto";
import {Playlist, PlaylistDocument} from "../playlist/schema/playlist.schema";
import {GenreService} from "../genre/genre.service";

@Injectable()
export class TrackService {

    private trackException = (e) => new HttpException(`Track service: Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)

    constructor(
       @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
       @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
       @InjectModel(User.name) private userModel: Model<UserDocument>,
       @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
       private genreService: GenreService,
       private fileService: FileService,
    ) {}

    async getAllTracks(): Promise<Track[]> {

        const tracksList = await this.trackModel.find()

        return tracksList
    }

    async getTrackById(tId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(tId).populate([
            'artist', 'comments', 'albums'
        ])

        return track
    }

    async searchTrackByName(name: string): Promise<Track[]>{

        const track = await this.trackModel.find({
            name: {$regex: new RegExp(name, 'i')}
        })

        return track
    }

    async createTrack(uId, dto: createTrackDto, audio, image): Promise<Track> {

        const user = await this.userModel.findById(uId)
        const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
        const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)

        const track = await this.trackModel.create({...dto, artist: user['id'], audio: audioFile, image: imageFile})
        await user.updateOne({$addToSet: {tracks: track['id']}})

        return track
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

        await this.trackDirectionsInCollection(uId, tId, true)
        return 'Track add to your collection successfully'
    }

    async addTrackToPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {

        await this.trackDirectionsInPlaylist(uId, tId, pId, true)
        return 'Track add to your playlist successfully'
    }

    async addComment(uId, dto: createCommentDto): Promise<any> {

        const user = await this.userModel.findById(uId)
        const track = await this.trackModel.findById(dto.track)

        try {
            if(!user.ban) {
                const comment = await this.commentModel.create({...dto, user: user['id']})
                await user.updateOne({$addToSet: {comments: comment['id']}})
                await track.updateOne({$addToSet: {comments: comment['id']}})

                return 'Comment add successfully'
            } else {
                throw new HttpException(`You are banned. Ban reason: ${user.banReason}`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }

    }

    async editTrackDescription(uId: ObjectId, tId: ObjectId, dto: editTrackDescriptionDto): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
            if(track.artist['id'] === uId.toString()) {
                if(dto.name) {
                    await track.updateOne({$set: {name: dto.name}})
                }

                if(dto.description) {
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
        const trackOwner = await this.userModel.findById(track.artist['id']).populate('tracks')
        const newOwner = await this.userModel.findById(uId)

        try {
            if(!track.protectedDeletion && newOwner && newOwner['id'] !== trackOwner['id']) {

                this.fileService.moveFile(track.audio,'audio', 'track', trackOwner.username, newOwner.username)
                this.fileService.moveFile(track.image, 'image', 'track', trackOwner.username, newOwner.username)

                await trackOwner.updateOne({$pull: {tracks: track['id']}})
                await track.updateOne({$set: {artist: newOwner['id']}})
                await newOwner.updateOne({$addToSet: {tracks: track['id']}})

                return 'Artist successfully updated'
            } else {
                throw new HttpException('Permission denied', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    async editTrackAudio(uId: ObjectId, tId: ObjectId, audio): Promise<any> {

        await this.editTrackFile(uId, tId, audio, 'audio')
        return 'Audio successfully updated'
    }

    async editTrackImage(uId: ObjectId, tId: ObjectId, image): Promise<any> {

        await this.editTrackFile(uId, tId, image, 'image')
        return 'Image successfully updated'
    }

    async editCommentById(uId: ObjectId, tId: ObjectId, text: string): Promise<any> {

        const comment = await this.commentModel.findById(tId)

        try{
            if(uId.toString() === comment.user.toString()) {
                await comment.updateOne({$set: {text: text}})

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

        await this.trackDirectionsInCollection(uId, tId, false)
        return 'Track remove from your collection successfully'
    }

    async removeTrackFromPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {

        await this.trackDirectionsInPlaylist(uId, tId, pId, false)
        return 'Track remove from your playlist successfully'
    }

    async deleteCommentById(uId: ObjectId, tId: ObjectId): Promise<any> {

        const comment = await this.commentModel.findById(tId).populate(['user', 'track'])
        const user = await this.userModel.findById(uId).populate('roles')

        try {
            if(user['id'] === comment.user['id'] || user.roles.find(role => role.role === 'admin')) {
                await user.updateOne({$pull: {comments: comment['id']}})
                await this.trackModel.findByIdAndUpdate(comment.track['id'],{$pull: {comments: comment['id']}})

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
            if(!track.protectedDeletion) {
                await this.userModel.find().populate('comments').updateMany({}, {$pullAll: {
                        comments: [...track.comments],
                        tracks: [track],
                        tracksCollection: [track]
                    }})
                await this.playlistModel.find().updateMany({}, {$pullAll: {tracks: [track]}})
                await this.commentModel.deleteMany({track: track})

                this.fileService.removeFile(track.audio, 'track', track.artist.username)
                this.fileService.removeFile(track.image, 'track', track.artist.username)

                track.deleteOne()
            } else {
                throw new HttpException('Permission denied: Track has protection. You can delete it only from album', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.trackException(e)
        }

        return 'Track successfully deleted'
    }

    private async genreControl(uId: ObjectId, tId: ObjectId, gId: ObjectId, add: boolean) {

        const user = await this.userModel.findById(uId).populate('roles')
        const track = await this.trackModel.findById(tId)

        try {
            if(track.artist.toString() === uId.toString() || user.roles.find(r => r.role === 'admin')) {
                if(add) {
                    if(!track.genre.find(g => g.toString() === gId.toString())) {
                        await this.genreService.addEntityToGenre(gId, tId, 'track')
                        await track.updateOne({$addToSet: {genre: gId}})
                    } else {
                        throw new HttpException('Track has this genre already', HttpStatus.BAD_REQUEST)
                    }
                }

                if(!add) {
                    if(track.genre.find(g => g.toString() === gId.toString())) {
                        await this.genreService.removeEntityFromGenre(gId, tId, 'track')
                        await track.updateOne({$pull: {genre: gId}})
                    } else {
                        throw new HttpException('Track has not this genre', HttpStatus.BAD_REQUEST)
                    }
                }
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    private async trackDirectionsInCollection(uId: ObjectId, tId: ObjectId, add: boolean): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        try {
            if(add) {
                if(!user.tracksCollection.find(t => t.toString() === tId.toString())) {
                    await track.updateOne({$inc: {favorites: 1}})
                    await user.updateOne({$addToSet: {tracksCollection: track['id']}})
                } else {
                    throw new HttpException('You already has this track in your collection', HttpStatus.BAD_REQUEST)
                }
            }

            if(!add) {
                if(user.tracksCollection.find(t => t.toString() === tId.toString())) {
                    await track.updateOne({$inc: {favorites: -1}})
                    await user.updateOne({$pull: {tracksCollection: track['id']}})
                } else {
                    throw new HttpException(`You have not this track in your collection`, HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.trackException(e)
        }
    }

    private async trackDirectionsInPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId, add: boolean): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const playlist = await this.playlistModel.findById(pId)

        try {
            if(playlist.user.toString() === uId.toString()) {
                if(add) {
                    if(!playlist.tracks.find(t => t.toString() === tId.toString())) {
                        await playlist.updateOne({$addToSet: {tracks: tId}})
                        await track.updateOne({$inc: {favorites: 1}})
                    } else {
                        throw new HttpException(`Playlist include this track already`, HttpStatus.FORBIDDEN)
                    }
                }

                if(!add) {
                    if(playlist.tracks.find(t => t.toString() === tId.toString())) {
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

    private async editTrackFile(uId: ObjectId, tId: ObjectId, file, type): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
            if(track && track.artist['id'] === uId) {
                if(type === 'audio') {
                    const audioFile = this.fileService.updateFile(track.audio, file, FileType.AUDIO, 'track', track.artist.username)
                    await track.updateOne({$set: {audio: audioFile}})
                }

                if(type === 'image') {
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