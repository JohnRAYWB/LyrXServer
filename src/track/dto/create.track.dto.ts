import {Genre} from "../../genre/schema/genre.schema";

export class createTrackDto {

    readonly name: string

    readonly description: string

    readonly genres: Genre[]
}