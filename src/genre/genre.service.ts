import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Genre, GenreDocument} from "./schema/genre.schema";
import {Model, ObjectId} from "mongoose";
import {createGenreDto} from "./dto/create.genre.dto";
import {UserService} from "../user/user.service";
import {AlbumService} from "../album/album.service";
import {PlaylistService} from "../playlist/playlist.service";
import {TrackService} from "../track/track.service";

@Injectable()
export class GenreService {

    private genreException = (e) => new HttpException(`Genre service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
       @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    ) {}

    async getAllGenres(): Promise<Genre[]> {

        const genresList = await this.genreModel.find()

        return genresList
    }

    async getGenreById(gId: ObjectId): Promise<Genre> {

        const genre = await this.genreModel.findById(gId)

        return genre
    }

    async createGenre(dto: createGenreDto): Promise<Genre> {

        const checkGenre = await this.genreModel.findOne({
            name: {$regex: new RegExp(dto.name, 'i')}
        })

        try {
            if(!checkGenre) {
                const genre = await this.genreModel.create(dto)

                return genre
            } else {
                throw new HttpException('This genre exist already', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.genreException(e)
        }
    }

    async addEntityToGenre(gId: ObjectId, eId: ObjectId, entity: string): Promise<any> {

        await this.entityDirectionsControl(gId, eId, entity, true)
        return 'Add to genre successfully'
    }

    async removeEntityFromGenre(gId: ObjectId, eId: ObjectId, entity: string): Promise<any> {

        await this.entityDirectionsControl(gId, eId, entity, false)
        return 'Remove from genre successfully'
    }

    async deleteGenre(): Promise<any> {

    }

    private async entityDirectionsControl(gId: ObjectId, eId: ObjectId, entity: string, add: boolean): Promise<any> {

        const genre = await this.genreModel.findById(gId)

        try {
            if(add) {
                switch(entity) {
                    case 'track':
                        await genre.updateOne({$addToSet: {tracks: eId}})
                        break;
                    case 'playlist':
                        await genre.updateOne({$addToSet: {playlists: eId}})
                        break;
                    case 'album' :
                        await genre.updateOne({$addToSet: {albums: eId}})
                        break;
                    default:
                        throw new HttpException('Can not found needed entity. Check one more time', HttpStatus.BAD_REQUEST)
                }
            }

            if(!add) {
                switch(entity) {
                    case 'track':
                        await genre.updateOne({$pull: {tracks: eId}})
                        break;
                    case 'playlist':
                        await genre.updateOne({$pull: {playlists: eId}})
                        break;
                    case 'album' :
                        await genre.updateOne({$pull: {albums: eId}})
                        break;
                    default:
                        throw new HttpException('Can not found needed entity. Check one more time', HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.genreException(e)
        }
    }
}