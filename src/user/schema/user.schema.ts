import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {Role} from "../../role/schema/role.schema";

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {

    @Prop()
    email: string

    @Prop()
    password: string

    @Prop()
    username: string

    @Prop()
    about: string

    @Prop()
    avatar: string

    @Prop({type: Date})
    birth: Date

    @Prop()
    ban: boolean

    @Prop()
    banReason: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}]})
    roles: Role[]
}

export const UserSchema = SchemaFactory.createForClass(User)