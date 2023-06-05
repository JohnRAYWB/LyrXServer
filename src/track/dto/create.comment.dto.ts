import {ObjectId} from "mongoose";

export class createCommentDto {

    readonly text: string

    readonly track: ObjectId
}