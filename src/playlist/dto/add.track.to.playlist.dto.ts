import {ObjectId} from "mongoose";

export class addTrackToPlaylistDto {

    readonly playlist: ObjectId

    readonly track: ObjectId
    
    readonly user: ObjectId
}