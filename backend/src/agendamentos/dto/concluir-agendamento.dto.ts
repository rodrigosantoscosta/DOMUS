import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConcluirAgendamentoDto {
  @ApiPropertyOptional({
    example: 'Cliente gostou do imóvel, enviar simulação de financiamento na quinta-feira',
    description: 'Anotação de resultado / observação ao concluir atendimento',
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    example: 'Enviar simulação de financiamento pelo WhatsApp',
    description: 'Próxima ação definida ao concluir o atendimento (Seção 3 do .docx)',
  })
  @IsOptional()
  @IsString()
  proximaAcao?: string;

  @ApiPropertyOptional({
    example: '2026-10-22T14:00:00.000Z',
    description: 'Data do retorno para a próxima ação',
  })
  @IsOptional()
  @IsString()
  dataRetorno?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Se verdadeiro e houver proximaAcao, cria automaticamente um novo agendamento de RETORNO',
  })
  @IsOptional()
  @IsBoolean()
  gerarAgendamentoRetorno?: boolean;
}
