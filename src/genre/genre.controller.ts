import {Body, Controller, Delete, Get, Param, Post, Query} from "@nestjs/common";
import {GenreService} from "./genre.service";
import {createGenreDto} from "./dto/create.genre.dto";
import {Roles} from "../role/role.guard";
import {ObjectId} from "mongoose";

@Controller('genres')
export class GenreController {

    constructor(
       private genreService: GenreService
    ) {}

    @Get()
    getAllGenres() {
        return this.genreService.getAllGenres()
    }

    @Get(':id')
    getGenresById(@Param('id') gId: ObjectId) {
        return this.genreService.getGenreById(gId)
    }

    @Roles('admin')
    @Post()
    createGenre(@Body() dto: createGenreDto) {
        return this.genreService.createGenre(dto)
    }

    @Roles('admin')
    @Delete(':id')
    deleteGenreById(@Param('id') gId: ObjectId) {
        return this.genreService.deleteGenreById(gId)
    }
}