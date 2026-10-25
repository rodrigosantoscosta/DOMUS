import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

export interface UsuarioSanitizado {
  id: number;
  nome: string;
  login: string;
  cpf: string | null;
  email: string;
  perfis: string[];
  ativo: boolean;
  ultimoLogin: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  normalizarDocumento(doc?: string | null): string | null {
    if (!doc) return null;
    const limpo = doc.replace(/\D/g, '');
    return limpo.length > 0 ? limpo : null;
  }

  sanitizarUsuario(usuario: {
    id: number;
    nome: string;
    login: string;
    cpf: string | null;
    email: string;
    senhaHash?: string;
    perfis: string;
    ativo: boolean;
    ultimoLogin: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): UsuarioSanitizado {
    return {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      cpf: usuario.cpf,
      email: usuario.email,
      perfis: usuario.perfis
        ? usuario.perfis
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : ['CORRETOR'],
      ativo: usuario.ativo,
      ultimoLogin: usuario.ultimoLogin,
      criadoEm: usuario.criadoEm,
      atualizadoEm: usuario.atualizadoEm,
    };
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioSanitizado> {
    if (
      dto.confirmarSenha !== undefined &&
      dto.confirmarSenha !== dto.senha
    ) {
      throw new BadRequestException(
        'A confirmação de senha não confere com a senha informada',
      );
    }

    const loginNormalizado = dto.login.trim().toLowerCase();
    const emailNormalizado = dto.email.trim().toLowerCase();
    const cpfNormalizado = this.normalizarDocumento(dto.cpf);

    if (cpfNormalizado && cpfNormalizado.length !== 11) {
      throw new BadRequestException('O CPF deve conter 11 dígitos numéricos');
    }

    const existentePorLoginOuEmail = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { login: loginNormalizado },
          { email: emailNormalizado },
          ...(cpfNormalizado ? [{ cpf: cpfNormalizado }] : []),
        ],
      },
    });

    if (existentePorLoginOuEmail) {
      if (existentePorLoginOuEmail.login === loginNormalizado) {
        throw new ConflictException('Já existe um usuário com este login');
      }
      if (existentePorLoginOuEmail.email === emailNormalizado) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      if (cpfNormalizado && existentePorLoginOuEmail.cpf === cpfNormalizado) {
        throw new ConflictException('Já existe um usuário com este CPF');
      }
    }

    if (dto.perfis?.includes('CADASTRADOR')) {
      throw new ForbiddenException(
        'Acesso negado: o perfil CADASTRADOR so pode ser concedido por um CADASTRADOR autenticado',
      );
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const perfisStr =
      dto.perfis && dto.perfis.length > 0
        ? Array.from(new Set(dto.perfis)).join(',')
        : 'CORRETOR';

    const criado = await this.prisma.usuario.create({
      data: {
        nome: dto.nome.trim(),
        login: loginNormalizado,
        cpf: cpfNormalizado,
        email: emailNormalizado,
        senhaHash,
        perfis: perfisStr,
        ativo: dto.ativo ?? true,
      },
    });

    return this.sanitizarUsuario(criado);
  }

  async findAll(): Promise<UsuarioSanitizado[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { id: 'asc' },
    });
    return usuarios.map((u) => this.sanitizarUsuario(u));
  }

  async findOne(id: number): Promise<UsuarioSanitizado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return this.sanitizarUsuario(usuario);
  }

  async findByLoginOrEmailComHash(identificador: string) {
    const normalizado = identificador.trim().toLowerCase();
    return this.prisma.usuario.findFirst({
      where: {
        OR: [{ login: normalizado }, { email: normalizado }],
      },
    });
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<UsuarioSanitizado> {
    await this.findOne(id);

    const loginNormalizado = dto.login?.trim().toLowerCase();
    const emailNormalizado = dto.email?.trim().toLowerCase();
    const cpfNormalizado =
      dto.cpf !== undefined ? this.normalizarDocumento(dto.cpf) : undefined;

    if (cpfNormalizado && cpfNormalizado.length !== 11) {
      throw new BadRequestException('O CPF deve conter 11 dígitos numéricos');
    }

    if (loginNormalizado || emailNormalizado || cpfNormalizado) {
      const conflito = await this.prisma.usuario.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(loginNormalizado ? [{ login: loginNormalizado }] : []),
            ...(emailNormalizado ? [{ email: emailNormalizado }] : []),
            ...(cpfNormalizado ? [{ cpf: cpfNormalizado }] : []),
          ],
        },
      });
      if (conflito) {
        throw new ConflictException(
          'Login, e-mail ou CPF já utilizado por outro usuário',
        );
      }
    }

    const atualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
        ...(loginNormalizado !== undefined ? { login: loginNormalizado } : {}),
        ...(emailNormalizado !== undefined ? { email: emailNormalizado } : {}),
        ...(cpfNormalizado !== undefined ? { cpf: cpfNormalizado } : {}),
        ...(dto.perfis !== undefined
          ? { perfis: Array.from(new Set(dto.perfis)).join(',') }
          : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      },
    });

    return this.sanitizarUsuario(atualizado);
  }

  async remove(id: number): Promise<{ removido: boolean; id: number }> {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id } });
    return { removido: true, id };
  }
}
