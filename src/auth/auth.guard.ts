import {CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {Reflector} from "@nestjs/core";
import {Request} from "express";
import {jwtSecretKey} from "./secret/secret.key";

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

@Injectable()
export class AuthGuard implements CanActivate {

    constructor (
       private jwtService: JwtService,
       private reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean>{

        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if(isPublic) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const token = this.extractTokenFromHeader(request)

        if(!token) {
            throw new UnauthorizedException('Auth guard: User not authorized')
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {secret: jwtSecretKey.secret})

            request.user = payload
        } catch {
            throw new UnauthorizedException('Auth guard: Something goes wrong. Please try again!')
        }

        return true
    }

    private extractTokenFromHeader(request: Request): string | undefined {

        const [type, token] = request.headers.authorization?.split(' ') ?? []

        return type === 'Bearer' ? token : undefined
    }
}