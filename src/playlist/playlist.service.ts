import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Playlist, PlaylistDocument} from "./schema/playlist.schema";
import {Model, ObjectId} from "mongoose";
import {FileService, FileType} from "../file/file.service";
import {User, UserDocument} from "../user/schema/user.schema";
import {Track, TrackDocument} from "../track/schema/track.schema";
import {TrackService} from "../track/track.service";

@Injectable()
export class PlaylistService {

    private playlistException = (e) => new HttpException(`Playlist service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
        @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private trackService: TrackService,
        private fileService: FileService
    ) {}

    async getAllPlaylists(): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find()

        return playlists
    }

    async getPlaylistById(pId: ObjectId): Promise<Playlist> {

        const playlist = await this.playlistModel.findById(pId).populate(['user', 'tracks'])

        return playlist
    }

    async searchPlaylistByName(name: string): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find({
            name: {$regex: new RegExp(name, 'i')}
        })

        return playlists
    }

    async createPlaylist(uId, name, image): Promise<Playlist> {

        const user = await this.userModel.findById(uId)
        const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'playlist', user.username)
        const playlist = await this.playlistModel.create({name: name, user: user['id'], favorites: 0, image: imagePath})

        await user.updateOne({$push: {playlists: playlist['id']}})

        return playlist
    }

    async addPlaylistToCollection(uId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistDirectionsInCollection(uId, pId, true)
        return 'Playlist add into your collection successfully'
    }

    async removeTrackFromPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {
        return this.trackService.removeTrackFromPlaylist(uId, tId, pId)
    }

    async removePlaylistFromCollection(uId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistDirectionsInCollection(uId, pId, false)
        return 'Playlist remove from your collection successfully'
    }

    async deletePlaylist(uId: ObjectId, pId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const playlist = await this.playlistModel.findById(pId).populate('user')

        try {
            if (uId === playlist.user['id'] || user.roles.find(r => r.role === 'admin')) {
                await this.userModel.find().updateMany({}, {
                    $pullAll: {
                        playlists: [playlist],
                        playlistsCollection: [playlist]
                    }
                })

                await this.trackModel.find().updateMany({_id: [...playlist.tracks.map(id => id.toString())]}, {$inc: {favorites: -1}})

                this.fileService.removeFile(playlist.image, 'playlist', playlist.user.username)
                playlist.deleteOne()

                return 'Playlist deleted successfully'
            } else {
                throw new HttpException(`Permission denied`, HttpStatus.FORBIDDEN)
            }
        } catch (e) {
            throw this.playlistException(e)
        }
    }

    private async playlistDirectionsInCollection(uId: ObjectId, pId: ObjectId, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId)
        const playlist = await this.playlistModel.findById(pId)

        try {
            if(add) {
                if (!user.playlistsCollection.find(p => p.toString() === pId.toString())) {
                    await user.updateOne({$addToSet: {playlistsCollection: pId}})
                    await playlist.updateOne({$inc: {favorites: 1}})
                } else {
                    throw new HttpException(`You have this playlist already`, HttpStatus.BAD_REQUEST)
                }
            }

            if(!add) {
                if (user.playlistsCollection.find(p => p.toString() === pId.toString())) {
                    await user.updateOne({$pull: {playlistsCollection: pId}})
                    await playlist.updateOne({$inc: {favorites: -1}})
                } else {
                    throw new HttpException(`You have not playlist in your collection!`, HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.playlistException(e)
        }
    }
}