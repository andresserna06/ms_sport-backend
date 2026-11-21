import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Reads a route parameter (`id` by default) as the raw string.
//
// With @Param('id') typed as `number`, the global ValidationPipe (transform:
// true) converts the value first (+"1e2" -> 100) and the id pipe never sees the
// original text. Custom decorators are not touched by that conversion, so the
// id pipe receives the untouched string and can reject malformed ids.
//
// Usage: @IdParam(idParamPipe()) id: number
//        @IdParam('teamId', idParamPipe()) teamId: number
export const IdParam = createParamDecorator(
  (name: string | undefined, context: ExecutionContext): string =>
    context
      .switchToHttp()
      .getRequest<{ params: Record<string, string> }>().params[name ?? 'id'],
);
