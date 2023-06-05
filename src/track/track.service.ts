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
import {editTrackArtistDto} from "./dto/edit.track.artist.dto";
import {Playlist, PlaylistDocument} from "../playlist/schema/playlist.schema";

@Injectable()
export class TrackService {

    constructor(
       @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
       @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
       @InjectModel(User.name) private userModel: Model<UserDocument>,
       @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
       private fileService: FileService,
    ) {}

    async getAllTracks(): Promise<Track[]> {

        const tracksList = await this.trackModel.find()

        return tracksList
    }

    async getTrackById(tId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(tId).populate('comments').populate('artist')

        return track
    }

    async searchTrackByName(name: string): Promise<Track[]>{

        const track = await this.trackModel.find({
            name: {$regex: new RegExp(name, 'i')}
        }).populate('artist')

        return track
    }

    async createTrack(uId, dto: createTrackDto, audio, image): Promise<Track> {

        const user = await this.userModel.findById(uId)
        const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
        const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)

        const track = await this.trackModel.create({...dto, artist: user['id'], listens: 0, favorites: 0, audio: audioFile, image: imageFile})
        await user.updateOne({$addToSet: {tracks: track['id']}})

        return track
    }

    async incrementTrackListens(tId: ObjectId): Promise<any> {

        await this.trackModel.findByIdAndUpdate(tId, {$inc: {listens: 1}})

        return 'Thanks for listening this song'
    }

    async addTrackToCollection(uId: ObjectId, tId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        try {
            if(!user.tracksCollection.find(t => t.toString() === tId.toString())) {
                await track.updateOne({$inc: {favorites: 1}})
                await user.updateOne({$addToSet: {tracksCollection: track['id']}})

                return 'Track add to your collection successfully'
            } else {
                throw new HttpException('You already has this track in your collection', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw new HttpException(`Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
    }

    async removeTrackFromCollection(uId: ObjectId, tId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        try {
            if(user.tracksCollection.find(t => t.toString() === tId.toString())) {
                await track.updateOne({$inc: {favorites: -1}})
                await user.updateOne({$pull: {tracksCollection: track['id']}})

                return 'Track remove from your collection successfully'
            } else {
                throw new HttpException(`You hasn't this track in your collection`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw new HttpException(`Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
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
            throw new HttpException(`Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
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
            throw new HttpException(`Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
    }

    async editTrackArtist(tId: ObjectId, dto: editTrackArtistDto): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')
        const trackOwner = await this.userModel.findById(track.artist['id']).populate('tracks')
        const newOwner = await this.userModel.findById(dto.artist)

        try {
            if(newOwner && newOwner['id'] !== trackOwner['id']) {

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
            throw new HttpException(`Something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
    }

    async editTrackAudio(uId: ObjectId, tId: ObjectId, audio): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
            if(track && track.artist['id'] === uId) {
                const audioFile = this.fileService.updateFile(track.audio, audio, FileType.AUDIO, 'track', track.artist.username)
                await track.updateOne({$set: {audio: audioFile}})

                return 'Audio successfully updated'
            } else {
                throw new HttpException('Permission denied', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw new HttpException(`Audio not found or something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
    }

    async editTrackImage(uId: ObjectId, tId: ObjectId, image): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
            if(track && track.artist['id'] === uId) {
                const imageFile = this.fileService.updateFile(track.image, image, FileType.IMAGE, 'track', track.artist.username)
                await track.updateOne({$set: {image: imageFile}})

                return 'Image successfully updated'
            } else {
                throw new HttpException('Permission denied', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw new HttpException(`Image not found or something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
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
            throw new HttpException(`Comment not found or something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
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
            throw new HttpException(`Comment not found or something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }
    }

    async deleteTrackById(tId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId).populate('artist')

        try {
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
        } catch (e) {
            throw new HttpException(`Track not found or something goes wrong. Error: ${e.message}`, HttpStatus.NOT_FOUND)
        }

        return 'Track successfully deleted'
    }
}