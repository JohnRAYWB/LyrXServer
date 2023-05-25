import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "./schema/user.schema";
import {Model, ObjectId} from "mongoose";
import {RoleService} from "../role/role.service";
import {createUserDto} from "./dto/create.user.dto";
import {addRoleDto} from "./dto/add.role.dto";
import {banUserDto} from "./dto/ban.user.dto";
import {aboutDto} from "./dto/about.dto";
import {birthDto} from "./dto/birth.dto";
import {avatarDto} from "./dto/avatar.dto";
import {FileService, FileType} from "../file/file.service";

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private roleService: RoleService,
        private fileService: FileService
    ) {}


    async getAllUsers(): Promise<User[]> {

        const usersList = await this.userModel.find()

        return usersList
    }

    async getUserByName(username: string): Promise<User> {

        const user = await this.userModel.findOne({username: username})
            .populate('roles').populate('tracks').populate('comments')

        return user
    }

    async getUserByEmail(email: string): Promise<User> {

        const user = await this.userModel.findOne({email: email})
            .populate('roles').populate('tracks').populate('comments')

        return user
    }

    async searchUserByName(username: string): Promise<User[]> {

        const userList = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        }).populate('roles')

        return userList
    }

    async createUser(dto: createUserDto): Promise<User> {

        const role = await this.roleService.getRole('user')
        const user = await this.userModel.create({...dto, roles: role})

        return user.populate('roles')
    }

    async addAbout(dto: aboutDto): Promise<User> {
        const user = await this.userModel.findOne({email: dto.user.email})

        if (user) {
            user.about = dto.about
            user.save()

            return user
        } else {
            throw new HttpException('User service: You cannot do this right now', HttpStatus.BAD_REQUEST)
        }

    }

    async addAvatar(dto: avatarDto): Promise<User> {
        const user = await this.userModel.findOne({email: dto.user.email})
        const file = this.fileService.createFile(FileType.IMAGE, dto.avatar, 'profile', user.username)

        if (user.avatar) {
            this.fileService.removeFile(user.avatar, 'profile', user.username)
        }

        user.avatar = file
        user.save()

        return user
    }

    async addBirth(dto: birthDto): Promise<User> {
        const user = await this.userModel.findOne({email: dto.user.email})

        if (user) {
            user.birth = dto.birth
            user.save()

            return user
        } else {
            throw new HttpException('User service: You cannot do this right now', HttpStatus.BAD_REQUEST)
        }

    }

    async addRole(dto: addRoleDto): Promise<User> {

        const user = await this.userModel.findById(dto.userId).populate('roles')
        const foundRole = await this.roleService.getRole(dto.role)

        if (user.roles.find(role => role.role === dto.role)) {
            throw new HttpException('User service: User already has this role', HttpStatus.BAD_REQUEST)
        }

        if (user && foundRole) {
            user.roles.push(foundRole['id'])
            user.save()

            return user
        }
    }

    async banUser(dto: banUserDto): Promise<User> {
        const user = await this.userModel.findById(dto.userId)

        if (user) {
            user.ban = true
            user.banReason = dto.banReason
            user.save()

            return user
        } else {
            throw new HttpException('User service: User not found', HttpStatus.BAD_REQUEST)
        }
    }
}