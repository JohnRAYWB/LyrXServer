import {
    Body,
    Controller, Delete, Get,
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
        const trackNames = [].concat(dto.trackName)

        if(audio.length === trackNames.length) {
            return this.albumService.createAlbum(req.user['id'], {...dto, trackName: trackNames}, audio, image[0])
        } else {
            throw new HttpException(`You forgot add audio or track name. Audio length: ${audio.length}; Tracks name length: ${trackNames.length}`, HttpStatus.BAD_REQUEST)
        }
    }

    @Post('genre/:id/add')
    addGenre(@Request() req, @Param('id') aId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.albumService.addGenre(req.user['id'], aId, gId)
    }

    @Post('add/:id')
    addAlbumToCollection(@Request() req, @Param('id') aId: ObjectId) {
        return this.albumService.addAlbumToCollection(req.user['id'], aId)
    }

    @Patch('track/:id/add')
    addTrackToAlbum(@Request() req, @Param('id') aId: ObjectId, @Body('track') tId: ObjectId) {
        return this.albumService.addTrackToAlbum(req.user['id'], tId, aId)
    }

    @Post('genre/:id/remove')
    removeGenre(@Request() req, @Param('id') aId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.albumService.removeGenre(req.user['id'], aId, gId)
    }

    @Post('remove/:id')
    removeAlbumFromCollection(@Request() req, @Param('id') aId: ObjectId) {
        return this.albumService.removeAlbumFromCollection(req.user['id'], aId)
    }

    @Patch('track/:id/remove')
    removeTrackFromAlbum(@Request() req, @Param('id') aId: ObjectId, @Body('track') tId: ObjectId) {
        return this.albumService.removeTrackFromAlbum(req.user['id'], tId, aId)
    }

    @Delete(':id')
    deleteAlbum(@Request() req, @Param('id') aId: ObjectId) {
        return this.albumService.deleteAlbum(req.user['id'], aId)
    }
}