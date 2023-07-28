import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "./schema/user.schema";
import {Model, ObjectId} from "mongoose";
import {RoleService} from "../role/role.service";
import {createUserDto} from "./dto/create.user.dto";
import {birthDto} from "./dto/birth.dto";
import {FileService, FileType} from "../file/file.service";

@Injectable()
export class UserService {

    private userException = (e) => new HttpException(`User service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private roleService: RoleService,
        private fileService: FileService,
    ) {
    }

    async getAllUsers(limit = 10, page = 0): Promise<User[]> {

        const usersList = await this.userModel
            .find()
            .skip(page)
            .limit(limit)
            .select('-password')

        return usersList
    }

    async getUserForAuth(email: string): Promise<User> {

        const user = await this.userModel.findOne({email: email}).populate('roles')

        return user
    }

    async getUserById(uId: ObjectId): Promise<User> {

        const user = await this.userModel.findById(uId)
            .populate([
                {path: 'followers', populate: 'roles', select: '-password'},
                {path: 'followings', populate: 'roles', select: '-password'},
                {path: 'tracks', populate: 'album'},
                {path: 'tracksCollection', populate: 'album'},
                {path: 'playlists'},
                {path: 'playlistsCollection'},
                {path: 'albums'},
                {path: 'albumsCollection'},
                {path: 'roles'},
            ]).select('-password')

        return user
    }

    async searchUserByName(username: string, limit = 10, page = 0): Promise<User[]> {

        const userList = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        }).populate([
            {path: 'roles'},
            {path: 'comments'}
        ]).skip(page)
            .limit(limit)
            .select('-password')

        return userList
    }


    async getAllArtists(username: string): Promise<User[]> {
        const users = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        })
            .populate('roles')

        const artists = users.filter(user => user.roles.find(role => role.role === 'artist'))

        return artists
    }

    async createUser(dto: createUserDto): Promise<User> {

        try {
            const role = await this.roleService.getRole('user')
            const user = await this.userModel.create({...dto, roles: role, createdTime: Date.now()})

            return user
        } catch (e) {
            throw this.userException(e)
        }
    }

    async addAbout(uId: ObjectId, about: string): Promise<any> {

        try {
            await this.userModel.findByIdAndUpdate(uId, {$set: {about: about}})

            return 'Your info changed successfully'
        } catch (e) {
            throw this.userException(e)
        }
    }

    async addAvatar(uId: ObjectId, avatar): Promise<any> {
        const user = await this.userModel.findById(uId)
        const filePath = this.fileService.createFile(FileType.IMAGE, avatar, 'profile', user.username)

        if (user.avatar) {
            this.fileService.removeFile(user.avatar, 'profile', user.username)
        }

        await user.updateOne({$set: {avatar: filePath}})

        return 'Your avatar changed successfully'
    }

    async addBirth(uId: ObjectId, dto: birthDto): Promise<any> {

        try {
            await this.userModel.findByIdAndUpdate(uId, {$set: {birth: dto.birth}})

            return 'Your bDay update successfully'
        } catch (e) {
            throw this.userException(e)
        }
    }

    async addRole(uId: ObjectId, rName: string): Promise<any> {

        await this.roleControl(uId, rName, true)
        return 'Role add successfully'
    }

    async removeRole(uId: ObjectId, rName: string): Promise<any> {

        await this.roleControl(uId, rName, false)
        return 'Role remove successfully'
    }

    async banUser(uId: ObjectId, banReason: string): Promise<any> {

        await this.banControl(uId, true, banReason)
        return 'User banned successfully'
    }

    async unbanUser(uId: ObjectId): Promise<any> {

        await this.banControl(uId, false)
        return 'User unbanned successfully'
    }

    async subscribe(uId: ObjectId, sId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId)
        const subscriber = await this.userModel.findById(sId)

        try {
            if (subscriber.followings.findIndex(f => f.toString() === uId.toString()) === -1) {
                await user.updateOne({$addToSet: {followers: sId}})
                await subscriber.updateOne({$addToSet: {followings: uId}})
                return 'Thanks for subscribe'
            } else {
                await user.updateOne({$pull: {followers: sId}})
                await subscriber.updateOne({$pull: {followings: uId}})
                return 'You are unsubscribed successfully'
            }
        } catch (e) {
            this.userException(e)
        }
    }

    private async roleControl(uId: ObjectId, rName: string, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const role = await this.roleService.getRole(rName)

        try {
            if (add) {
                if (user.roles.findIndex(r => r.role === rName) === -1) {
                    await user.updateOne({$addToSet: {roles: role._id}})
                } else {
                    throw new HttpException('User has this role already', HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.roles.findIndex(r => r.role === rName) !== -1) {
                    await user.updateOne({$pull: {roles: role._id}})
                } else {
                    throw new HttpException('User has not this role', HttpStatus.BAD_REQUEST)
                }
            }

        } catch (e) {
            throw this.userException(e)
        }
    }

    private async banControl(uId: ObjectId, add: boolean, banReason?: string): Promise<any> {

        const user = await this.userModel.findById(uId)

        try {
            if (add) {
                if (!user.ban) {
                    await user.updateOne({$set: {ban: true}, $push: {banReason: banReason}})
                } else {
                    throw new HttpException('User has ban already', HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.ban) {
                    await user.updateOne({$set: {ban: false}})
                } else {
                    throw new HttpException(`User hasn't banned`, HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            throw this.userException(e)
        }
    }
}