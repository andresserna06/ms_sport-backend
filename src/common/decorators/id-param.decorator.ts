import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Reads the `:id` route parameter as the raw string.
//
// With @Param('id') typed as `number`, the global ValidationPipe (transform:
// true) converts the value first (+"1e2" -> 100) and the id pipe never sees the
// original text. Custom decorators are not touched by that conversion, so the
// id pipe receives the untouched string and can reject malformed ids.
//
// Usage: @IdParam(idParamPipe()) id: number
export const IdParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<{ params: { id: string } }>().params.id,
);
