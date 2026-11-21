import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { idParamPipe } from './id-param.pipe';

describe('idParamPipe', () => {
  const transform = (value: string) =>
    idParamPipe().transform(value, { type: 'param', metatype: Number });

  it('converts a numeric id', async () => {
    await expect(transform('12')).resolves.toBe(12);
  });

  it.each(['abc', '1.5', '12abc', '', '1e2', '0x10', ' 5'])(
    'rejects the id "%s" with INVALID_OPERATION and a Spanish message',
    async (value) => {
      const result = transform(value);

      await expect(result).rejects.toBeInstanceOf(ApplicationException);
      await expect(result).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_OPERATION,
        message: 'El id debe ser un número entero',
      });
    },
  );
});
