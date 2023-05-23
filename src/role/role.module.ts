import {Module} from "@nestjs/common";
import {RoleService} from "./role.service";
import {RoleController} from "./role.controller";
import {MongooseModule} from "@nestjs/mongoose";
import {Role, RoleSchema} from "./schema/role.schema";
import {APP_GUARD} from "@nestjs/core";
import {RoleGuard} from "./role.guard";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Role.name, schema: RoleSchema}])
    ],
    controllers: [RoleController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: RoleGuard
        },
        RoleService
    ],
    exports: [RoleService]
})
export class RoleModule {}