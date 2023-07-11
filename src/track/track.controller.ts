import {
    Body,
    Controller,
    Delete,
    Get, HttpException, HttpStatus,
    Param, Patch,
    Post,
    Query,
    Request, UploadedFile,
    UploadedFiles,
    UseInterceptors
} from "@nestjs/common";
import {TrackService} from "./track.service";
import {createTrackDto} from "./dto/create.track.dto";
import {FileFieldsInterceptor, FileInterceptor} from "@nestjs/platform-express";
import {Roles} from "../role/role.guard";
import {ObjectId} from "mongoose";
import {editTrackDescriptionDto} from "./dto/edit.track.description.dto";

@Controller('tracks')
export class TrackController {

    constructor(private trackService: TrackService) {}

    @Get()
    getAllTracks(@Query('limit') limit: number, @Query('page') page: number) {
        return this.trackService.getAllTracks(limit, page)
    }

    @Get('top')
    getMostLiked(@Query('page') page: number) {
        return this.trackService.getMostLiked(page)
    }

    @Get(':id/current')
    getTrackById(@Param('id') tId: ObjectId) {
        return this.trackService.getTrackById(tId)
    }

    @Get('genre/:id')
    getTracksByGenre(@Param('id') gId: ObjectId) {
        return this.trackService.getTracksByGenre(gId)
    }

    @Get('search')
    searchTrackByName(@Query('name') name: string) {
        return this.trackService.searchTrackByName(name)
    }

    @Roles('artist')
    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'audio', maxCount: 1},
        {name: 'image', maxCount: 1}
    ]))
    createTrack(@Request() req, @UploadedFiles() files, @Body() dto: createTrackDto) {
        const {audio, image} = files
        if(audio && image) {
            return this.trackService.createTrack(req.user['id'], dto, audio[0], image[0])

        } else {
            throw new HttpException(`You don't and image or audio! Audio: ${audio}; Image: ${image}`, HttpStatus.BAD_REQUEST)
        }
    }

    @Post('genre/:id/add')
    addGenre(@Request() req, @Param('id') tId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.trackService.addGenre(req.user.id, tId, gId)
    }

    @Post('listens/:id')
    incrementListens(@Param('id') tId: ObjectId) {
        return this.trackService.incrementTrackListens(tId)
    }

    @Post('collection/:id/add')
    addTrackToCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.addTrackToCollection(req.user.id, tId)
    }

    @Post('playlist/:id/add')
    addTrackToPlaylist(@Request() req, @Param('id') tId: ObjectId, @Body('playlist') pId: ObjectId) {
        return this.trackService.addTrackToPlaylist(req.user.id, tId, pId)
    }

    @Post('comment/:id')
    addComment(@Request() req, @Param('id') tId: ObjectId, @Body('text') text: string) {
        return this.trackService.addComment(req.user.id, tId, text)
    }

    @Roles('artist')
    @Patch(':id/current/description')
    editTrackDescription(@Request() req, @Param('id') tId: ObjectId, @Body() dto: editTrackDescriptionDto) {
        return this.trackService.editTrackDescription(req.user.id, tId, dto)
    }

    @Roles('admin')
    @Patch(':id/current/artist')
    editTrackArtist(@Param('id') tId: ObjectId, @Body('artist') uId: ObjectId) {
        return this.trackService.editTrackArtist(uId, tId)
    }

    @Roles('artist')
    @Patch(':id/current/audio')
    @UseInterceptors(FileInterceptor('audio'))
    editTrackAudio(@Request() req, @Param('id') tId: ObjectId, @UploadedFile() audio) {
        return this.trackService.editTrackAudio(req.user.id, tId, audio)
    }

    @Roles('artist')
    @Patch(':id/current/image')
    @UseInterceptors(FileInterceptor('image'))
    editTrackImage(@Request() req, @Param('id') tId: ObjectId, @UploadedFile() image) {
        return this.trackService.editTrackImage(req.user.id, tId, image)
    }

    @Patch('comment/:id/edit')
    editCommentById(@Request() req, @Param('id') tId: ObjectId, @Body('text') text: string) {
        return this.trackService.editCommentById(req.user.id, tId, text)
    }

    @Post('genre/:id/remove')
    removeGenre(@Request() req, @Param('id') tId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.trackService.removeGenre(req.user.id, tId, gId)
    }

    @Post('collection/:id/remove')
    removeTrackFromCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.removeTrackFromCollection(req.user.id, tId)
    }

    @Post('playlist/:id/remove')
    removeTrackFromPlaylist(@Request() req, @Param('id') tId: ObjectId, @Body('playlist') pId: ObjectId) {
        return this.trackService.removeTrackFromPlaylist(req.user.id, tId, pId)
    }

    @Delete('comment/:id/delete')
    deleteCommentById(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.deleteCommentById(req.user.id, tId)
    }

    @Roles('admin', 'artist')
    @Delete(':id')
    deleteTrackById(@Param('id') tId: ObjectId) {
        return this.trackService.deleteTrackById(tId)
    }
}