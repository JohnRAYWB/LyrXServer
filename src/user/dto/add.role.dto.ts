import {ObjectId} from "mongoose";

export class addRoleDto {

    readonly userId: ObjectId

    readonly role: string
}