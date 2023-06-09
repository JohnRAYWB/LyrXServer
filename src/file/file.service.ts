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

    createFile(type, file, route, entity?) {

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

    copyFile(file, type, currentRoute, newRoute, entity) {

        const fileName = uuid.v4() + '.' + file.split('.').pop()

        const source = path.resolve(__dirname, '..', 'static', currentRoute, entity, file)
        const destinationCheck = path.resolve(__dirname, '..', 'static', newRoute, entity, type)
        const destination = path.resolve(__dirname, '..', 'static', newRoute, entity, type, fileName)

        if(!fs.existsSync(destinationCheck)) {
            fs.mkdirSync(destinationCheck, {recursive: true})
        }

        fs.copyFileSync(source, destination)

        return type + '/' + fileName
    }

    moveFile(file, type, route, currentEntity, destinationEntity?) {

        const destination = path.resolve(__dirname, '..', 'static', route, destinationEntity, type)
        const currentPath = path.resolve(__dirname, '..', 'static', route, currentEntity, file)
        const destinationPath = path.resolve(__dirname, '..', 'static', route, destinationEntity, file)

        if(!fs.existsSync(destination)) {
            fs.mkdirSync(destination, {recursive: true})
        }

        fs.renameSync(currentPath, destinationPath)
    }

    updateFile(oldFile, newFile, type, route, entity?) {

        try{
            this.removeFile(oldFile, route, entity)
            const file = this.createFile(type, newFile, route, entity)

            return file
        } catch {
            throw new HttpException('File sys: Something goes wrong, try again!', HttpStatus.BAD_REQUEST)
        }
    }

    removeFile(file, route, entity?) {
        const filePath = path.resolve(__dirname, '..', 'static', route, entity, file)

        fs.unlinkSync(filePath)
    }
}