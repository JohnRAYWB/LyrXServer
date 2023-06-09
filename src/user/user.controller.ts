import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {addRoleDto} from "./dto/add.role.dto";
import {Roles} from "../role/role.guard";
import {birthDto} from "./dto/birth.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {ObjectId} from "mongoose";

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Roles('admin')
    @Get()
    getUsers() {
        return this.userService.getAllUsers()
    }

    @Get('profile/:username')
    getUserByName(@Param('username') username: string) {
        return this.userService.getUserByName(username)
    }

    @Get('search')
    searchUserByName(@Query('username') username: string) {
        return this.userService.searchUserByName(username)
    }

    @Get('profile')
    getProfile(@Request() req) {
        return this.userService.getUserByEmail(req.user.email)
    }

    @Post('profile/collection')
    getOwnCollection(@Request() req) {
        return this.userService.getOwnCollection(req.user['id'])
    }

    @Post('profile/playlists')
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
    @Post('role')
    addRole(@Body() dto: addRoleDto) {
        return this.userService.addRole(dto)
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

    @Post('profile/collection/remove/:id')
    removeTrackFromCollection(@Request() req, @Param('id') tId: ObjectId) {
        return this.userService.removeTrackFromCollection(req.user['id'], tId)
    }

    @Post('profile/playlists/remove/:id')
    removePlaylistFromCollection(@Request() req, @Param('id') pId: ObjectId) {
        return this.userService.removePlaylistFromCollection(req.user['id'], pId)
    }

    @Post('profile/album/remove/:id')
    removeAlbumFromCollection(@Request() req, @Param('id') aId: ObjectId) {
        return this.userService.removeAlbumFromCollection(req.user['id'], aId)
    }
}