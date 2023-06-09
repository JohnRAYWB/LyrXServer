import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {User} from "../../user/schema/user.schema";
import * as mongoose from "mongoose";
import {Comment} from "./comment.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Album} from "../../album/schema/album.schema";

export type TrackDocument = HydratedDocument<Track>

@Schema()
export class Track {

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop({default: 0})
    listens: number

    @Prop({default: 0})
    favorites: number

    @Prop()
    audio: string

    @Prop()
    image: string

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    artist: User

    @Prop({default: false})
    protectedDeletion: boolean

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Album'})
    album: Album

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]})
    comments: Comment[]
}

export const TrackSchema = SchemaFactory.createForClass(Track)