import {IsEmail, IsString, Length, NotContains} from "class-validator";

export class createUserDto {

    @IsString({message: 'User validation: Must be a string'})
    @IsEmail({}, {message: 'User validation: Invalid email'})
    readonly email: string

    @NotContains(' ', {message: 'User validation: User name should not contain an empty spaces'})
    @IsString({message: 'User validation: Must be a string'})
    readonly username: string

    @Length(4, 16, {message: 'User validation: Length must be from 4 to 16 symbols'})
    readonly password: string
}