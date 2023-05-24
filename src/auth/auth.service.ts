import {HttpException, HttpStatus, Injectable, UnauthorizedException} from "@nestjs/common";
import {UserService} from "../user/user.service";
import {signInDto} from "./dto/sign.in.dto";
import {JwtService} from "@nestjs/jwt";
import {createUserDto} from "../user/dto/create.user.dto";
import * as bcrypt from "bcrypt"
import {User} from "../user/schema/user.schema";

@Injectable()
export class AuthService {

    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async sighIn(dto: signInDto): Promise<any> {

        const user = await this.userService.getUserByEmail(dto.email)
        const encrypt = await bcrypt.compare(dto.password, user.password)

        if (!user) {
            throw new UnauthorizedException('AuthService: Username is invalid')
        }
        if (!encrypt) {
            throw new UnauthorizedException('AuthService: Password is invalid')
        }

        return this.tokenGenerator(user)
    }

    async signUp(dto: createUserDto): Promise<any> {

        const checkEmail = await this.userService.getUserByEmail(dto.email)
        const checkUsername = await this.userService.getUserByName(dto.username)

        if(checkEmail) {
            throw new HttpException('Auth service: Current email already used', HttpStatus.BAD_REQUEST)
        }

        if(checkUsername) {
            throw new HttpException('Auth service: Current username already used', HttpStatus.BAD_REQUEST)
        }

        const hash = await bcrypt.hash(dto.password, 10)
        const user = await this.userService.createUser({...dto, password: hash})

        return this.tokenGenerator(user)
    }

    private async tokenGenerator(user: User) {

        const payload = {username: user.username, email: user.email, role: user.roles, date: Date.now()}

        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }
}