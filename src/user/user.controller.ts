import {Body, Controller, Get, Post} from "@nestjs/common";
import {UserService} from "./user.service";
import {createUserDto} from "./dto/create.user.dto";
import {addRoleDto} from "./dto/add.role.dto";

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Get()
    getUsers() {
        return this.userService.getAllUsers()
    }

    @Post('role')
    addRole(@Body() dto: addRoleDto) {
        return this.userService.addRole(dto)
    }
}