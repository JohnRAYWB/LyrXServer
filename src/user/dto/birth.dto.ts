import {IsDateString} from "class-validator";

export class birthDto {

    @IsDateString({strictSeparator: false}, {message: 'Birth validation: Input data must be date yyyy-mm-dd'})
    readonly birth: Date
}