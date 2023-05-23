import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {RoleService} from "./role.service";
import {createRoleDto} from "./dto/create.role.dto";
import {Roles} from "./role.guard";

@Controller('roles')
export class RoleController {

    constructor(private roleService: RoleService) {}

    @Roles('admin', 'tester')
    @Get()
    getAllRoles() {
        return this.roleService.getAllRoles()
    }

    @Roles('admin', 'tester')
    @Get('/:role')
    getRole(@Param('role') role: string) {
        return this.roleService.getRole(role)
    }

    @Roles('admin')
    @Post()
    createRole(@Body() dto: createRoleDto) {
        return this.roleService.createRole(dto)
    }
}