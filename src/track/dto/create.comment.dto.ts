import {User} from "../../user/schema/user.schema";
import {ObjectId} from "mongoose";

export class createCommentDto {

    readonly user: User

    readonly text: string

    readonly track: ObjectId
}