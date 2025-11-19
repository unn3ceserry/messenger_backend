import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/src/shared/decorators/public.decorator';
import { PrismaService } from '@/src/core/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prismaService: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    try {
      if(typeof req.session.userId === 'undefined') {
        throw new UnauthorizedException({
          message: 'Пользователь не авторизирован.',
        });
      }
      const user = await this.prismaService.user.findUnique({
        where: {
          id: req.session.userId,
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'Пользователь не авторизирован.',
        });
      }

      req.user = user;
    } catch {
      throw new UnauthorizedException({
        message: 'Пользователь не авторизирован.',
      });
    }
    return true;
  }
}
