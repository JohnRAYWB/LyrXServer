import {Body, Controller, Get, Param, Post, Query, Request, UploadedFile, UseInterceptors} from "@nestjs/common";
import {UserService} from "./user.service";
import {addRoleDto} from "./dto/add.role.dto";
import {Roles} from "../role/role.guard";
import {banUserDto} from "./dto/ban.user.dto";
import {aboutDto} from "./dto/about.dto";
import {birthDto} from "./dto/birth.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {avatarDto} from "./dto/avatar.dto";

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
        return req.user
    }

    @Post('profile/about')
    addAbout(@Request() req, @Body() dto: aboutDto) {
        return this.userService.addAbout({...dto, user: req.user})
    }

    @Post('profile/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    addAvatar(@UploadedFile() file, @Request() req, @Body() dto: avatarDto) {
        return this.userService.addAvatar({user: req.user, avatar: file})
    }

    @Post('profile/birth')
    addBirth(@Request() req, @Body() dto: birthDto) {
        return this.userService.addBirth({...dto, user: req.user})
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
}