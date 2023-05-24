import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {Track, TrackSchema} from "./schema/track.schema";
import {Comment, CommentSchema} from "./schema/comment.schema";
import {TrackController} from "./track.controller";
import {TrackService} from "./track.service";
import {FileService} from "../file/file.service";
import {User, UserSchema} from "../user/schema/user.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Track.name, schema: TrackSchema}]),
        MongooseModule.forFeature([{name: Comment.name, schema: CommentSchema}]),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}])
    ],
    controllers: [TrackController],
    providers: [
        TrackService,
        FileService
    ]
})
export class TrackModule {}