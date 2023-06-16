import {HttpException, HttpStatus, Injectable, UnauthorizedException} from "@nestjs/common";
import {UserService} from "../user/user.service";
import {signInDto} from "./dto/sign.in.dto";
import {JwtService} from "@nestjs/jwt";
import {createUserDto} from "../user/dto/create.user.dto";
import * as bcrypt from "bcrypt"
import {User} from "../user/schema/user.schema";

@Injectable()
export class AuthService {

    private authException = (e) => new HttpException(`Auth service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)

    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async sighIn(dto: signInDto): Promise<any> {

        try {

            const user = await this.userService.getUserByEmail(dto.email)
            const encrypt = await bcrypt.compare(dto.password, user.password)

            if (!user || !encrypt) {
                throw new UnauthorizedException('AuthService: Email or password is invalid')
            }

            return this.tokenGenerator(user)
        } catch (e) {
            throw this.authException(e)
        }
    }

    async signUp(dto: createUserDto): Promise<any> {

        try {
            const hash = await bcrypt.hash(dto.password, 10)
            const user = await this.userService.createUser({...dto, password: hash})

            return this.tokenGenerator(user)
        } catch (e) {
            throw new HttpException(`Auth service: Something goes wrong. Error: ${e.message}`, HttpStatus.BAD_REQUEST)
        }
    }

    private async tokenGenerator(user: User) {

        const payload = {id: user['id'], username: user.username, email: user.email, role: user.roles}

        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }
}