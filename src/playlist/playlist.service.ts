import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Playlist, PlaylistDocument} from "./schema/playlist.schema";
import {Model, ObjectId} from "mongoose";
import {FileService, FileType} from "../file/file.service";
import {User, UserDocument} from "../user/schema/user.schema";
import {addTrackToPlaylistDto} from "./dto/add.track.to.playlist.dto";
import {TrackService} from "../track/track.service";
import {Track, TrackDocument} from "../track/schema/track.schema";

@Injectable()
export class PlaylistService {

    constructor(
        @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
        @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private trackService: TrackService,
        private fileService: FileService
    ) {
    }

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
        const playlist = await this.playlistModel.create({name: name, user: user['id'], favorites: 0, image: imagePath})

        user.playlistsCollection.push(playlist['id'])
        user.save()

        return playlist
    }

    async addTrackToPlaylist(dto: addTrackToPlaylistDto): Promise<Playlist> {

        const track = await this.trackModel.findById(dto.track)
        const playlist = await this.playlistModel.findById(dto.playlist).populate('tracks').populate('user')
        const user = await this.userModel.findById(dto.user)

        if(playlist.user['id'] === user['id']) {
            playlist.tracks.push(track['id'])
            track.favorites++

            playlist.save()
            track.save()

            return playlist
        } else {
            throw new HttpException('Something goes wrong', HttpStatus.BAD_REQUEST)
        }
    }

    async removeTrackFromPlaylist(dto: addTrackToPlaylistDto): Promise<Playlist> {

        const track = await this.trackModel.findById(dto.track)
        const playlist = await this.playlistModel.findById(dto.playlist).populate('user')
        const user = await this.userModel.findById(dto.user)

        if(playlist.user['id'] === user['id'] && playlist.tracks.includes(track['id'])) {
            playlist.tracks.splice(playlist.tracks.indexOf(track['id']), 1)
            track.favorites--

            playlist.save()
            track.save()

            return playlist
        } else {
            throw new HttpException('Something goes wrong', HttpStatus.BAD_REQUEST)
        }
    }

    async addPlaylistToCollection(pId: ObjectId, uId: ObjectId): Promise<any> {

        const playlist = await this.playlistModel.findById(pId)
        const user = await this.userModel.findById(uId)

        if (playlist && user && !user.playlistsCollection.includes(playlist['id'])) {
            user.playlistsCollection.push(playlist['id'])
            playlist.favorites++

            user.save()
            playlist.save()

            return 'done'
        } else {
            throw new HttpException('Seems like you have already this playlist in your collection', HttpStatus.BAD_REQUEST)
        }
    }

    async removePlaylistFromCollection(pId: ObjectId, uId: ObjectId): Promise<any> {

        const playlist = await this.playlistModel.findById(pId).populate('user')
        const user = await this.userModel.findById(uId)

        if (user.playlistsCollection.includes(playlist['id']) && user['id'] !== playlist.user['id']) {
            user.playlistsCollection.splice(user.playlistsCollection.indexOf(playlist['id']), 1)
            playlist.favorites--

            user.save()
            playlist.save()

            return 'done'
        } else {
            throw new HttpException('Something goes wrong', HttpStatus.BAD_REQUEST)
        }
    }

    async deletePlaylist(pId: ObjectId, uId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const playlist = await this.playlistModel.findById(pId).populate('user')
        const users = await this.userModel.find().populate('playlistsCollection')

        if (user['id'] === playlist.user['id'] || user.roles.find(role => role.role === 'admin')) {
            users.map(user => {
                user.playlistsCollection.map(uPlaylist => {
                    if(uPlaylist['id'] === playlist['id']) {
                        user.playlistsCollection.splice(user.playlistsCollection.indexOf(uPlaylist['id']), 1)
                    }
                })

                user.save()
            })

            this.fileService.removeFile(playlist.image, 'playlist', playlist.user.username)

            playlist.deleteOne()
        } else {
            throw new HttpException('Playlist service: Permission denied', HttpStatus.FORBIDDEN)
        }

        return 'done'
    }
}