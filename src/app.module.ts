import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {RoleModule} from "./role/role.module";
import {UserModule} from "./user/user.module";
import {AuthModule} from "./auth/auth.module";
import {ServeStaticModule} from "@nestjs/serve-static";
import {TrackModule} from "./track/track.module";
import {FileModule} from "./file/file.module";
import * as path from "path";
import {PlaylistModule} from "./playlist/playlist.module";
import {AlbumModule} from "./album/album.module";
import {GenreModule} from "./genre/genre.module";

@Module({
  imports: [
      ServeStaticModule.forRoot({rootPath: path.resolve(__dirname, 'static')}),
      MongooseModule.forRoot('your/mongoDB/link/to/database'),
      UserModule,
      RoleModule,
      AuthModule,
      TrackModule,
      PlaylistModule,
      AlbumModule,
      GenreModule,
      FileModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
