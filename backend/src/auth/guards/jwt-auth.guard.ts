import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export function obterSegredoJwt(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException(
        'Configuração crítica ausente: JWT_SECRET deve ser definido em produção',
      );
    }
    return 'domus-jwt-secret-dev-local-only-change-in-prod';
  }
  return secret;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    const authDesabilitado = process.env.DISABLE_AUTH === 'true';

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: obterSegredoJwt(),
        });
        (request as any).user = payload;
        return true;
      } catch {
        if (!authDesabilitado) {
          throw new UnauthorizedException('Token de autenticação inválido ou expirado');
        }
      }
    }

    if (!authDesabilitado) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    // Modo desenvolvimento rápido: injeta usuário padrão (Persona Junior)
    await this.injetarUsuarioDesenvolvimento(request);
    return true;
  }

  private async injetarUsuarioDesenvolvimento(request: Request): Promise<void> {
    try {
      const usuario = await this.prisma.usuario.findFirst({
        where: { ativo: true },
        orderBy: { id: 'asc' },
      });

      if (usuario) {
        (request as any).user = {
          sub: usuario.id,
          id: usuario.id,
          login: usuario.login,
          email: usuario.email,
          perfis: usuario.perfis.split(',').map((p) => p.trim()),
        };
        return;
      }
    } catch {
      // Ignora erro de acesso ao banco e usa fallback mock
    }

    (request as any).user = {
      sub: 1,
      id: 1,
      login: 'junior.corretor',
      email: 'junior@domus.com.br',
      perfis: ['CORRETOR', 'CADASTRADOR'],
    };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
