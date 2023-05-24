import {Body, Controller, Get, Param, Post, Query, Request, UploadedFiles, UseInterceptors} from "@nestjs/common";
import {TrackService} from "./track.service";
import {createTrackDto} from "./dto/create.track.dto";
import {FileFieldsInterceptor} from "@nestjs/platform-express";
import {Roles} from "../role/role.guard";
import {ObjectId} from "mongoose";

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
        return this.trackService.createTrack({...dto, artist: req.user}, audio[0], image[0])
    }
}