import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {User} from "../../user/schema/user.schema";
import * as mongoose from "mongoose";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Genre} from "../../genre/schema/genre.schema";

export type AlbumDocument = HydratedDocument<Album>

@Schema()
export class Album extends Playlist{

    constructor() {
        super();
        this.user = this.artist
    }

    @Prop()
    description: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}]})
    genre: Genre[]

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    artist: User
}

export const AlbumSchema = SchemaFactory.createForClass(Album)