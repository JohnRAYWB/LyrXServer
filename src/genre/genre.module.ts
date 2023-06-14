import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {Genre, GenreSchema} from "./schema/genre.schema";
import {GenreController} from "./genre.controller";
import {GenreService} from "./genre.service";
import {Track, TrackSchema} from "../track/schema/track.schema";
import {Playlist, PlaylistSchema} from "../playlist/schema/playlist.schema";
import {Album, AlbumSchema} from "../album/schema/album.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Genre.name, schema: GenreSchema}]),
        MongooseModule.forFeature([{name: Track.name, schema: TrackSchema}]),
        MongooseModule.forFeature([{name: Playlist.name, schema: PlaylistSchema}]),
        MongooseModule.forFeature([{name: Album.name, schema: AlbumSchema}]),
    ],
    controllers: [GenreController],
    providers: [GenreService],
    exports: [GenreService]
})

export class GenreModule {}