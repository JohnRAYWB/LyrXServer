import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {User} from "../../user/schema/user.schema";
import * as mongoose from "mongoose";
import {Comment} from "./comment.schema";
import {Album} from "../../album/schema/album.schema";
import {Genre} from "../../genre/schema/genre.schema";
import {Transform, Type} from "class-transformer";

export type TrackDocument = HydratedDocument<Track>

@Schema()
export class Track {

    @Transform(({value}) => value.toString())
    _id: string

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
    @Type(() => User)
    artist: User

    @Prop({default: false})
    protectedDeletion: boolean

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Album'})
    @Type(() => Album)
    album: Album

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}]})
    @Type(() => Genre)
    genre: Genre[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]})
    @Type(() => Comment)
    comments: Comment[]
}

export const TrackSchema = SchemaFactory.createForClass(Track)