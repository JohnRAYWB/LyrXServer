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
    getTrackById(@Param('id') id: ObjectId) {
        return this.trackService.getTrackById(id)
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
    createTrack(@UploadedFiles() files, @Request() req, @Body() dto: createTrackDto) {
        const {audio, image} = files
        return this.trackService.createTrack(dto, audio[0], image[0], req.user['id'])
    }

    @Post('listens/:id')
    incrementListens(@Param('id') id: ObjectId) {
        return this.trackService.incrementTrackListens(id)
    }

    @Post('add/:id')
    addTrackToCollection(@Param('id') id: ObjectId, @Request() req) {
        return this.trackService.addTrackToCollection(id, req.user['id'])
    }

    @Post('remove/:id')
    removeTrackToCollection(@Param('id') id: ObjectId, @Request() req) {
        return this.trackService.removeTrackFromCollection(id, req.user['id'])
    }

    @Post('comment')
    addComment(@Request() req, @Body() dto: createCommentDto) {
        return this.trackService.addComment({...dto, user: req.user})
    }

    @Roles('artist')
    @Patch(':id/description')
    editTrackDescription(@Request() req, @Param('id') id: ObjectId, @Body() dto: editTrackDescriptionDto) {
        return this.trackService.editTrackDescription(id, dto, req.user['id'])
    }

    @Roles('admin')
    @Patch(':id/artist')
    editTrackArtist(@Param('id') id: ObjectId, @Body() dto: editTrackArtistDto) {
        return this.trackService.editTrackArtist(id, dto)
    }

    @Roles('artist')
    @Patch(':id/audio')
    @UseInterceptors(FileInterceptor('audio'))
    editTrackAudio(@Request() req, @Param('id') id: ObjectId, @UploadedFile() audio) {
        return this.trackService.editTrackAudio(id, audio, req.user['id'])
    }

    @Roles('artist')
    @Patch(':id/image')
    @UseInterceptors(FileInterceptor('image'))
    editTrackImage(@Request() req, @Param('id') id: ObjectId, @UploadedFile() image) {
        return this.trackService.editTrackImage(id, image, req.user['id'])
    }

    @Patch('comment/:id')
    editCommentById(@Request() req, @Param('id') id: ObjectId, @Body('text') text: string) {
        return this.trackService.editCommentById(id, text, req.user['id'])
    }

    @Delete('comment/:id')
    deleteCommentById(@Request() req, @Param('id') id: ObjectId) {
        return this.trackService.deleteCommentById(id, req.user['id'])
    }

    @Roles('admin')
    @Delete(':id')
    deleteTrackById(@Param('id') id: ObjectId) {
        return this.trackService.deleteTrackById(id)
    }
}