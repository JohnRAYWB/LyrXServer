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
    getAllPlaylists(@Query('limit') limit: number, @Query('page') page: number) {
        return this.playlistService.getAllPlaylists(limit, page)
    }

    @Get('top')
    getMostLiked(@Query('page') page: number) {
        return this.playlistService.getMostLiked(page)
    }

    @Get(':id/current')
    getPlaylistById(@Param('id') pId: ObjectId) {
        return this.playlistService.getPlaylistById(pId)
    }

    @Get('genre/:id')
    getPlaylistsByGenre(@Param('id') gId: ObjectId) {
        return this.playlistService.getPlaylistsByGenre(gId)
    }

    @Get('/search')
    searchPlaylistByName(@Query('name') name: string) {
        return this.playlistService.searchPlaylistByName(name)
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    createPlaylist(@Request() req, @UploadedFile() image, @Body('name') name: string, @Body('description') description: string) {
        return this.playlistService.createPlaylist(req.user.id, name, description, image)
    }

    @Post('genre/:id/add')
    addGenre(@Request() req, @Param('id') pId: ObjectId, @Body('genre') gId: ObjectId) {
        return this.playlistService.addGenre(req.user.id, pId, gId)
    }

    @Post('collection/:id/add')
    addPlaylistToCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.playlistService.addPlaylistToCollection(req.user.id, pId)
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