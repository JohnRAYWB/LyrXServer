import {Body, Controller, Post, UseInterceptors} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {signInDto} from "./dto/sign.in.dto";
import {createUserDto} from "../user/dto/create.user.dto";
import {Public} from "./auth.guard";
import MongooseClassSerializerInterceptor from "../serialization/mongoose.class.serializer";
import {User} from "../user/schema/user.schema";

@Controller('auth')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
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