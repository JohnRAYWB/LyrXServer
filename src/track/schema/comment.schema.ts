import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {User} from "../../user/schema/user.schema";
import {Track} from "./track.schema";

export type CommentDocument = HydratedDocument<Comment>

@Schema()
export class Comment {

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    user: User

    @Prop()
    text: string

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Track'})
    track: Track
}

export const CommentSchema = SchemaFactory.createForClass(Comment)