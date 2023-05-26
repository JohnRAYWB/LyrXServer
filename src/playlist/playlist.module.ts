import {Module} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {MongooseModule} from "@nestjs/mongoose";
import {Playlist, PlaylistSchema} from "./schema/playlist.schema";
import {PlaylistController} from "./playlist.controller";
import {FileService} from "../file/file.service";
import {User, UserSchema} from "../user/schema/user.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Playlist.name, schema: PlaylistSchema}]),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}])
    ],
    controllers: [PlaylistController],
    providers: [
        PlaylistService,
        FileService
    ],
    exports: [PlaylistService]
})

export class PlaylistModule {}