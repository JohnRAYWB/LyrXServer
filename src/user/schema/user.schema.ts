import {HydratedDocument, ObjectId} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {Role} from "../../role/schema/role.schema";
import {Comment} from "../../track/schema/comment.schema";
import {Track} from "../../track/schema/track.schema";
import {Playlist} from "../../playlist/schema/playlist.schema";
import {Album} from "../../album/schema/album.schema";
import {Exclude, Transform, Type} from "class-transformer";

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {

    @Transform(({obj}) => obj._id.toString())
    _id: ObjectId

    @Prop({unique: true})
    email: string

    @Prop()
    @Exclude()
    password: string

    @Prop({unique: true})
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

    @Prop({type: Date})
    createdTime: Date

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]})
    @Type(() => User)
    followers: User[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]})
    @Type(() => User)
    followings: User[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}]})
    @Type(() => Role)
    roles: Role[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]})
    @Type(() => Comment)
    comments: Comment[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    @Type(() => Track)
    tracks: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Track'}]})
    @Type(() => Track)
    tracksCollection: Track[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    @Type(() => Playlist)
    playlists: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'}]})
    @Type(() => Playlist)
    playlistsCollection: Playlist[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    @Type(() => Album)
    albums: Album[]

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Album'}]})
    @Type(() => Album)
    albumsCollection: Album[]
}

export const UserSchema = SchemaFactory.createForClass(User)