import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import * as fs from "fs"
import * as path from "path"
import * as uuid from "uuid"

export enum FileType {
    AUDIO = 'audio',
    IMAGE = 'image'
}

@Injectable()
export class FileService {

    createFile(type, file, route, entity: string = '') {

        try {
            const fileExtension = file.originalname.split('.').pop()
            const fileName = uuid.v4() + '.' + fileExtension
            const filePath = path.resolve(__dirname, '..', 'static', route, entity, type)

            if(!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, {recursive: true})
            }

            fs.writeFileSync(path.resolve(filePath, fileName), file.buffer)

            return type + '/' + fileName
        } catch {
            throw new HttpException('File sys: Something goes wrong, try again!', HttpStatus.BAD_REQUEST)
        }
    }

    removeFile(file, route, entity: string = '') {
        const filePath = path.resolve(__dirname, '..', 'static', route, entity, file)

        fs.unlinkSync(filePath)
    }
}