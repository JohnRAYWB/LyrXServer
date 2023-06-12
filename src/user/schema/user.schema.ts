import {HydratedDocument} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {Role} from "../../role/schema/role.schema";
import {Comment} from "../../track/schema/comment.schema";
import {Track} from "../../track/schema/track.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Album} from "../../album/schema/album.schema";

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {

    @Prop()
    email: string

    @Prop()
    password: string

    @Prop()
    username: string

    @Prop()
    about: string

    @Prop()
    avatar: string

    @Prop({type: Date})
    birth: Date

    @Prop()
    ban: boolean

    @Prop()
    banReason: String[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]})
    followers: User[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]})
    followings: User[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}]})
    roles: Role[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]})
    comments: Comment[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    tracks: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    tracksCollection: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    playlists: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    playlistsCollection: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    albums: Album[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    albumsCollection: Album[]
}

export const UserSchema = SchemaFactory.createForClass(User)