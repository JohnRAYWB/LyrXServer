import {ObjectId} from "mongoose";

export class addRoleDto {

    readonly uId: ObjectId

    readonly role: string
}