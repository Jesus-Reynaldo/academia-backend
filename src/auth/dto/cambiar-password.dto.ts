import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passwordActual!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  passwordNueva!: string;
}
