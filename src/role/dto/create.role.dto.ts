import {IsString, NotContains} from "class-validator";

export class createRoleDto {

    @NotContains(' ', {message: 'Role validation: Role should not contain an empty spaces'})
    @IsString({message: "Role validation: Must be a string"})
    readonly role: string

    @IsString({message: "Role validation: Must be a string"})
    readonly description: string
}