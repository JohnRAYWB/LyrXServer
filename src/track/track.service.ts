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

    async getTrackById(id: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id).populate('comments').populate('artist')

        return track
    }

    async searchTrackByName(name: string): Promise<Track[]>{

        const track = await this.trackModel.find({
            name: {$regex: new RegExp(name, 'i')}
        }).populate('artist')

        return track
    }

    async createTrack(dto: createTrackDto, audio, image, uId): Promise<Track> {

        const user = await this.userModel.findById(uId)
        const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
        const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)

        const track = await this.trackModel.create({...dto, artist: user['id'], listens: 0, favorites: 0, audio: audioFile, image: imageFile})

        user.tracks.push(track['id'])
        user.save()

        return track
    }

    async incrementTrackListens(id: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id)

        track.listens++
        await track.save()

        return track
    }

    async addTrackToCollection(tId: ObjectId, uId: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        if(track && user) {
            user.tracksCollection.push(track['id'])
            user.save()

            track.favorites++
            track.save()

            return 'done'
        } else {
            throw new HttpException('Something goes wrong. Please try again', HttpStatus.BAD_REQUEST)
        }
    }

    async removeTrackFromCollection(tId: ObjectId, uId: ObjectId): Promise<any> {
        const track = await this.trackModel.findById(tId)
        const user = await this.userModel.findById(uId)

        if(track && user) {
            user.tracksCollection.splice(user.tracksCollection.indexOf(track['id']), 1)
            user.save()

            track.favorites--
            track.save()

            return 'done'
        } else {
            throw new HttpException('Something goes wrong. Please try again', HttpStatus.BAD_REQUEST)
        }
    }

    async addComment(dto: createCommentDto): Promise<Comment> {

        const user = await this.userModel.findOne({email: dto.user.email})
        const track = await this.trackModel.findById(dto.track)

        if(!user.ban) {
            const comment = await this.commentModel.create({...dto, user: user['id']})
            user.comments.push(comment['id'])
            user.save()
            track.comments.push(comment['id'])
            track.save()

            return comment
        } else {
            throw new HttpException(`You are banned. Ban reason: ${user.banReason}`, HttpStatus.BAD_REQUEST)
        }
    }

    async editTrackDescription(id: ObjectId, dto: editTrackDescriptionDto, userId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id).populate('artist')

        if(track && track.artist['id'] === userId) {
            if(dto.name) {
                track.name = dto.name
            }

            if(dto.description) {
                track.description = dto.description
            }

            track.save()
            return track
        } else {
            throw new HttpException('Something goes wrong. Try again', HttpStatus.BAD_REQUEST)
        }
    }

    async editTrackArtist(id: ObjectId, dto: editTrackArtistDto): Promise<Track> {

        const track = await this.trackModel.findById(id).populate('artist')
        let trackOwner = await this.userModel.findById(track.artist['id']).populate('tracks')
        const user = await this.userModel.findById(dto.artist)

        if(user && user['id'] !== trackOwner['id']) {
            trackOwner.tracks.splice(trackOwner.tracks.indexOf(track['id']), 1)
            trackOwner.save()

            track.artist = user['id']

            user.tracks.push(track['id'])
            user.save()

            this.fileService.moveFile(track.audio,'audio', 'track', trackOwner.username, user.username)
            this.fileService.moveFile(track.image, 'image', 'track', trackOwner.username, user.username)
        }

        track.save()
        return track
    }

    async editTrackAudio(id: ObjectId, audio, userId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id).populate('artist')

        if(track && track.artist['id'] === userId) {
            const audioFile = this.fileService.updateFile(track.audio, audio, FileType.AUDIO, 'track', track.artist.username)
            track.audio = audioFile

            track.save()
            return track
        } else {
            throw new HttpException('Something goes wrong. Try again', HttpStatus.BAD_REQUEST)
        }
    }

    async editTrackImage(id: ObjectId, image, userId: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id).populate('artist')

        if(track && track.artist['id'] === userId) {
            const imageFile = this.fileService.updateFile(track.image, image, FileType.IMAGE, 'track', track.artist.username)
            track.image = imageFile

            track.save()
            return track
        } else {
            throw new HttpException('Something goes wrong. Try again', HttpStatus.BAD_REQUEST)
        }
    }

    async editCommentById(id: ObjectId, text: string, uId: ObjectId): Promise<any> {

        const comment = await this.commentModel.findById(id)

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

    async deleteCommentById(id: ObjectId, uId: ObjectId): Promise<any> {

        const comment = await this.commentModel.findById(id).populate(['user', 'track'])
        const user = await this.userModel.findById(uId).populate('roles')

        try {
            if(user['id'] === comment.user['id'] || user.roles.find(role => role.role === 'admin')) {
                await this.userModel.findByIdAndUpdate(comment.user['id'], {$pull: {comments: comment['id']}})
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

    async deleteTrackById(id: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(id).populate('artist')

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