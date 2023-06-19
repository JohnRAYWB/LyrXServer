import {HydratedDocument, ObjectId} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Track} from "../../track/schema/track.schema";
import * as mongoose from "mongoose";
import {Album} from "../../album/schema/album.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Transform, Type} from "class-transformer";

export type GenreDocument = HydratedDocument<Genre>

@Schema()
export class Genre {

    @Transform(({obj}) => obj._id.toString())
    _id: ObjectId

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    @Type(() => Track)
    tracks: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    @Type(() => Playlist)
    playlists: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    @Type(() => Album)
    albums: Album[]
}

export const GenreSchema = SchemaFactory.createForClass(Genre)