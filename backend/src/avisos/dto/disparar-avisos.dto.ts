import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DispararAvisosDto {
  @ApiPropertyOptional({
    example: 48,
    description: 'Janela de antecedência em horas para identificar agendamentos próximos (padrão: 48h)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  horasAntecedencia?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do corretor para filtrar os avisos disparados',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  corretorId?: number;
}
