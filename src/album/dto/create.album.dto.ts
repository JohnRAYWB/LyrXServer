import {Genre} from "../../genre/schema/genre.schema";

export class createAlbumDto {

    readonly name: string

    readonly description: string

    readonly trackName: String[]

    readonly genres: Genre[]
}