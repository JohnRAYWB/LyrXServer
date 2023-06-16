import {HydratedDocument} from "mongoose"
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Transform} from "class-transformer";

export type RoleDocument = HydratedDocument<Role>

@Schema()
export class Role {

    @Transform(({value}) => value.toString())
    _id: string

    @Prop()
    role: string

    @Prop()
    description: string
}

export const RoleSchema = SchemaFactory.createForClass(Role)