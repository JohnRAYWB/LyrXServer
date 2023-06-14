import {Module} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {MongooseModule} from "@nestjs/mongoose";
import {Playlist, PlaylistSchema} from "./schema/playlist.schema";
import {PlaylistController} from "./playlist.controller";
import {FileService} from "../file/file.service";
import {User, UserSchema} from "../user/schema/user.schema";
import {Track, TrackSchema} from "../track/schema/track.schema";
import {GenreModule} from "../genre/genre.module";
import {Genre, GenreSchema} from "../genre/schema/genre.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Playlist.name, schema: PlaylistSchema}]),
        MongooseModule.forFeature([{name: Track.name, schema: TrackSchema}]),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Genre.name, schema: GenreSchema}]),
        GenreModule
    ],
    controllers: [PlaylistController],
    providers: [
        PlaylistService,
        FileService
    ],
    exports: [PlaylistService]
})

export class PlaylistModule {}