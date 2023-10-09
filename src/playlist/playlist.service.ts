import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Playlist, PlaylistDocument} from "./schema/playlist.schema";
import {Model, ObjectId} from "mongoose";
import {FileService, FileType} from "../file/file.service";
import {User, UserDocument} from "../user/schema/user.schema";
import {Track, TrackDocument} from "../track/schema/track.schema";
import {GenreService} from "../genre/genre.service";
import {Genre, GenreDocument} from "../genre/schema/genre.schema";
import {editPlaylistDto} from "./dto/edit.playlist.dto";
import {createPlaylistDto} from "./dto/create.playlist.dto";

@Injectable()
export class PlaylistService {

    private playlistException = (e) => new HttpException(`Playlist service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
        @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
        private genreService: GenreService,
        private fileService: FileService
    ) {
    }

    async getAllPlaylists(limit = 10, page = 0): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find().limit(limit).skip(page).populate('tracks')

        return playlists
    }

    async getMostLiked(): Promise<Playlist[]> {
        const playlists = await this.playlistModel.find().sort({favorites: -1}).limit(10).populate('tracks')

        return playlists
    }

    async getPlaylistById(pId: ObjectId): Promise<Playlist> {

        const playlist = await this.playlistModel.findById(pId)
            .populate([
                {path: 'user', select: '-password'},
                {path: 'genre'},
                {path: 'tracks', populate: 'album'}
            ])
        return playlist
    }

    async getPlaylistsByGenre(gId: ObjectId): Promise<Playlist[]> {
        const playlists = await this.playlistModel.find({
            genre: gId
        })

        return playlists
    }

    async getUsersPlaylists(uId: ObjectId): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find({user: uId}).populate([
            {path: 'tracks', populate: 'album'},
            {path: 'genre'}
        ])

        return playlists
    }

    async getUsersPlaylistsCollection(uId: ObjectId): Promise<Playlist[]> {

        const user = await this.userModel.findById(uId).populate('playlistsCollection')
        const playlistsCollection = []

        for(let uPlaylist of user.playlistsCollection) {
            const playlist = await this.playlistModel.findById(uPlaylist._id).populate([
                {path: 'tracks', populate: 'album'},
                {path: 'genre'}
            ])

            playlistsCollection.push(playlist)
        }
        return playlistsCollection
    }

    async searchPlaylistByName(name: string): Promise<Playlist[]> {

        const playlists = await this.playlistModel.find({
            name: {$regex: new RegExp(name, 'i')}
        })

        return playlists
    }

    async createPlaylist(uId: ObjectId, dto: createPlaylistDto, image): Promise<Playlist> {

        try {
            const user = await this.userModel.findById(uId)
            const pName = [user.username, dto.name]
            const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'playlist', user.username)
            const playlist = await this.playlistModel.create({
                name: pName,
                description: dto.description,
                user: user._id,
                favorites: 0,
                image: imagePath,
                createdTime: Date.now()
            })

            for(let gId of dto.genres) {
                const genre = await this.genreModel.findById(gId)

                await playlist.updateOne({$addToSet: {genre: gId}})
                await genre.updateOne({$addToSet: {playlists: playlist._id}})
            }

            await user.updateOne({$push: {playlists: playlist._id}})

            return playlist
        } catch (e) {
            throw this.playlistException(e)
        }

    }

    async addGenre(uId: ObjectId, pId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, pId, gId, true)
        return 'Genre add successfully'
    }

    async addPlaylistToCollection(uId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistCollectionControl(uId, pId, true)
        return 'Playlist add into your collection successfully'
    }

    async editPlaylistDescription(uId: ObjectId, pId: ObjectId, dto: editPlaylistDto): Promise<any> {

        const playlist = await this.playlistModel.findById(pId)

        try {
            if(playlist.user.toString() === uId.toString()) {
                if(dto.name) {
                    await playlist.updateOne({$set: {name: dto.name}})
                }

                if(dto.description) {
                    await playlist.updateOne({$set: {description: dto.description}})
                }

                return "Changes update successfully"
            } else {
                throw new HttpException(`It's not your playlist`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.playlistException(e)
        }
    }

    async editPlaylistImage(uId: ObjectId, pId: ObjectId, image): Promise<any> {

        const playlist = await this.playlistModel.findById(pId).populate('user')

        try {
            if(playlist.user._id.toString() === uId.toString()) {
                const imageFile = this.fileService.updateFile(playlist.image, image, FileType.IMAGE, 'playlist', playlist.user.username)
                await playlist.updateOne({$set: {image: imageFile}})

                return 'Image update successfully'
            } else {
                throw new HttpException(`It's not your playlist`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.playlistException(e)
        }
    }

    async removeGenre(uId: ObjectId, pId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, pId, gId, false)
        return 'Genre remove successfully'
    }

    async removePlaylistFromCollection(uId: ObjectId, pId: ObjectId): Promise<any> {

        await this.playlistCollectionControl(uId, pId, false)
        return 'Playlist remove from your collection successfully'
    }

    async deletePlaylist(uId: ObjectId, pId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const playlist = await this.playlistModel.findById(pId).populate('user')

        try {
            if (uId.toString() === playlist.user._id.toString() || user.roles.findIndex(r => r.role === 'admin') !== -1) {
                await this.userModel.find().updateMany({}, {
                    $pullAll: {
                        playlists: [playlist],
                        playlistsCollection: [playlist]
                    }
                })

                await this.genreModel.find().updateMany({}, {$pullAll: {playlists: [playlist]}})
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

    private async genreControl(uId: ObjectId, pId: ObjectId, gId: ObjectId, add: boolean) {

        const playlist = await this.playlistModel.findById(pId)

        try {
            if (playlist.user.toString() === uId.toString()) {
                if (add) {
                    if (playlist.genre.findIndex(g => g.toString() === gId.toString()) === -1) {
                        await this.genreService.addEntityToGenre(gId, pId, 'playlist')
                        await playlist.updateOne({$addToSet: {genre: gId}})
                    } else {
                        throw new HttpException('Playlist has this genre already', HttpStatus.BAD_REQUEST)
                    }
                }

                if (!add) {
                    if (playlist.genre.findIndex(g => g.toString() === gId.toString()) !== -1) {
                        await this.genreService.removeEntityFromGenre(gId, pId, 'playlist')
                        await playlist.updateOne({$pull: {genre: gId}})
                    } else {
                        throw new HttpException('Playlist has not this genre', HttpStatus.BAD_REQUEST)
                    }
                }
            } else {
                throw new HttpException(`It's not your playlist`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.playlistException(e)
        }
    }

    private async playlistCollectionControl(uId: ObjectId, pId: ObjectId, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId)
        const playlist = await this.playlistModel.findById(pId)

        try {
            if (add) {
                if (user.playlistsCollection.findIndex(p => p.toString() === pId.toString()) === -1) {
                    await user.updateOne({$addToSet: {playlistsCollection: pId}})
                    await playlist.updateOne({$inc: {favorites: 1}})
                } else {
                    throw new HttpException(`You have this playlist already`, HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.playlistsCollection.findIndex(p => p.toString() === pId.toString()) !== -1) {
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