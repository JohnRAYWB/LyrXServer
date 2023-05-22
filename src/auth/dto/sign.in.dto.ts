import {IsEmail, IsString} from "class-validator";

export class signInDto {

    @IsString({message: 'Auth validation: Must be a string'})
    @IsEmail({}, {message: 'Auth validation: Invalid email'})
    readonly email: string

    @IsString({message: 'Auth validation: Must be a string'})
    readonly password: string
}