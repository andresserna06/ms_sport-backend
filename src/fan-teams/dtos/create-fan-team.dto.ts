import { IsInt, IsPositive } from 'class-validator';

export class CreateFanTeamDto {
  @IsInt({ message: 'El campo aficionado debe ser un número entero' })
  @IsPositive({ message: 'El campo aficionado debe ser un id positivo' })
  fanId!: number;

  @IsInt({ message: 'El campo equipo debe ser un número entero' })
  @IsPositive({ message: 'El campo equipo debe ser un id positivo' })
  teamId!: number;
}
