import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Track, TrackDocument} from "./schema/track.schema";
import {Model, ObjectId} from "mongoose";
import {Comment, CommentDocument} from "./schema/comment.schema";
import {FileService, FileType} from "../file/file.service";
import {UserService} from "../user/user.service";
import {createTrackDto} from "./dto/create.track.dto";

@Injectable()
export class TrackService {

    constructor(
       @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
       @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
       private fileService: FileService,
       private userService: UserService
    ) {}

    async getAllTracks(): Promise<Track[]> {

        const tracksList = await this.trackModel.find().populate('comments').populate('artist')

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

        const user = await this.userService.getUserByEmail(dto.artist.email)
        const audioFile = this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username)
        const imageFile = this.fileService.createFile(FileType.IMAGE, image, 'track', user.username)

        const track = await this.trackModel.create({...dto, artist: user['id'], listens: 0, audio: audioFile, image: imageFile})

        return track
    }

    async deleteTrackById(id: ObjectId): Promise<any> {

        const track = await this.trackModel.findById(id).populate('artist')

        if(track) {

        }

        return 'done'
    }
}