import {HydratedDocument} from "mongoose"
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";

export type RoleDocument = HydratedDocument<Role>

@Schema()
export class Role {

    @Prop()
    role: string

    @Prop()
    description: string
}

export const RoleSchema = SchemaFactory.createForClass(Role)