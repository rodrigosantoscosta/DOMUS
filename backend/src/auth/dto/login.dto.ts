import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'junior.corretor',
    description: 'Username (login ou e-mail conforme protótipo da tela de Login)',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: 'junior.corretor',
    description: 'Alternativa a username: login ou e-mail do usuário',
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({
    example: 'junior@domus.com.br',
    description: 'Alternativa a username: e-mail do usuário',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'Senha@123',
    description: 'Password (senha do usuário conforme protótipo da tela de Login)',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário (aceita tanto "senha" quanto "password")',
    required: false,
  })
  @IsOptional()
  @IsString()
  senha?: string;
}
