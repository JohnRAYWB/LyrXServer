import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Playlist, PlaylistDocument} from "./schema/playlist.schema";
import {Model, ObjectId} from "mongoose";
import {FileService, FileType} from "../file/file.service";
import {User, UserDocument} from "../user/schema/user.schema";

@Injectable()
export class PlaylistService {

    constructor(
       @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
       @InjectModel(User.name) private userModel: Model<UserDocument>,
       private fileService: FileService
    ) {}

    async getAllPlaylists(): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find()

        return playlists
    }

    async getPlaylistById(id: ObjectId): Promise<Playlist> {

        const playlist = await this.playlistModel.findById(id).populate('tracks')

        return playlist
    }

    async searchPlaylistByName(name: string): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find({
            name: {$regex: new RegExp(name, 'i')}
        })

        return playlists
    }

    async createPlaylist(userId, name, image): Promise<Playlist> {

        const user = await this.userModel.findById(userId)
        const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'playlist', user.username)
        const playlist = await this.playlistModel.create({name: name, user: user['id'], likes: 0, image: imagePath})

        return playlist
    }

    async deletePlaylist(pId: ObjectId, uId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const playlist = await this.playlistModel.findById(pId).populate('user')

        if(user['id'] === playlist.user['id'] || user.roles.find(role => role.role === 'admin')) {
            this.fileService.removeFile(playlist.image, 'playlist', playlist.user.username)

            playlist.deleteOne()
        } else {
            throw new HttpException('Playlist service: Permission denied', HttpStatus.FORBIDDEN)
        }

        return 'done'
    }
}