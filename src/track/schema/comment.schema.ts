import {HydratedDocument, ObjectId} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {User} from "../../user/schema/user.schema";
import {Track} from "./track.schema";
import {Transform, Type} from "class-transformer";

export type CommentDocument = HydratedDocument<Comment>

@Schema()
export class Comment {

    @Transform(({obj}) => obj._id.toString())
    _id: ObjectId

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    @Type(() => User)
    user: User

    @Prop()
    text: string

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Track'})
    @Type(() => Track)
    track: Track
}

export const CommentSchema = SchemaFactory.createForClass(Comment)