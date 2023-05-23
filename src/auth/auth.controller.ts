import {Body, Controller, Post} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {signInDto} from "./dto/sign.in.dto";
import {createUserDto} from "../user/dto/create.user.dto";
import {Public} from "./auth.guard";

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Public()
    @Post('login')
    signIn(@Body() dto: signInDto) {
        return this.authService.sighIn(dto)
    }

    @Public()
    @Post('reg')
    signUp(@Body() dto: createUserDto) {
        return this.authService.signUp(dto)
    }
}