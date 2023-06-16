import {
    ClassSerializerInterceptor,
    PlainLiteralObject,
    Type
} from "@nestjs/common";
import {
    ClassTransformOptions, Exclude,
    plainToClass
} from "class-transformer";
import {Document} from "mongoose";

function MongooseClassSerializerInterceptor(
    classToIntercept: Type
): typeof ClassSerializerInterceptor {
    return class Interceptor extends ClassSerializerInterceptor {
        private changePlainObjectToClass(document: PlainLiteralObject) {
            if (!(document instanceof Document)) {
                return document;
            }

            return plainToClass(classToIntercept, document.toJSON());
        }

        private prepareResponse(
            response: PlainLiteralObject | PlainLiteralObject[],
        ) {
            if (Array.isArray(response)) {
                return response.map(this.changePlainObjectToClass);
            }

            return this.changePlainObjectToClass(response);
        }

        serialize(
            response: PlainLiteralObject | PlainLiteralObject[],
            options: ClassTransformOptions,
        ) {
            return super.serialize(this.prepareResponse(response), options);
        }
    };
}

export default MongooseClassSerializerInterceptor;

// mongoose hasn't built-in methods to serialize schemas data
// code took from https://wanago.io/2021/08/23/api-nestjs-relationships-mongodb/
// thanks author for that!
//
// exp how it use it in schema
//
// export class User {
//     @Transform(({value}) => value.toString())
//     _id: string
//
//     @Prop({unique: true})
//     email: string
//
//     @Prop()
//     @Exclude()
//     password: string
//
//     @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}]})
//     @Type(() => Role)
//     roles: Role[]
// }