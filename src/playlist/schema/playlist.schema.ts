import {HydratedDocument, ObjectId} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {User} from "../../user/schema/user.schema";
import {Track} from "../../track/schema/track.schema";
import {Genre} from "../../genre/schema/genre.schema";
import {Transform, Type} from "class-transformer";

export type PlaylistDocument = HydratedDocument<Playlist>

@Schema()
export class Playlist {

    @Transform(({obj}) => obj._id.toString())
    _id: ObjectId

    @Prop({required: true})
    name: string

    @Prop({required: true})
    description: string

    @Prop({required: true})
    image: string

    @Prop({default: 0})
    favorites: number

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    @Type(() => User)
    user: User

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}]})
    @Type(() => Genre)
    genre: Genre[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    @Type(() => Track)
    tracks: Track[]
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist)