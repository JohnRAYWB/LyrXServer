import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Track, TrackDocument} from "./schema/track.schema";
import {Model, ObjectId} from "mongoose";
import {Comment, CommentDocument} from "./schema/comment.schema";
import {FileService, FileType} from "../file/file.service";
import {createTrackDto} from "./dto/create.track.dto";
import {createCommentDto} from "./dto/create.comment.dto";
import {User} from "../user/schema/user.schema";

@Injectable()
export class TrackService {

    constructor(
       @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
       @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
       @InjectModel(User.name) private userModel: Model<User>,
       private fileService: FileService,
    ) {}

    async getAllTracks(): Promise<Track[]> {

        const tracksList = await this.trackModel.find().populate('comments')

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

    async createTrack(dto: createTrackDto, audio, image): Promise<Track> {

        const user = await this.userModel.findOne({email: dto.artist.email})
        const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
        const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)

        const track = await this.trackModel.create({...dto, artist: user['id'], listens: 0, audio: audioFile, image: imageFile})

        user.tracks.push(track['id'])
        user.save()

        return track
    }

    async incrementListens(id: ObjectId): Promise<Track> {

        const track = await this.trackModel.findById(id)

        track.listens++
        await track.save()

        return track
    }

    async addComment(dto: createCommentDto): Promise<Comment> {

        const user = await this.userModel.findOne({email: dto.user.email})
        const track = await this.trackModel.findById(dto.track)
        const comment = await this.commentModel.create({...dto, user: user['id']})

        user.comments.push(comment['id'])
        user.save()
        track.comments.push(comment['id'])
        track.save()

        return comment
    }

    async deleteTrackById(id: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(id).populate('artist')
        const user = await this.userModel.findOne({email: track.artist.email}).populate('tracks')

        if(track) {
            this.fileService.removeFile(track.image, 'track', track.artist.username)
            this.fileService.removeFile(track.audio, 'track', track.artist.username)

            user.tracks.splice(user.tracks.indexOf(track['id']), 1)
            user.save()

            track.deleteOne()
        }

        return 'done'
    }
}