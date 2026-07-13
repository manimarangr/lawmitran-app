import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ADMIN_SCOPES_KEY } from '../decorators/admin-scopes.decorator';

interface RequestUser {
  userId: string;
  role: string;
}

@Injectable()
export class AdminScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scopes = this.reflector.getAllAndOverride<AdminRole[] | undefined>(
      ADMIN_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (scopes === undefined) return true; // unscoped route

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const row = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { adminRole: true },
    });
    const adminRole = row?.adminRole ?? AdminRole.SUPER; // legacy admins = SUPER
    if (adminRole === AdminRole.SUPER || scopes.includes(adminRole)) {
      return true;
    }
    throw new ForbiddenException(
      `This action requires the ${scopes.length ? scopes.join('/') : 'SUPER'} admin role`,
    );
  }
}
