import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {Roles} from "../role/role.guard";
import {FileInterceptor} from "@nestjs/platform-express";
import {ObjectId} from "mongoose";

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Get('profile')
    getProfile(@Request() req) {
        return this.userService.getUserById(req.user.id)
    }

    @Get()
    getUsers(@Query('limit') limit: number, @Query('page') page: number) {
        return this.userService.getAllUsers(limit, page)
    }

    @Get('profile/:id')
    getUserById(@Param('id') uId: ObjectId) {
        return this.userService.getUserById(uId)
    }

    @Get('search')
    searchUserByName(@Query('username') username: string) {
        return this.userService.searchUserByName(username)
    }

    @Get('artists/search')
    getArtists(@Query('username') username: string) {
        return this.userService.getAllArtists(username)
    }

    @Post('profile/about')
    addAbout(@Request() req, @Body('about') about: string) {
        return this.userService.addAbout(req.user.id, about)
    }

    @Post('profile/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    addAvatar(@Request() req, @UploadedFile() avatar) {
        return this.userService.addAvatar(req.user.id, avatar)
    }

    @Roles('admin')
    @Post('role/:id/add')
    addRole(@Param('id') uId: ObjectId, @Body('role') rName: string) {
        return this.userService.addRole(uId, rName)
    }

    @Roles('admin')
    @Post('unban/:id')
    unbanUser(@Param('id') uId: ObjectId) {
        return this.userService.unbanUser(uId)
    }

    @Post('subscribe/:id')
    subscribe(@Request() req, @Param('id') uId: ObjectId) {
        return this.userService.subscribe(uId, req.user.id)
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
}