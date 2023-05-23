import {Body, Controller, Get, Post, Request} from "@nestjs/common";
import {UserService} from "./user.service";
import {addRoleDto} from "./dto/add.role.dto";
import {Roles} from "../role/role.guard";

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Roles('admin')
    @Get()
    getUsers() {
        return this.userService.getAllUsers()
    }

    @Get('profile')
    getProfile(@Request() req) {
        return req.user
    }

    @Roles('admin')
    @Post('role')
    addRole(@Body() dto: addRoleDto) {
        return this.userService.addRole(dto)
    }
}