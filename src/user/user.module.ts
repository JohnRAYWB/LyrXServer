import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "./schema/user.schema";
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {RoleModule} from "../role/role.module";
import {FileService} from "../file/file.service";

@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        RoleModule
    ],
    controllers: [UserController],
    providers: [UserService, FileService],
    exports: [UserService]
})

export class UserModule {}