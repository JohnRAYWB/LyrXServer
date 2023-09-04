import {
    Body,
    Controller,
    Delete,
    Get,
    Param, Patch,
    Post,
    Query,
    Request,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {PlaylistService} from "./playlist.service";
import {ObjectId} from "mongoose";
import {FileInterceptor} from "@nestjs/platform-express";
import {createPlaylistDto} from "./dto/create.playlist.dto";
import {editPlaylistDto} from "./dto/edit.playlist.dto";

@Controller('playlists')
export class PlaylistController {

    constructor(
       private playlistService: PlaylistService
    ) {}

    @Get()
    getAllPlaylists(@Query('limit') limit: number, @Query('page') page: number) {
        return this.playlistService.getAllPlaylists(limit, page)
    }

    @Get('top')
    getMostLiked() {
        return this.playlistService.getMostLiked()
    }

    @Get(':id/current')
    getPlaylistById(@Param('id') pId: ObjectId) {
        return this.playlistService.getPlaylistById(pId)
    }

    @Get('genre/:id')
    getPlaylistsByGenre(@Param('id') gId: ObjectId) {
        return this.playlistService.getPlaylistsByGenre(gId)
    }

    @Get('user')
    getUsersPlaylists(@Request() req) {
        return this.playlistService.getUsersPlaylists(req.user.id)
    }

    @Get('user/playlist_collection')
    getUsersPlaylistsCollection(@Request() req) {
        return this.playlistService.getUsersPlaylistsCollection(req.user.id)
    }

    @Get('search')
    searchPlaylistByName(@Query('name') name: string) {
        return this.playlistService.searchPlaylistByName(name)
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    createPlaylist(@Request() req, @Body() dto: createPlaylistDto, @UploadedFile() image, ) {
        const genres = [].concat(dto.genres)
        return this.playlistService.createPlaylist(req.user.id, {...dto, genres: genres}, image)
    }

    @Post('genre/:id/add')
    addGenre(@Request() req, @Param('id') pId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.playlistService.addGenre(req.user.id, pId, gId)
    }

    @Post('collection/:id/add')
    addPlaylistToCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.addPlaylistToCollection(req.user.id, pId)
    }

    @Patch('edit/:id/description')
    editPlaylistDescription(@Request() req, @Param('id') pId: ObjectId, @Body() dto: editPlaylistDto) {
        return this.playlistService.editPlaylistDescription(req.user.id, pId, dto)
    }

    @Patch('edit/:id/image')
    @UseInterceptors(FileInterceptor('image'))
    editPlaylistImage(@Request() req, @Param('id') pId: ObjectId, @UploadedFile() image) {
        return this.playlistService.editPlaylistImage(req.user.id, pId, image)
    }

    @Post('genre/:id/remove')
    removeGenre(@Request() req, @Param('id') pId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.playlistService.removeGenre(req.user.id, pId, gId)
    }

    @Post('collection/:id/remove')
    removePlaylistFromCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.removePlaylistFromCollection(req.user.id, pId)
    }

    @Delete(':id')
    deletePlaylist(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.deletePlaylist(req.user.id, pId)
    }
}