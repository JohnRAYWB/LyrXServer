import {Genre} from "../../genre/schema/genre.schema";

export class createPlaylistDto {

    readonly name: string

    readonly description: string

    readonly genres: Genre[]
}