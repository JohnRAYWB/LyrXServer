import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Request,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {ObjectId} from "mongoose";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('playlists')
export class PlaylistController {

    constructor(
       private playlistService: PlaylistService
    ) {}

    @Get()
    getAllPlaylists() {
        return this.playlistService.getAllPlaylists()
    }

    @Get(':id')
    getPlaylistById(@Param('id') id: ObjectId) {
        return this.playlistService.getPlaylistById(id)
    }

    @Get('search')
    searchPlaylistByName(@Query('name') name: string) {
        return this.playlistService.searchPlaylistByName(name)
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    createPlaylist(@Request() req, @UploadedFile() image, @Body('name') name: string) {
        return this.playlistService.createPlaylist(req.user['id'], name, image)
    }

    @Post('likes/:id')
    incrementPlaylistsLikes(@Param('id') id: ObjectId) {
        return this.playlistService.incrementPlaylistsLikes(id)
    }

    @Delete(':id')
    deletePlaylist(@Param('id') id: ObjectId, @Request() req) {
        return this.playlistService.deletePlaylist(id, req.user['id'])
    }
}