import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {Roles} from "../role/role.guard";
import {birthDto} from "./dto/birth.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {ObjectId} from "mongoose";

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Get('profile')
    getProfile(@Request() req) {
        return this.userService.getUserByEmail(req.user.email)
    }

    @Roles('admin')
    @Get()
    getUsers() {
        return this.userService.getAllUsers()
    }

    @Get('profile/:id')
    getUserById(@Param('id') uId: ObjectId) {
        return this.userService.getUserById(uId)
    }

    @Get('search')
    searchUserByName(@Query('username') username: string) {
        return this.userService.searchUserByName(username)
    }

    @Get('collection')
    getOwnCollection(@Request() req) {
        return this.userService.getOwnCollection(req.user['id'])
    }

    @Get('playlists')
    getOwnPlaylists(@Request() req) {
        return this.userService.getOwnPlaylists(req.user['id'])
    }

    @Post('profile/about')
    addAbout(@Request() req, @Body('about') about: string) {
        return this.userService.addAbout(req.user['id'], about)
    }

    @Post('profile/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    addAvatar(@Request() req, @UploadedFile() avatar) {
        return this.userService.addAvatar(req.user['id'], avatar)
    }

    @Post('profile/birth')
    addBirth(@Request() req, @Body() dto: birthDto) {
        return this.userService.addBirth(req.user['id'], dto)
    }

    @Roles('admin')
    @Post('role/:id/add')
    addRole(@Param('id') uId: ObjectId, @Body('role') rName: string) {
        return this.userService.addRole(uId, rName)
    }

    @Roles('admin')
    @Post('role/:id/remove')
    removeRole(@Param('id') uId: ObjectId, @Body('role') rName: string) {
        return this.userService.removeRole(uId, rName)
    }

    @Roles('admin')
    @Post('ban/:id')
    banUser(@Param('id') uId: ObjectId, @Body('reason') banReason: string) {
        return this.userService.banUser(uId, banReason)
    }

    @Roles('admin')
    @Post('unban/:id')
    unbanUser(@Param('id') uId: ObjectId) {
        return this.userService.unbanUser(uId)
    }

    @Post('subscribe/:id')
    subscribe(@Request() req, @Param('id') uId: ObjectId) {
        return this.userService.subscribe(uId, req.user['id'])
    }

    @Post('unsubscribe/:id')
    unsubscribe(@Request() req, @Param('id') uId: ObjectId) {
        return this.userService.unsubscribe(uId, req.user['id'])
    }

    @Post('collection/remove/:id')
    removeTrackFromCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.userService.removeTrackFromCollection(req.user['id'], tId)
    }

    @Post('playlists/remove/:id')
    removePlaylistFromCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.userService.removePlaylistFromCollection(req.user['id'], pId)
    }

    @Post('album/remove/:id')
    removeAlbumFromCollection(@Request() req, @Param('id') aId: ObjectId) {
        return this.userService.removeAlbumFromCollection(req.user['id'], aId)
    }
}