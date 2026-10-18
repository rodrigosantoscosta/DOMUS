import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CANAIS_CONTATO } from '../../clientes/dto/create-cliente.dto';

export class ProgramarRetornoDto {
  @ApiProperty({
    example: 'Retorno pós-visita: apresentar proposta ao cliente',
    description: 'Título do retorno programado',
  })
  @IsString()
  @IsNotEmpty({ message: 'O título do retorno é obrigatório' })
  titulo: string;

  @ApiPropertyOptional({
    example: 'Confirmar condições de entrada e parcelamento direto',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    example: '2026-10-22',
    description: 'Data do retorno (YYYY-MM-DD ou DD/MM/YYYY)',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({
    example: '10:00',
    description: 'Hora do retorno (HH:mm)',
  })
  @IsOptional()
  @IsString()
  hora?: string;

  @ApiPropertyOptional({
    example: '2026-10-22T10:00:00.000Z',
    description: 'Data/hora ISO-8601 do retorno',
  })
  @IsOptional()
  @IsString()
  dataHora?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  duracaoMinutos?: number;

  @ApiPropertyOptional({
    example: 'Cliente pediu para falar pelo WhatsApp no turno da manhã',
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    example: 'WHATSAPP',
    enum: CANAIS_CONTATO,
  })
  @IsOptional()
  @IsIn(CANAIS_CONTATO)
  canalContato?: string;

  @ApiPropertyOptional({
    example: 'Ligar ou enviar mensagem com minuta de contrato',
  })
  @IsOptional()
  @IsString()
  proximaAcao?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  sincronizarGoogleCalendar?: boolean;
}
