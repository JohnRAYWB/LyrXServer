import {User} from "../../user/schema/user.schema";

export class createTrackDto {

    readonly name: string

    readonly description: string

    readonly artist: User
}