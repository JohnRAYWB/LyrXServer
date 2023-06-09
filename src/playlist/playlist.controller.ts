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

    @Get(':id/current')
    getPlaylistById(@Param('id') pId: ObjectId) {
        return this.playlistService.getPlaylistById(pId)
    }

    @Get('/search')
    searchPlaylistByName(@Query('name') name: string) {
        return this.playlistService.searchPlaylistByName(name)
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    createPlaylist(@Request() req, @UploadedFile() image, @Body('name') name: string) {
        return this.playlistService.createPlaylist(req.user['id'], name, image)
    }

    @Post('add/:id')
    addPlaylistToCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.addPlaylistToCollection(req.user['id'], pId)
    }

    @Post(':id/remove')
    removeTrackFromPlaylist(@Request() req, @Param('id') pId: ObjectId, @Body('track') tId: ObjectId) {
        return this.playlistService.removeTrackFromPlaylist(req.user['id'], tId, pId)
    }

    @Post('remove/:id')
    removePlaylistFromCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.removePlaylistFromCollection(req.user['id'], pId)
    }

    @Delete(':id')
    deletePlaylist(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.deletePlaylist(req.user['id'], pId)
    }
}