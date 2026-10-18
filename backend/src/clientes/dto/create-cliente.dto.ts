import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export const TIPOS_DOCUMENTO = ['CPF', 'CNPJ'] as const;
export const CANAIS_CONTATO = [
  'WHATSAPP',
  'TELEFONE',
  'REDE_SOCIAL',
  'EMAIL',
  'PRESENCIAL',
] as const;

export class CreateClienteDto {
  @ApiPropertyOptional({
    example: 'Carlos Eduardo Mendes',
    description: 'Nome completo do cliente (aceita nomeCompleto ou nome)',
  })
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @ApiPropertyOptional({
    example: 'Carlos Eduardo Mendes',
    description: 'Alias de nomeCompleto',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    example: '98765432100',
    description: 'CPF ou CNPJ do cliente (aceita cpfDocumento ou cpf)',
  })
  @IsOptional()
  @IsString()
  cpfDocumento?: string;

  @ApiPropertyOptional({
    example: '98765432100',
    description: 'CPF do cliente conforme tela de Cadastro de Cliente do .docx',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({
    example: 'CPF',
    enum: TIPOS_DOCUMENTO,
  })
  @IsOptional()
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento?: string;

  @ApiProperty({
    example: '(83) 99988-7766',
    description: 'Telefone principal do cliente conforme tela de Cadastro de Cliente',
  })
  @IsString()
  @IsNotEmpty({ message: 'O telefone do cliente é obrigatório' })
  telefone: string;

  @ApiPropertyOptional({ example: '(83) 99988-7766' })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiPropertyOptional({
    example: 'carlos.mendes@email.com',
    description: 'E-mail do cliente conforme tela de Cadastro de Cliente',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email?: string;

  @ApiPropertyOptional({
    example: 'WHATSAPP',
    enum: CANAIS_CONTATO,
    description:
      'Canal principal de contato do cliente conforme Seções 4.1 e 4.2 do .docx',
  })
  @IsOptional()
  @IsIn(CANAIS_CONTATO)
  canalPrincipalContato?: string;

  @ApiPropertyOptional({
    example: 'Busca apartamento de 3 quartos em Manaíra, preferência nascente.',
    description:
      'Observações sobre perfil e interesses do cliente conforme Seção 4.2 do .docx',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    example: [1, 2],
    type: [Number],
    description:
      'IDs dos imóveis de interesse associados ao cliente conforme Seção 4.3 do .docx',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imoveisInteresseIds?: number[];
}
