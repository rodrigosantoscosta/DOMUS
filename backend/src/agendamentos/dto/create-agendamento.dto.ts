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

export const TIPOS_AGENDAMENTO = [
  'VISITA',
  'RETORNO',
  'ATENDIMENTO',
] as const;
export const STATUS_AGENDAMENTO = [
  'PENDENTE',
  'CONFIRMADO',
  'CONCLUIDO',
  'CANCELADO',
] as const;

export class CreateAgendamentoDto {
  @ApiProperty({
    example: 'Visita ao Apto Manaíra com Carlos',
    description: 'Título do agendamento conforme tela de Agendar Compromisso do .docx',
  })
  @IsString()
  @IsNotEmpty({ message: 'O título do agendamento é obrigatório' })
  titulo: string;

  @ApiPropertyOptional({
    example: 'Apresentar planta e verificar proposta de entrada',
    description: 'Descrição do agendamento conforme tela de Agendar Compromisso',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    example: 'Apresentar planta e proposta',
    description: 'Descrição curta exibida na lista de Seus Atendimentos (gerada automaticamente se omitida)',
  })
  @IsOptional()
  @IsString()
  descricaoCurta?: string;

  @ApiPropertyOptional({
    example: 'VISITA',
    enum: TIPOS_AGENDAMENTO,
    description: 'Tipo de compromisso: VISITA, RETORNO ou ATENDIMENTO (Seção 4.1 do .docx)',
  })
  @IsOptional()
  @IsIn(TIPOS_AGENDAMENTO)
  tipo?: string;

  @ApiPropertyOptional({
    example: 'PENDENTE',
    enum: STATUS_AGENDAMENTO,
  })
  @IsOptional()
  @IsIn(STATUS_AGENDAMENTO)
  status?: string;

  @ApiPropertyOptional({
    example: '2026-10-20',
    description: 'Data do compromisso (YYYY-MM-DD ou DD/MM/YYYY) conforme tela de Agendar Compromisso',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({
    example: '14:30',
    description: 'Hora do compromisso (HH:mm) conforme tela de Agendar Compromisso',
  })
  @IsOptional()
  @IsString()
  hora?: string;

  @ApiPropertyOptional({
    example: '2026-10-20T14:30:00.000Z',
    description: 'Data/hora completa ISO-8601 (alternativa aos campos separados data e hora)',
  })
  @IsOptional()
  @IsString()
  dataHora?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Duração em minutos conforme tela de Agendar Compromisso',
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  duracaoMinutos?: number;

  @ApiPropertyOptional({
    example: '60 min',
    description: 'Alias textual para duração conforme tela mobile (ex: "60", "1h", "45 min")',
  })
  @IsOptional()
  @IsString()
  duracao?: string;

  @ApiPropertyOptional({
    example: 'Levar chaves da portaria e ficha de visita',
    description: 'Observação do compromisso conforme tela de Agendar Compromisso',
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    example: 'WHATSAPP',
    enum: CANAIS_CONTATO,
    description: 'Canal de contato preferencial para este compromisso/retorno',
  })
  @IsOptional()
  @IsIn(CANAIS_CONTATO)
  canalContato?: string;

  @ApiPropertyOptional({
    example: 'Ligar para confirmar feedback da visita e proposta de financiamento',
    description: 'Próxima ação anotada após o atendimento (Seção 2 e 3 do .docx)',
  })
  @IsOptional()
  @IsString()
  proximaAcao?: string;

  @ApiPropertyOptional({
    example: '2026-10-22T10:00:00.000Z',
    description: 'Data prevista para o retorno da próxima ação',
  })
  @IsOptional()
  @IsString()
  dataRetorno?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Autoriza sincronização opcional do evento com o Google Calendar (Seção 4.1 do .docx)',
  })
  @IsOptional()
  @IsBoolean()
  sincronizarGoogleCalendar?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID do cliente associado ao agendamento/atendimento (obrigatório)',
  })
  @IsInt({ message: 'O clienteId é obrigatório e deve ser numérico' })
  clienteId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do imóvel selecionado (obrigatório quando tipo = VISITA)',
  })
  @IsOptional()
  @IsInt()
  imovelId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do corretor responsável',
  })
  @IsOptional()
  @IsInt()
  corretorId?: number;
}
