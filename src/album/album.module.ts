import {Module} from "@nestjs/common";
import {AlbumController} from "./album.controller";
import {AlbumService} from "./album.service";
import {MongooseModule} from "@nestjs/mongoose";
import {Album, AlbumSchema} from "./schema/album.schema";
import {Track, TrackSchema} from "../track/schema/track.schema";
import {User, UserSchema} from "../user/schema/user.schema";
import {Comment, CommentSchema} from "../track/schema/comment.schema";
import {Playlist, PlaylistSchema} from "../playlist/schema/playlist.schema";
import {FileService} from "../file/file.service";
import {GenreModule} from "../genre/genre.module";
import {Genre, GenreSchema} from "../genre/schema/genre.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Album.name, schema: AlbumSchema}]),
        MongooseModule.forFeature([{name: Playlist.name, schema: PlaylistSchema}]),
        MongooseModule.forFeature([{name: Track.name, schema: TrackSchema}]),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Comment.name, schema: CommentSchema}]),
        MongooseModule.forFeature([{name: Genre.name, schema: GenreSchema}]),
        GenreModule
    ],
    controllers: [AlbumController],
    providers: [
        AlbumService,
        FileService
    ],
    exports: [AlbumService]
})

export class AlbumModule {}