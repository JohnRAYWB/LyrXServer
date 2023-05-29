import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {User} from "../../user/schema/user.schema";
import * as mongoose from "mongoose";
import {Comment} from "./comment.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";

export type TrackDocument = HydratedDocument<Track>

@Schema()
export class Track {

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    artist: User

    @Prop()
    listens: number

    @Prop()
    favorites: number

    @Prop()
    audio: string

    @Prop()
    image: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]})
    comments: Comment[]

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'})
    playlist: Playlist
}

export const TrackSchema = SchemaFactory.createForClass(Track)