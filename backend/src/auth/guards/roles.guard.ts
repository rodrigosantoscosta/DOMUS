import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PerfilAcesso } from '../../usuarios/dto/create-usuario.dto';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PerfilAcesso[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !Array.isArray(user.perfis)) {
      throw new ForbiddenException('Acesso negado: perfil insuficiente');
    }
    const possuiPerfil = requiredRoles.some((role) =>
      user.perfis.includes(role),
    );
    if (!possuiPerfil) {
      throw new ForbiddenException(
        `Acesso restrito aos perfis: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
