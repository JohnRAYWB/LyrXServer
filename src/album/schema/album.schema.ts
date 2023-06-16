import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {User} from "../../user/schema/user.schema";
import * as mongoose from "mongoose";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Genre} from "../../genre/schema/genre.schema";
import {Transform, Type} from "class-transformer";

export type AlbumDocument = HydratedDocument<Album>

@Schema()
export class Album extends Playlist{

    constructor() {
        super();
        this.user = this.artist
    }

    @Transform(({value}) => value.toString())
    _id: string

    @Prop()
    description: string

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}]})
    @Type(() => Genre)
    genre: Genre[]

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    @Type(() => User)
    artist: User
}

export const AlbumSchema = SchemaFactory.createForClass(Album)