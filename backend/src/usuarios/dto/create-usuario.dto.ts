import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const PERFIS_ACESSO = ['CADASTRADOR', 'CORRETOR'] as const;
export type PerfilAcesso = (typeof PERFIS_ACESSO)[number];

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Junior Corretor', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @ApiProperty({ example: 'junior.corretor', description: 'Login único do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'O login é obrigatório' })
  login: string;

  @ApiPropertyOptional({ example: '12345678901', description: 'CPF do usuário (apenas números ou formatado)' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ example: 'junior@domus.com.br', description: 'E-mail único do usuário' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha de acesso (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @ApiPropertyOptional({
    example: 'Senha@123',
    description: 'Confirmação da senha (deve coincidir com senha quando enviada)',
  })
  @IsOptional()
  @IsString()
  confirmarSenha?: string;

  @ApiPropertyOptional({
    example: ['CORRETOR'],
    enum: PERFIS_ACESSO,
    isArray: true,
    description: 'Perfis de acesso (CADASTRADOR, CORRETOR)',
  })
  @IsOptional()
  @IsArray()
  @IsIn(PERFIS_ACESSO, { each: true, message: 'Perfil inválido. Use CADASTRADOR ou CORRETOR' })
  perfis?: PerfilAcesso[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
