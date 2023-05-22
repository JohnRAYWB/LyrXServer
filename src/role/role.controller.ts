import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {RoleService} from "./role.service";
import {createRoleDto} from "./dto/create.role.dto";

@Controller('roles')
export class RoleController {

    constructor(private roleService: RoleService) {}

    @Get()
    getAllRoles() {
        return this.roleService.getAllRoles()
    }

    @Get('/:role')
    getRole(@Param('role') role: string) {
        return this.roleService.getRole(role)
    }

    @Post()
    createRole(@Body() dto: createRoleDto) {
        return this.roleService.createRole(dto)
    }
}