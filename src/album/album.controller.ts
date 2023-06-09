import {
    Body,
    Controller, Get,
    HttpException,
    HttpStatus, Param, Patch,
    Post, Query,
    Request,
    UploadedFiles,
    UseInterceptors
} from "@nestjs/common";
import {AlbumService} from "./album.service";
import {Roles} from "../role/role.guard";
import {createAlbumDto} from "./dto/create.album.dto";
import {FileFieldsInterceptor} from "@nestjs/platform-express";
import {ObjectId} from "mongoose";

@Controller('albums')
export class AlbumController {

    constructor(private albumService: AlbumService) {}

    @Get()
    getAllAlbums() {
        return this.albumService.getAllAlbums()
    }

    @Get(':id/current')
    getAlbumById(@Param('id') aId: ObjectId) {
        return this.albumService.getAlbumById(aId)
    }

    @Get('search')
    searchAlbumByName(@Query('name') name: string) {
        return this.albumService.searchAlbumByName(name)
    }

    @Roles('artist')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'audio'},
        {name: 'image', maxCount: 1}
    ]))
    @Post('drop')
    createAlbum(@Request() req, @UploadedFiles() files, @Body() dto: createAlbumDto) {

        const {audio, image} = files
        if(audio.length === dto.trackName.length) {
            return this.albumService.createAlbum(req.user['id'], dto, audio, image[0])
        } else {
            throw new HttpException('You forgot add audio or track name. Please check one more time', HttpStatus.BAD_REQUEST)
        }
    }

    @Patch('add/:id')
    addTrackToAlbum(@Request() req, @Param('id') aId: ObjectId, @Body('track') tId: ObjectId) {
        return this.albumService.addTrackToAlbum(req.user['id'], tId, aId)
    }

    @Patch('remove/:id')
    removeTrackFromAlbum(@Request() req, @Param('id') aId: ObjectId, @Body('track') tId: ObjectId) {
        return this.albumService.removeTrackFromAlbum(req.user['id'], tId, aId)
    }
}