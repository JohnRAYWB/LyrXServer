import {ObjectId} from "mongoose";

export class banUserDto {

    readonly userId: ObjectId

    readonly banReason: string
}