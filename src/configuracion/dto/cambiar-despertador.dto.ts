import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class CambiarDespertadorDto {
  @ApiProperty({ description: 'true enciende el Despertador, false lo apaga' })
  // La conversión implícita global convierte cualquier texto en true («si» → true): se valida el valor original.
  @Transform(({ obj }: { obj: Record<string, unknown> }) => obj.activo)
  @IsBoolean({ message: 'activo debe ser true o false' })
  activo!: boolean;
}
