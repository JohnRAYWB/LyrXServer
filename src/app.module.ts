import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {RoleModule} from "./role/role.module";
import {UserModule} from "./user/user.module";
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [
      MongooseModule.forRoot('mongodb+srv://JohnRAY:secret_key@lyrx.pnxrszk.mongodb.net/LyrXEntities?retryWrites=true&w=majority'),
      UserModule,
      RoleModule,
      AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
