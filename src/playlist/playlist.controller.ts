import {
    Body,
    Controller,
    Delete,
    Get, HttpException, HttpStatus,
    Param,
    Post,
    Query,
    Request,
    UploadedFile, UploadedFiles,
    UseInterceptors
} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {ObjectId} from "mongoose";
import {FileFieldsInterceptor, FileInterceptor} from "@nestjs/platform-express";
import {Roles} from "../role/role.guard";

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
    getPlaylistById(@Param('id') pId: ObjectId) {
        return this.playlistService.getPlaylistById(pId)
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

    @Roles('artist')
    @Post('drop')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'image', maxCount: 1},
        {name: 'audio', maxCount: 20}
    ]))
    dropAlbum(@Request() req, @UploadedFiles() files, @Body('name') name: string, @Body('trackName') trackName: [string]) {
        const {audio, image} = files
        if(audio.length === trackName.length) {
            return this.playlistService.dropAlbum(name, audio, image[0], req.user['id'], trackName)
        } else {
            throw new HttpException('You forgot add audio or track name. Please check one more time', HttpStatus.BAD_REQUEST)
        }
    }

    @Post('add_playlist/:id')
    addPlaylistToCollection(@Request() req, @Param('id') id: ObjectId) {
        return this.playlistService.addPlaylistToCollection(id, req.user['id'])
    }

    @Post(':id/remove')
    removeTrackFromPlaylist(@Request() req, @Param('id') pId: ObjectId, @Body('track') tId: ObjectId) {
        return this.playlistService.removeTrackFromPlaylist(req.user['id'], tId, pId)
    }

    @Post('remove_playlist/:id')
    removePlaylistFromCollection(@Request() req, @Param('id') id: ObjectId) {
        return this.playlistService.removePlaylistFromCollection(id, req.user['id'])
    }

    @Delete(':id')
    deletePlaylist(@Param('id') id: ObjectId, @Request() req) {
        return this.playlistService.deletePlaylist(id, req.user['id'])
    }
}