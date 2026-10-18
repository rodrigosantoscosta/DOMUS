import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @ApiProperty({ example: 'Senha@123', description: 'Senha atual do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  senhaAtual: string;

  @ApiProperty({
    example: 'NovaSenha@456',
    description: 'Nova senha (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  novaSenha: string;

  @ApiPropertyOptional({
    example: 'NovaSenha@456',
    description: 'Confirmação da nova senha',
  })
  @IsOptional()
  @IsString()
  confirmarNovaSenha?: string;
}
