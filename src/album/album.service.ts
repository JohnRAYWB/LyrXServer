import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Album, AlbumDocument} from "./schema/album.schema";
import {Model, ObjectId} from "mongoose";
import {User, UserDocument} from "../user/schema/user.schema";
import {Track, TrackDocument} from "../track/schema/track.schema";
import {FileService, FileType} from "../file/file.service";
import {createAlbumDto} from "./dto/create.album.dto";
import {TrackService} from "../track/track.service";

@Injectable()
export class AlbumService {

    constructor(
       @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
       @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
       @InjectModel(User.name) private userModel: Model<UserDocument>,
       private trackService: TrackService,
       private fileService: FileService
    ) {}

    async getAllAlbums(): Promise<Album[]> {

        const albumsList = await this.albumModel.find()

        return albumsList
    }

    async getAlbumById(aId: ObjectId): Promise<Album> {

        const album = await this.albumModel.findById(aId).populate(['tracks'])

        return album
    }

    async searchAlbumByName(name: string): Promise<Album[]> {

        const albumsList = await this.albumModel.find({
            name: {$regex: new RegExp(name, 'i')}
        })

        return albumsList
    }

    async createAlbum(uId: ObjectId, dto: createAlbumDto, audio, image): Promise<Album> {

        try{
            const artist = await this.userModel.findById(uId)
            const imagePath = this.fileService.createFile(FileType.IMAGE, image, 'album', artist.username)
            const album = await this.albumModel.create({artist: artist['id'], name: dto.name, description: dto.description, image: imagePath})

            audio.map(async a => {

                const audio = this.fileService.createFile(FileType.AUDIO, a, 'track', artist.username)
                const track = await this.trackModel.create({
                    artist: artist['id'],
                    name: dto.trackName.shift(),
                    audio: audio,
                    image: imagePath,
                    album: album['id'],
                    protectedDeletion: true
                })

                await artist.updateOne({$addToSet: {tracks: track['id']}})
                await album.updateOne({$addToSet: {tracks: track['id']}})
            })

            await artist.updateOne({$addToSet: {albums: album['id']}})
            return album
        } catch (e) {
            throw new HttpException(`Album service: Something goes wrong. Error: ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }

    async addTrackToAlbum(uId: ObjectId, tId: ObjectId, aId: ObjectId): Promise<any> {

        await this.trackDirectionsInAlbum(uId, tId, aId, true)
        return 'Track add successfully'
    }

    async removeTrackFromAlbum(uId: ObjectId, tId: ObjectId, aId: ObjectId): Promise<any> {

        await this.trackDirectionsInAlbum(uId, tId, aId, false)
        return 'Track removed successfully'
    }

    async deleteTrack(uId: ObjectId, tId: ObjectId): Promise<any> {

    }

    async deleteAlbum(): Promise<any> {

    }

    private async trackDirectionsInAlbum(uId: ObjectId, tId: ObjectId, aId: ObjectId, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId)
        const track = await this.trackModel.findById(tId)
        const album = await this.albumModel.findById(aId)

        try {
            if(track.artist.toString() === user['id'] && user.albums.find(a => a.toString() === aId.toString())) {
                if(add) {
                    if(!album.tracks.find(t => t.toString() === tId.toString())) {
                        this.fileService.removeFile(track.image, 'track', user.username)
                        await track.updateOne({$set: {album: aId, image: album.image, protectedDeletion: true}})
                        await album.updateOne({$addToSet: {tracks: tId}})
                    } else {
                        throw new HttpException('Album already has this track', HttpStatus.BAD_REQUEST)
                    }
                }

                if(!add) {
                    if(album.tracks.find(t => t.toString() === tId.toString())) {
                        const imagePath = this.fileService.copyFile(album.image, 'image', 'album', 'track', user.username)
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
            throw new HttpException(`Album service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)
        }
    }
}