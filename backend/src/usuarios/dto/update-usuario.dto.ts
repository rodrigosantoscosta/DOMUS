import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { PERFIS_ACESSO, PerfilAcesso } from './create-usuario.dto';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'Junior Corretor Atualizado' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 'junior.corretor' })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: 'junior@domus.com.br' })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email?: string;

  @ApiPropertyOptional({
    example: ['CORRETOR', 'CADASTRADOR'],
    enum: PERFIS_ACESSO,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(PERFIS_ACESSO, { each: true })
  perfis?: PerfilAcesso[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
