import {Module} from "@nestjs/common";
import {AlbumController} from "./album.controller";
import {AlbumService} from "./album.service";
import {MongooseModule} from "@nestjs/mongoose";
import {Album, AlbumSchema} from "./schema/album.schema";
import {Track, TrackSchema} from "../track/schema/track.schema";
import {User, UserSchema} from "../user/schema/user.schema";
import {FileService} from "../file/file.service";
import {TrackModule} from "../track/track.module";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Album.name, schema: AlbumSchema}]),
        MongooseModule.forFeature([{name: Track.name, schema: TrackSchema}]),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        TrackModule
    ],
    controllers: [AlbumController],
    providers: [
        AlbumService,
        FileService
    ],
    exports: [AlbumService]
})

export class AlbumModule {}