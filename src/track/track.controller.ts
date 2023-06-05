import {
    Body,
    Controller,
    Delete,
    Get,
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
import {createCommentDto} from "./dto/create.comment.dto";
import {editTrackDescriptionDto} from "./dto/edit.track.description.dto";
import {editTrackArtistDto} from "./dto/edit.track.artist.dto";

@Controller('tracks')
export class TrackController {

    constructor(private trackService: TrackService) {}

    @Get()
    getAllTracks() {
        return this.trackService.getAllTracks()
    }

    @Get(':id')
    getTrackById(@Param('id') tId: ObjectId) {
        return this.trackService.getTrackById(tId)
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
        return this.trackService.createTrack(req.user['id'], dto, audio[0], image[0])
    }

    @Post('listens/:id')
    incrementListens(@Param('id') tId: ObjectId) {
        return this.trackService.incrementTrackListens(tId)
    }

    @Post('add/:id')
    addTrackToCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.addTrackToCollection(req.user['id'], tId)
    }

    @Post('remove/:id')
    removeTrackToCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.removeTrackFromCollection(req.user['id'], tId)
    }

    @Post('comment')
    addComment(@Request() req, @Body() dto: createCommentDto) {
        return this.trackService.addComment(req.user['id'], dto)
    }

    @Roles('artist')
    @Patch(':id/description')
    editTrackDescription(@Request() req, @Param('id') tId: ObjectId, @Body() dto: editTrackDescriptionDto) {
        return this.trackService.editTrackDescription(req.user['id'], tId, dto)
    }

    @Roles('admin')
    @Patch(':id/artist')
    editTrackArtist(@Param('id') tId: ObjectId, @Body() dto: editTrackArtistDto) {
        return this.trackService.editTrackArtist(tId, dto)
    }

    @Roles('artist')
    @Patch(':id/audio')
    @UseInterceptors(FileInterceptor('audio'))
    editTrackAudio(@Request() req, @Param('id') tId: ObjectId, @UploadedFile() audio) {
        return this.trackService.editTrackAudio(req.user['id'], tId, audio)
    }

    @Roles('artist')
    @Patch(':id/image')
    @UseInterceptors(FileInterceptor('image'))
    editTrackImage(@Request() req, @Param('id') tId: ObjectId, @UploadedFile() image) {
        return this.trackService.editTrackImage(req.user['id'], tId, image)
    }

    @Patch('comment/:id')
    editCommentById(@Request() req, @Param('id') tId: ObjectId, @Body('text') text: string) {
        return this.trackService.editCommentById(req.user['id'], tId, text)
    }

    @Delete('comment/:id')
    deleteCommentById(@Request() req, @Param('id') tId: ObjectId) {
        return this.trackService.deleteCommentById(req.user['id'], tId)
    }

    @Roles('admin')
    @Delete(':id')
    deleteTrackById(@Param('id') tId: ObjectId) {
        return this.trackService.deleteTrackById(tId)
    }
}