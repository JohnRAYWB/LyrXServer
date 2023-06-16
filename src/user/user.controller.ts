import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {Roles} from "../role/role.guard";
import {birthDto} from "./dto/birth.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {ObjectId} from "mongoose";
import MongooseClassSerializerInterceptor from "../serialization/mongoose.class.serializer";
import {User} from "./schema/user.schema";

@Controller('users')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class UserController {

    constructor(private userService: UserService) {}

    @Get('profile')
    getProfile(@Request() req) {
        return this.userService.getUserById(req.user.id)
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
        return this.userService.getOwnCollection(req.user.id)
    }

    @Get('playlists')
    getOwnPlaylists(@Request() req) {
        return this.userService.getOwnPlaylists(req.user.id)
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

    @Post('profile/birth')
    addBirth(@Request() req, @Body() dto: birthDto) {
        return this.userService.addBirth(req.user.id, dto)
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

    @Post('unsubscribe/:id')
    unsubscribe(@Request() req, @Param('id') uId: ObjectId) {
        return this.userService.unsubscribe(uId, req.user.id)
    }
}