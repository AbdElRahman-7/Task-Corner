import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Matches Express: admin check is bypassed in development mode.
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Not authorized as an admin');
    }

    return true;
  }
}
