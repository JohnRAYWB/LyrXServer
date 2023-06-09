import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "./schema/user.schema";
import {Model, ObjectId} from "mongoose";
import {RoleService} from "../role/role.service";
import {createUserDto} from "./dto/create.user.dto";
import {addRoleDto} from "./dto/add.role.dto";
import {birthDto} from "./dto/birth.dto";
import {FileService, FileType} from "../file/file.service";
import {Track} from "../track/schema/track.schema";
import {TrackService} from "../track/track.service";
import {PlaylistService} from "../playlist/playlist.service";
import {Playlist} from "../playlist/schema/playlist.schema";
import {AlbumService} from "../album/album.service";

@Injectable()
export class UserService {

    private userException = (e) => new HttpException(`User service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private roleService: RoleService,
        private fileService: FileService,
        private trackService: TrackService,
        private playlistService: PlaylistService,
        private albumService: AlbumService
    ) {
    }

    async getAllUsers(): Promise<User[]> {

        const usersList = await this.userModel.find()

        return usersList
    }

    async getUserByName(username: string): Promise<User> {

        const user = await this.userModel.findOne({username: username})
            .populate(['roles', 'tracksCollection', 'comments'])

        return user
    }

    async getUserByEmail(email: string): Promise<User> {

        const user = await this.userModel.findOne({email: email})
            .populate(['roles', 'tracksCollection', 'comments'])

        return user
    }

    async searchUserByName(username: string): Promise<User[]> {

        const userList = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        }).populate(['roles', 'tracksCollection', 'comments'])

        return userList
    }

    async getOwnCollection(uId: ObjectId): Promise<Track[]> {

        const user = await this.userModel.findById(uId).populate(['tracks', 'tracksCollection'])
        const {tracks, tracksCollection} = user

        return [...tracks, ...tracksCollection]
    }

    async getOwnPlaylists(uId: ObjectId): Promise<Playlist[]> {

        const user = await this.userModel.findById(uId).populate(['playlists', 'playlistsCollection'])
        const {playlists, playlistsCollection} = user

        return [...playlists, ...playlistsCollection]
    }

    async createUser(dto: createUserDto): Promise<User> {

        const role = await this.roleService.getRole('user')
        const user = await this.userModel.create({...dto, roles: role})

        return user
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

    async addRole(dto: addRoleDto): Promise<any> {

        const role = await this.roleService.getRole(dto.role)
        const user = await this.userModel.findById(dto.uId)

        try {
            if (!user.roles.find(r => r.toString() === role['id'])) {
                await user.updateOne({$addToSet: {roles: role['id']}})

                return 'Role add successfully'
            } else {
                throw new HttpException('User has this role already', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.userException(e)
        }
    }

    async banUser(uId: ObjectId, banReason: string): Promise<any> {

        const user = await this.userModel.findById(uId)

        try {
            if (!user.ban) {
                await user.updateOne({$set: {ban: true}, $push: {banReason: banReason}})

                return 'User banned successfully'
            } else {
                throw new HttpException('User has ban already', HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.userException(e)
        }
    }

    async unbanUser(uId: ObjectId): Promise<any> {

        const user = await this.userModel.findById(uId)

        try {
            if(user.ban) {
                await user.updateOne({$set: {ban: false}})

                return 'User unbanned successfully'
            } else {
                throw new HttpException(`User hasn't banned`, HttpStatus.BAD_REQUEST)
            }
        } catch (e) {
            throw this.userException(e)
        }
    }

    async removeTrackFromCollection(uId: ObjectId, tId: ObjectId): Promise<any> {
        return this.trackService.removeTrackFromCollection(uId, tId)
    }

    async removePlaylistFromCollection(uId: ObjectId, pId: ObjectId): Promise<any> {
        return this.playlistService.removePlaylistFromCollection(uId, pId)
    }

    async removeAlbumFromCollection(uId: ObjectId, aId: ObjectId): Promise<any> {
        return this.albumService.removeAlbumFromCollection(uId, aId)
    }
}