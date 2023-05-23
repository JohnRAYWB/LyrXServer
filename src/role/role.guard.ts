import {Role} from "./schema/role.schema";
import {
    CanActivate,
    ExecutionContext,
    HttpException, HttpStatus,
    Injectable,
    SetMetadata,
} from "@nestjs/common";
import {Reflector} from "@nestjs/core"
import {JwtService} from "@nestjs/jwt"
import {Request} from "express";

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RoleGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        private jwtService: JwtService
    ) {}

    canActivate(context: ExecutionContext): boolean {

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if (!requiredRoles) {
            return true
        }

        try {
            const request = context.switchToHttp().getRequest()
            const token = this.extractFromHeader(request)

            const user = this.jwtService.verify(token)
            request.user = user

            return requiredRoles.some(role => user.role.find(roles => roles.role === role))
        } catch {
            throw new HttpException('Role Guard: Permission denied', HttpStatus.FORBIDDEN)
        }
    }

    extractFromHeader(request: Request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}