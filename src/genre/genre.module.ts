import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {Genre, GenreSchema} from "./schema/genre.schema";
import {GenreController} from "./genre.controller";
import {GenreService} from "./genre.service";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Genre.name, schema: GenreSchema}]),
    ],
    controllers: [GenreController],
    providers: [GenreService],
    exports: [GenreService]
})

export class GenreModule {}