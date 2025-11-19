import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user[data] : request.user;
  }
);