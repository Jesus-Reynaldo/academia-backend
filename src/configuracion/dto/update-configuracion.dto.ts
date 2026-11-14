import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateConfiguracionDto {
  @ApiPropertyOptional({ example: 'Unidad Educativa San Andrés' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la institución no puede quedar vacío' })
  @MaxLength(150)
  nombreInstitucion?: string;

  @ApiPropertyOptional({ example: 'UESA', description: 'Vacío para quitarla' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(20)
  sigla?: string;
}
