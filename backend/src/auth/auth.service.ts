import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  UsuarioSanitizado,
  UsuariosService,
} from '../usuarios/usuarios.service';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    usuario: UsuarioSanitizado;
  }> {
    const identificador = (dto.username || dto.login || dto.email || '').trim();
    const senhaInformada = dto.password || dto.senha || '';

    if (!identificador || !senhaInformada) {
      throw new BadRequestException(
        'Informe o usuário (username/login/email) e a senha (password/senha)',
      );
    }

    const usuario =
      await this.usuariosService.findByLoginOrEmailComHash(identificador);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
    }

    const senhaValida = await bcrypt.compare(senhaInformada, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
    }

    const atualizado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const usuarioSanitizado = this.usuariosService.sanitizarUsuario(atualizado);
    const payload = {
      sub: usuarioSanitizado.id,
      login: usuarioSanitizado.login,
      email: usuarioSanitizado.email,
      nome: usuarioSanitizado.nome,
      perfis: usuarioSanitizado.perfis,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: usuarioSanitizado,
    };
  }

  async alterarSenha(
    usuarioId: number,
    dto: AlterarSenhaDto,
  ): Promise<{ mensagem: string }> {
    if (
      dto.confirmarNovaSenha !== undefined &&
      dto.confirmarNovaSenha !== dto.novaSenha
    ) {
      throw new BadRequestException(
        'A confirmação da nova senha não confere com a nova senha',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const senhaAtualCorreta = await bcrypt.compare(
      dto.senhaAtual,
      usuario.senhaHash,
    );
    if (!senhaAtualCorreta) {
      throw new UnauthorizedException('A senha atual informada está incorreta');
    }

    const novoHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash: novoHash },
    });

    return { mensagem: 'Senha alterada com sucesso' };
  }

  async obterPerfil(usuarioId: number): Promise<UsuarioSanitizado> {
    return this.usuariosService.findOne(usuarioId);
  }
}
