import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {RoleModule} from "./role/role.module";
import {UserModule} from "./user/user.module";
import {AuthModule} from "./auth/auth.module";
import {ServeStaticModule} from "@nestjs/serve-static";
import {TrackModule} from "./track/track.module";
import {FileModule} from "./file/file.module";
import * as path from "path";

@Module({
  imports: [
      ServeStaticModule.forRoot({rootPath: path.resolve(__dirname, 'static')}),
      MongooseModule.forRoot('mongodb+srv://JohnRAY:secret_key@lyrx.pnxrszk.mongodb.net/LyrXEntities?retryWrites=true&w=majority'),
      UserModule,
      RoleModule,
      AuthModule,
      TrackModule,
      FileModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
