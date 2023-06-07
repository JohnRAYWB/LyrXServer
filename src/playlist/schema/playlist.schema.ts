import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {User} from "../../user/schema/user.schema";
import {Track} from "../../track/schema/track.schema";

export type PlaylistDocument = HydratedDocument<Playlist>

@Schema()
export class Playlist {

    @Prop()
    name: string

    @Prop()
    image: string

    @Prop({default: 0})
    favorites: number

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    user: User

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    tracks: Track[]
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist)