import {Module} from "@nestjs/common";
import {UserModule} from "../user/user.module";
import {JwtModule} from "@nestjs/jwt";
import {jwtSecretKey} from "./secret/secret.key";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";

@Module({
    imports: [
        UserModule,
        JwtModule.register({
            global: true,
            secret: jwtSecretKey.secret,
            signOptions: {expiresIn: '15d'}
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService]
})

export class AuthModule {}