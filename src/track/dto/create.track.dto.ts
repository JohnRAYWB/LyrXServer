import {User} from "../../user/schema/user.schema";
import {Contains} from "class-validator";

export class createTrackDto {

    @Contains(' - ', {message: `Please, make sure your track name has form 'Artist(s) name' - 'Song name`})
    readonly name: string

    readonly description: string

    readonly artist: User
}