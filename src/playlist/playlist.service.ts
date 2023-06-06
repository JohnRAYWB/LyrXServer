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

    async getPlaylistById(pId: ObjectId): Promise<Playlist> {

        const playlist = await this.playlistModel.findById(pId).populate('tracks')

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

    /*async dropAlbum(name, audio, image, uId, trackName): Promise<Playlist> {

        const user = await this.userModel.findById(uId)
        const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'album', user.username)
        const playlist = await this.playlistModel.create({name: name, user: user['id'], favorites: 0, image: imagePath})

        const audioPath = audio.map(audio => this.fileService.createFile(FileType.AUDIO, audio, 'track', user.username))

        for(let i = 0; i < audioPath.length; i++) {
            if(i === audioPath.length - 1) {
                user.albums.push(playlist['id'])
            }

            const track = await this.trackModel.create({name: trackName[i], artist: user['id'], listens: 0, favorites: 0, audio: audioPath[i], image: playlist.image})

            playlist.tracks.push(track['id'])
            user.tracks.push(track['id'])

            await playlist.save()
            user.save()
        }

        return playlist
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
    }*/

    async removeTrackFromPlaylist(uId: ObjectId, tId: ObjectId, pId: ObjectId): Promise<any> {
        return this.trackService.removeTrackFromPlaylist(uId, tId, pId)
    }

    /*async removePlaylistFromCollection(pId: ObjectId, uId: ObjectId): Promise<any> {

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
    }*/

    /*async deletePlaylist(pId: ObjectId, uId: ObjectId): Promise<any> {

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
    }*/
}