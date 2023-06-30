import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Role, RoleDocument} from "./schema/role.schema";
import {Model} from "mongoose";
import {createRoleDto} from "./dto/create.role.dto";


@Injectable()
export class RoleService {

    private roleException = (e) => new HttpException(`Role service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

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

        try {
            const checkRole = await this.roleModel.findOne({role: dto.role})

            if(checkRole) {
                throw new HttpException('Role service: Role already exist', HttpStatus.BAD_REQUEST)
            }

            const role = await this.roleModel.create({...dto})

            return role
        } catch (e) {
            throw this.roleException(e)
        }
    }
}