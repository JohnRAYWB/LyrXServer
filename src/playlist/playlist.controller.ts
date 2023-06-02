import {
    Body,
    Controller,
    Delete,
    Get, HttpException, HttpStatus,
    Param,
    Post,
    Query, Req,
    Request,
    UploadedFile, UploadedFiles,
    UseInterceptors
} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {ObjectId} from "mongoose";
import {FileFieldsInterceptor, FileInterceptor} from "@nestjs/platform-express";
import {addTrackToPlaylistDto} from "./dto/add.track.to.playlist.dto";
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

    @Post('add_track')
    addTrackToPlaylist(@Request() req, @Body() dto: addTrackToPlaylistDto) {
        return this.playlistService.addTrackToPlaylist({...dto, user: req.user['id']})
    }

    @Post('remove_track')
    removeTrackFromPlaylist(@Request() req, @Body() dto: addTrackToPlaylistDto) {
        return this.playlistService.removeTrackFromPlaylist({...dto, user: req.user['id']})
    }

    @Post('add_playlist/:id')
    addPlaylistToCollection(@Request() req, @Param('id') id: ObjectId) {
        return this.playlistService.addPlaylistToCollection(id, req.user['id'])
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