import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Track} from "../../track/schema/track.schema";
import * as mongoose from "mongoose";
import {Album} from "../../album/schema/album.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";

export type GenreDocument = HydratedDocument<Genre>

@Schema()
export class Genre {

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    tracks: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    playlists: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    albums: Album[]
}

export const GenreSchema = SchemaFactory.createForClass(Genre)