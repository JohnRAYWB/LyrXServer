import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {addRoleDto} from "./dto/add.role.dto";
import {Roles} from "../role/role.guard";
import {banUserDto} from "./dto/ban.user.dto";
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
    searchUserByName(@Query('query') username: string) {
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
    addAvatar(@Request() req, @UploadedFile() file) {
        return this.userService.addAvatar(req.user['id'], file)
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
    @Post('ban')
    banUser(@Body() dto: banUserDto) {
        return this.userService.banUser(dto)
    }

    @Post('profile/collection/remove/:id')
    removeTrackFromCollection(@Request() req, @Param('id') id: ObjectId) {
        return this.userService.removeTrackFromCollection(id, req.user['id'])
    }

    @Post('profile/playlists/remove/:id')
    removePlaylistFromCollection(@Request() req, @Param('id') id: ObjectId) {
        return this.userService.removePlaylistFromCollection(id, req.user['id'])
    }
}