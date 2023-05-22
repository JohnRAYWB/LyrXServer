import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Role, RoleDocument} from "./schema/role.schema";
import {Model} from "mongoose";
import {createRoleDto} from "./dto/create.role.dto";


@Injectable()
export class RoleService {

    constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {
    }

    async getAllRoles(): Promise<Role[]> {

        const roleList = await this.roleModel.find()

        return roleList
    }

    async getRole(name: string): Promise<Role> {
        const role = await this.roleModel.findOne({role: name})

        return role
    }

    async createRole(dto: createRoleDto): Promise<Role> {
        const check = await this.getRole(dto.role)

        if(check) {
            throw new HttpException('Role service: Role already exist', HttpStatus.BAD_REQUEST)
        }

        const role = await this.roleModel.create({...dto})

        return role
    }
}