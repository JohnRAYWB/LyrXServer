import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "./schema/user.schema";
import {Model, ObjectId} from "mongoose";
import {RoleService} from "../role/role.service";
import {createUserDto} from "./dto/create.user.dto";
import {birthDto} from "./dto/birth.dto";
import {FileService, FileType} from "../file/file.service";
import {Track} from "../track/schema/track.schema";
import {TrackService} from "../track/track.service";
import {PlaylistService} from "../playlist/playlist.service";
import {Playlist} from "../playlist/schema/playlist.schema";
import {AlbumService} from "../album/album.service";
import {Album} from "../album/schema/album.schema";

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

        return user
    }

    async getUserByEmail(email: string): Promise<User> {

        const user = await this.userModel.findOne({email: email}).populate('roles')

        return user
    }

    async getUserById(uId: ObjectId): Promise<User> {

        const user = await this.userModel.findById(uId).populate([
            'tracks', 'tracksCollection', 'playlists', 'playlistsCollection', 'albums', 'albumsCollection', 'followers', 'followings', 'roles'
        ])
        return user
    }

    async searchUserByName(username: string): Promise<User[]> {

        const userList = await this.userModel.find({
            username: {$regex: new RegExp(username, 'i')}
        })

        return userList
    }

    async getOwnCollection(uId: ObjectId): Promise<Track[]> {

        const user = await this.userModel.findById(uId).populate(['tracks', 'tracksCollection'])
        const {tracks, tracksCollection} = user
        const collection = [].concat(tracks, tracksCollection)

        return collection
    }

    async getOwnPlaylists(uId: ObjectId): Promise<Playlist[] | Album []> {

        const user = await this.userModel.findById(uId).populate([
            'playlists', 'playlistsCollection', 'albums', 'albumsCollection'
        ])
        const {playlists, playlistsCollection, albums, albumsCollection} = user
        const collections = [].concat(playlists, playlistsCollection, albums, albumsCollection)

        return collections
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

        await this.subscribeControl(uId, sId, true)
        return 'Thanks for subscribe'
    }

    async unsubscribe(uId: ObjectId, sId: ObjectId): Promise<any> {

        await this.subscribeControl(uId, sId, false)
        return 'You are unsubscribed successfully'
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

    private async roleControl(uId: ObjectId, rName: string, add: boolean): Promise<any> {

        const user = await this.userModel.findById(uId).populate('roles')
        const role = await this.roleService.getRole(rName)

        try {
            if (add) {
                if (!user.roles.find(r => r.role === rName)) {
                    await user.updateOne({$addToSet: {roles: role['id']}})
                } else {
                    throw new HttpException('User has this role already', HttpStatus.BAD_REQUEST)
                }
            }

            if (!add) {
                if (user.roles.find(r => r.role === rName)) {
                    await user.updateOne({$pull: {roles: role['id']}})
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

    private async subscribeControl(uId: ObjectId, sId: ObjectId, follow: boolean): Promise<any> {

        const user = await this.userModel.findById(uId)
        const subscriber = await this.userModel.findById(sId)

        try {
            if (follow) {
                if (!subscriber.followings.find(f => f.toString() === uId.toString())) {
                    await user.updateOne({$addToSet: {followers: sId}})
                    await subscriber.updateOne({$addToSet: {followings: uId}})
                } else {
                    throw new HttpException('You are follow this user already', HttpStatus.BAD_REQUEST)
                }
            }

            if (!follow) {
                if (subscriber.followings.find(f => f.toString() === uId.toString())) {
                    await user.updateOne({$pull: {followers: sId}})
                    await subscriber.updateOne({$pull: {followings: uId}})
                } else {
                    throw new HttpException('You are not follow this user', HttpStatus.BAD_REQUEST)
                }
            }
        } catch (e) {
            this.userException(e)
        }
    }
}