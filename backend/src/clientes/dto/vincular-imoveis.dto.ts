import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class VincularImoveisDto {
  @ApiProperty({
    example: [1, 2],
    type: [Number],
    description: 'Lista de IDs dos imóveis de interesse a vincular ao cliente',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Informe pelo menos um ID de imóvel' })
  @IsInt({ each: true })
  imovelIds: number[];
}
