import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";

@Module({
  imports: [
      MongooseModule.forRoot('mongodb+srv://JohnRAY:secret_key@lyrx.vjgp7sh.mongodb.net/\n')
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
