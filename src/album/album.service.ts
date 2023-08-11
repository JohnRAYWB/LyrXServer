import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Album, AlbumDocument} from "./schema/album.schema";
import {Model, ObjectId, Schema} from "mongoose";
import {User, UserDocument} from "../user/schema/user.schema";
import {Track, TrackDocument} from "../track/schema/track.schema";
import {FileService, FileType} from "../file/file.service";
import {createAlbumDto} from "./dto/create.album.dto";
import {Comment, CommentDocument} from "../track/schema/comment.schema";
import {Playlist, PlaylistDocument} from "../playlist/schema/playlist.schema";
import {GenreService} from "../genre/genre.service";
import {Genre, GenreDocument} from "../genre/schema/genre.schema";
import {editAlbumDto} from "./dto/edit.album.dto";

@Injectable()
export class AlbumService {

    private albumException = (e) => new HttpException(`Album service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
        @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
        @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
        private genreService: GenreService,
        private fileService: FileService
    ) {
    }

    async getAllAlbums(limit = 10, page = 0): Promise<Album[]> {

        const albumsList = await this.albumModel.find()
            .limit(limit)
            .skip(page)
            .populate([
                {path: 'tracks'}
            ])

        return albumsList
    }

    async getMostLiked() {

        const albums = await this.albumModel.find().sort({favorites: -1}).limit(10)

        return albums
    }

    async getArtistsSortedAlbums(uId: ObjectId): Promise<Album[]> {

        const albums = await this.albumModel.find({
            artist: uId
        }).populate([
            {path: 'tracks'}
        ]).sort({favorites: -1})

        return albums
    }

    async getArtistsAlbums(uId: ObjectId, limit: number, page: number): Promise<Album[]> {

        const albums = await this.albumModel.find({artist: uId}).skip(page).limit(limit)

        return albums
    }

    async searchArtistsAlbums(uId: ObjectId, name: string): Promise<Album[]> {

        const albums = await this.albumModel.find({
            artist: uId,
            name: {$regex: new RegExp(name, 'i')}
        })

        return albums
    }

    async getAlbumById(aId: ObjectId): Promise<Album> {

        const album = await this.albumModel.findById(aId)
            .populate([
                {path: 'artist', select: '-password'},
                {path: 'genre'},
                {path: 'tracks', populate: 'album'},
            ])

        return album
    }

    async getAlbumsByGenre(gId: ObjectId): Promise<Album[]> {

        const albumsList = await this.albumModel.find({
            genre: gId
        })

        return albumsList
    }

    async searchAlbumByName(name: string): Promise<Album[]> {

        const albumsList = await this.albumModel.find({
            name: {$regex: new RegExp(name, 'i')}
        }).populate([
            {path: 'tracks'}
        ])

        return albumsList
    }

    async createAlbum(uId: ObjectId, dto: createAlbumDto, audio, image): Promise<Album> {

        try {
            const artist = await this.userModel.findById(uId)
            const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'album', artist.username)
            const aName = [artist.username, dto.name]
            const album = await this.albumModel.create({
                artist: artist._id,
                name: aName,
                description: dto.description,
                image: imagePath,
                createdTime: Date.now()
            })

            for (let gId of dto.genres) {
                const genre = await this.genreModel.findById(gId)

                await album.updateOne({$addToSet: {genre: gId}})
                await genre.updateOne({$addToSet: {albums: album._id}})
            }

            audio.map(async a => {
                const trackName = [artist.username, dto.trackName.shift()]
                const audio = this.fileService.createFile(FileType.AUDIO, a, 'track', artist.username)
                const track = await this.trackModel.create({
                    artist: artist._id,
                    name: trackName,
                    audio: audio,
                    image: imagePath,
                    album: album._id,
                    protectedDeletion: true,
                    createdTime: Date.now()
                })

                await artist.updateOne({$addToSet: {tracks: track._id}})
                await album.updateOne({$addToSet: {tracks: track._id}})
            })

            await artist.updateOne({$addToSet: {albums: album._id}})
            return album
        } catch (e) {
            throw this.albumException(e)
        }

    }

    async addGenre(uId: ObjectId, aId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, aId, gId, true)
        return 'Genre add successfully'
    }

    async addTrackToAlbum(uId: ObjectId, tId: ObjectId, aId: ObjectId): Promise<any> {

        await this.trackControl(uId, tId, aId, true)
        return 'Track add successfully'
    }

    async addAlbumToCollection(uId: ObjectId, aId: ObjectId): Promise<any> {

        await this.albumCollectionControl(uId, aId, true)
        return 'Album add successfully'
    }

    async editAlbumDescription(uId: ObjectId, aId: ObjectId, dto: editAlbumDto): Promise<any> {

        const album = await this.albumModel.findById(aId)

        try {
            if(album.artist.toString() === uId.toString()) {
                if (dto.name) {
                    await album.updateOne({$set: {name: dto.name}})
                }

                if (dto.description) {
                    await album.updateOne({$set: {description: dto.description}})
                }

                return 'Changes update successfully'
            } else {
                throw new HttpException(`It's not your album`, HttpStatus.BAD_REQUEST)
            }

        } catch (e) {
            throw this.albumException(e)
        }

    }

    async editAlbumImage(uId: ObjectId, aId: ObjectId, image): Promise<any> {

        const album = await this.albumModel.findById(aId).populate('artist')

        try {
            if(album.artist._id.toString() === uId.toString()) {
                const imageFile = this.fileService.updateFile(album.image, image, FileType.IMAGE, 'album', album.artist.username)
                await album.updateOne({$set: {image: imageFile}})

                for(let tId of album.tracks) {
                    const track = await this.trackModel.findById(tId)

                    await track.updateOne({$set: {image: imageFile}})
                }

                return 'Image update successfully'
            } else {
                throw new HttpException(`It's not your album`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.albumException(e)
        }
    }

    async removeGenre(uId: ObjectId, aId: ObjectId, gId: ObjectId): Promise<any> {

        await this.genreControl(uId, aId, gId, false)
        return 'Genre remove successfully'
    }

    async removeTrackFromAlbum(uId: ObjectId, tId: ObjectId, aId: ObjectId): Promise<any> {

        await this.trackControl(uId, tId, aId, false)
        return 'Track removed successfully'
    }

    async removeAlbumFromCollection(uId: ObjectId, aId: ObjectId): Promise<any> {

        await this.albumCollectionControl(uId, aId, false)
        return 'Album remove successfully'
    }

    async deleteAlbum(uId: ObjectId, aId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const album = await this.albumModel.findById(aId).populate(['artist', 'tracks'])

        try {
            if (album.artist._id.toString() === user._id.toString() || user.roles.findIndex(r => r.role === 'admin') !== -1) {
                for (let track of album.tracks) {
                    await this.removeTrackFromAlbum(uId, track._id, aId)
                }
                await this.userModel.find().updateMany({}, {
                    $pullAll: {
                        albumsCollection: [album],
                        albums: [album]
                    }
                })
                await this.genreModel.find().updateMany({}, {$pullAll: {albums: [album]}})
                this.fileService.removeFile(album.image, 'album', album.artist.username)
                album.deleteOne()

                return 'Album delete successfully'
            } else {
                throw new HttpException('Permission denied', HttpStatus.FORBIDDEN)
            }
        } catch (e) {
            throw this.albumException(e)
        }
    }

    private async genreControl(uId: ObjectId, aId: ObjectId, gId: ObjectId, add: boolean) {

        const user = await this.userModel.findById(uId).populate('roles')
        const album = await this.albumModel.findById(aId)

        try {
            if (album.artist.toString() === uId.toString()) {
                if (add) {
                    if (album.genre.findIndex(g => g.toString() === gId.toString()) === -1) {
                        await this.genreService.addEntityToGenre(gId, aId, 'album')
                        await album.updateOne({$addToSet: {genre: gId}})
                    } else {
                        throw new HttpException('Album has this genre already', HttpStatus.BAD_REQUEST)
                    }
                }

                if (!add) {
                    if (album.genre.findIndex(g => g.toString() === gId.toString()) !== -1) {
                        await this.genreService.removeEntityFromGenre(gId, aId, 'album')
                        await album.updateOne({$pull: {genre: gId}})
                    } else {
                        throw new HttpException('Album has not this genre', HttpStatus.BAD_REQUEST)
                    }
                }
            } else {
                throw new HttpException(`It's not your playlist`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.albumException(e)
        }
    }

    private async trackControl(uId: ObjectId, tId: ObjectId, aId: ObjectId, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const track = await this.trackModel.findById(tId)
        const album = await this.albumModel.findById(aId)

        try {
            if (track.artist.toString() === uId.toString() || user.roles.findIndex(r => r.role === 'admin') !== -1) {
                if (add) {
                    if (album.tracks.findIndex(t => t.toString() === tId.toString()) === -1) {
                        this.fileService.removeFile(track.image, 'track', track.name.shift())
                        await track.updateOne({$set: {album: aId, image: album.image, protectedDeletion: true}})
                        await album.updateOne({$addToSet: {tracks: tId}})
                    } else {
                        throw new HttpException('Album already has this track', HttpStatus.BAD_REQUEST)
                    }
                }

                if (!add) {
                    if (album.tracks.findIndex(t => t.toString() === tId.toString()) !== -1) {
                        const imagePath = this.fileService.copyFile(album.image, 'image', 'album', 'track', track.name.shift())
                        await track.updateOne({$unset: {album: ''}, $set: {image: imagePath, protectedDeletion: false}})
                        await album.updateOne({$pull: {tracks: tId}})
                    } else {
                        throw new HttpException('Album has not this track', HttpStatus.BAD_REQUEST)
                    }
                }
            } else {
                throw new HttpException('Permission denied', HttpStatus.FORBIDDEN)
            }
        } catch (e) {
            throw this.albumException(e)
        }
    }

    private async albumCollectionControl(uId: ObjectId, aId: ObjectId, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId)
        const album = await this.albumModel.findById(aId)

        try {
            if (add) {
                if (user.albumsCollection.findIndex(p => p.toString() === aId.toString()) === -1) {
                    await user.updateOne({$addToSet: {albumsCollection: aId}})
                    await album.updateOne({$inc: {favorites: 1}})
                } else {
                    throw new HttpException('You have this album already', HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.albumsCollection.findIndex(p => p.toString() === aId.toString()) !== -1) {
                    await user.updateOne({$pull: {albumsCollection: aId}})
                    await album.updateOne({$inc: {favorites: -1}})
                } else {
                    throw new HttpException('You have not this album yet', HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.albumException(e)
        }
    }
}