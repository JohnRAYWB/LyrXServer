import {ObjectId} from "mongoose";

export class banUserDto {

    readonly uId: ObjectId

    readonly banReason: string
}