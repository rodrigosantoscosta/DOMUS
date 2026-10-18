import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const TIPOS_IMOVEL = [
  'CASA',
  'APARTAMENTO',
  'TERRENO',
  'COMERCIAL',
] as const;
export const FINALIDADES_IMOVEL = ['VENDA', 'ALUGUEL', 'AMBOS'] as const;
export const POSICOES_IMOVEL = [
  'NORTE',
  'SUL',
  'LESTE',
  'OESTE',
  'NASCENTE',
  'POENTE',
] as const;
export const STATUS_IMOVEL = [
  'DISPONIVEL',
  'RESERVADO',
  'VENDIDO',
  'ALUGADO',
  'INATIVO',
] as const;

export class CreateImovelDto {
  @ApiPropertyOptional({
    example: 'INS-2026-0001',
    description: 'Número da inscrição municipal/imobiliária (protótipo Cadastrar Imóvel)',
  })
  @IsOptional()
  @IsString()
  numeroInscricao?: string;

  @ApiPropertyOptional({
    example: 'APARTAMENTO',
    enum: TIPOS_IMOVEL,
    description: 'Tipo de imóvel (CASA, APARTAMENTO, TERRENO, COMERCIAL)',
  })
  @IsOptional()
  @IsIn(TIPOS_IMOVEL)
  tipoImovel?: string;

  @ApiPropertyOptional({
    example: 'VENDA',
    enum: FINALIDADES_IMOVEL,
    description: 'Finalidade do imóvel (VENDA, ALUGUEL, AMBOS)',
  })
  @IsOptional()
  @IsIn(FINALIDADES_IMOVEL)
  finalidade?: string;

  @ApiPropertyOptional({ example: '58038-000', description: 'CEP do imóvel' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({
    example: 'Av. Governador Flávio Ribeiro Coutinho',
    description: 'Endereço / logradouro do imóvel',
  })
  @IsString()
  @IsNotEmpty({ message: 'O endereço do imóvel é obrigatório' })
  endereco: string;

  @ApiPropertyOptional({ example: 'Manaíra', description: 'Bairro do imóvel' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ example: '500', description: 'Número do endereço' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ example: 'Apto 1201', description: 'Complemento / unidade residencial' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({
    example: 115.5,
    description: 'Área total do terreno / imóvel em m²',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'A área total deve ser maior que zero' })
  areaTotal?: number;

  @ApiPropertyOptional({ example: 3, description: 'Quantidade de cômodos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  comodos?: number;

  @ApiPropertyOptional({ example: 2, description: 'Quantidade de banheiros' })
  @IsOptional()
  @IsInt()
  @Min(0)
  banheiros?: number;

  @ApiPropertyOptional({ example: 650000, description: 'Valor declarado do imóvel (R$)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiPropertyOptional({
    example: ['NASCENTE', 'NORTE'],
    enum: POSICOES_IMOVEL,
    isArray: true,
    description: 'Posições solares do imóvel (dbDomus legado)',
  })
  @IsOptional()
  @IsArray()
  @IsIn(POSICOES_IMOVEL, { each: true })
  posicoes?: string[];

  @ApiPropertyOptional({
    example: 'DISPONIVEL',
    enum: STATUS_IMOVEL,
  })
  @IsOptional()
  @IsIn(STATUS_IMOVEL)
  statusImovel?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do cliente proprietário do imóvel',
  })
  @IsOptional()
  @IsInt()
  proprietarioId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID do corretor responsável pela captação',
  })
  @IsOptional()
  @IsInt()
  corretorCaptadorId?: number;
}
