import {User} from "../schema/user.schema";
import {IsDateString} from "class-validator";

export class birthDto {

    readonly user: User

    @IsDateString({strictSeparator: false}, {message: 'Birth validation: Input data must be date yyyy-mm-dd'})
    readonly birth: Date
}