import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "./schema/user.schema";
import {Model, ObjectId} from "mongoose";
import {RoleService} from "../role/role.service";
import {createUserDto} from "./dto/create.user.dto";
import {addRoleDto} from "./dto/add.role.dto";

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private roleService: RoleService
    ) {}

    async getAllUsers(): Promise<User[]> {

        const usersList = await this.userModel.find().populate('roles')

        return usersList
    }

    async getUserById(id: ObjectId): Promise<User> {

        const user = await this.userModel.findById(id)

        return user
    }

    async getUserByName(username: string): Promise<User> {

        const user = await this.userModel.findOne({username: username}).populate('roles')

        return user
    }

    async getUserByEmail(email: string): Promise<User> {

        const user = await this.userModel.findOne({email: email}).populate('roles')

        return user
    }

    async searchUserByName(username: string): Promise<User[]> {

        const userList = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        })

        return userList
    }

    async createUser(dto: createUserDto): Promise<User> {

        const role = await this.roleService.getRole('user')
        const user = await this.userModel.create({...dto, roles: role})

        return user.populate('roles')
    }

    async addRole(dto: addRoleDto): Promise<User> {

        const user = await this.userModel.findById(dto.userId).populate('roles')
        const findedRole = await this.roleService.getRole(dto.role)

        if (user.roles.find(role => role.role === dto.role)) {
            throw new HttpException('User service: User already has this role', HttpStatus.BAD_REQUEST)
        }

        if(user && findedRole) {
            user.roles.push(findedRole['id'])
            user.save()

            return user.populate('roles')
        }
    }
}