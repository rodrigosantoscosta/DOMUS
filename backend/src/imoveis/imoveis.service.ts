import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImovelDto } from './dto/create-imovel.dto';
import { UpdateImovelDto } from './dto/update-imovel.dto';

@Injectable()
export class ImoveisService {
  constructor(private readonly prisma: PrismaService) {}

  private formatarImovel(imovel: any) {
    return {
      ...imovel,
      posicoes: imovel.posicoes
        ? imovel.posicoes
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean)
        : [],
    };
  }

  async create(dto: CreateImovelDto) {
    const inscricaoNormalizada = dto.numeroInscricao?.trim() || null;

    if (inscricaoNormalizada) {
      const existente = await this.prisma.imovel.findUnique({
        where: { numeroInscricao: inscricaoNormalizada },
      });
      if (existente) {
        throw new ConflictException(
          `Já existe um imóvel cadastrado com o número de inscrição ${inscricaoNormalizada}`,
        );
      }
    }

    if (dto.proprietarioId) {
      const proprietario = await this.prisma.cliente.findUnique({
        where: { id: dto.proprietarioId },
      });
      if (!proprietario) {
        throw new NotFoundException(
          `Cliente proprietário com ID ${dto.proprietarioId} não encontrado`,
        );
      }
    }

    if (dto.corretorCaptadorId) {
      const corretor = await this.prisma.usuario.findUnique({
        where: { id: dto.corretorCaptadorId },
      });
      if (!corretor) {
        throw new NotFoundException(
          `Corretor captador com ID ${dto.corretorCaptadorId} não encontrado`,
        );
      }
    }

    const criado = await this.prisma.imovel.create({
      data: {
        numeroInscricao: inscricaoNormalizada,
        tipoImovel: dto.tipoImovel || 'APARTAMENTO',
        finalidade: dto.finalidade || 'VENDA',
        cep: dto.cep?.trim() || null,
        endereco: dto.endereco.trim(),
        bairro: dto.bairro?.trim() || null,
        numero: dto.numero?.trim() || null,
        complemento: dto.complemento?.trim() || null,
        areaTotal: dto.areaTotal ?? null,
        comodos: dto.comodos ?? 1,
        banheiros: dto.banheiros ?? 1,
        valor: dto.valor ?? 0,
        posicoes:
          dto.posicoes && dto.posicoes.length > 0
            ? Array.from(new Set(dto.posicoes)).join(',')
            : null,
        statusImovel: dto.statusImovel || 'DISPONIVEL',
        proprietarioId: dto.proprietarioId ?? null,
        corretorCaptadorId: dto.corretorCaptadorId ?? null,
      },
      include: {
        proprietario: true,
      },
    });

    return this.formatarImovel(criado);
  }

  async findAll(filtros?: {
    finalidade?: string;
    tipoImovel?: string;
    bairro?: string;
    statusImovel?: string;
    proprietarioId?: number;
  }) {
    const imoveis = await this.prisma.imovel.findMany({
      where: {
        ...(filtros?.finalidade ? { finalidade: filtros.finalidade } : {}),
        ...(filtros?.tipoImovel ? { tipoImovel: filtros.tipoImovel } : {}),
        ...(filtros?.bairro
          ? { bairro: { contains: filtros.bairro } }
          : {}),
        ...(filtros?.statusImovel
          ? { statusImovel: filtros.statusImovel }
          : {}),
        ...(filtros?.proprietarioId !== undefined
          ? { proprietarioId: filtros.proprietarioId }
          : {}),
      },
      include: {
        proprietario: true,
        _count: {
          select: {
            clientesInteressados: true,
            agendamentos: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return imoveis.map((i) => this.formatarImovel(i));
  }

  async findOne(id: number) {
    const imovel = await this.prisma.imovel.findUnique({
      where: { id },
      include: {
        proprietario: true,
        clientesInteressados: true,
        agendamentos: {
          include: { cliente: true },
          orderBy: { dataHora: 'asc' },
        },
      },
    });
    if (!imovel) {
      throw new NotFoundException(`Imóvel com ID ${id} não encontrado`);
    }
    return this.formatarImovel(imovel);
  }

  async update(id: number, dto: UpdateImovelDto) {
    await this.findOne(id);

    const inscricaoNormalizada =
      dto.numeroInscricao !== undefined
        ? dto.numeroInscricao?.trim() || null
        : undefined;

    if (inscricaoNormalizada) {
      const conflito = await this.prisma.imovel.findFirst({
        where: {
          id: { not: id },
          numeroInscricao: inscricaoNormalizada,
        },
      });
      if (conflito) {
        throw new ConflictException(
          `Já existe outro imóvel com o número de inscrição ${inscricaoNormalizada}`,
        );
      }
    }

    const atualizado = await this.prisma.imovel.update({
      where: { id },
      data: {
        ...(inscricaoNormalizada !== undefined
          ? { numeroInscricao: inscricaoNormalizada }
          : {}),
        ...(dto.tipoImovel !== undefined ? { tipoImovel: dto.tipoImovel } : {}),
        ...(dto.finalidade !== undefined ? { finalidade: dto.finalidade } : {}),
        ...(dto.cep !== undefined ? { cep: dto.cep?.trim() || null } : {}),
        ...(dto.endereco !== undefined
          ? { endereco: dto.endereco.trim() }
          : {}),
        ...(dto.bairro !== undefined
          ? { bairro: dto.bairro?.trim() || null }
          : {}),
        ...(dto.numero !== undefined
          ? { numero: dto.numero?.trim() || null }
          : {}),
        ...(dto.complemento !== undefined
          ? { complemento: dto.complemento?.trim() || null }
          : {}),
        ...(dto.areaTotal !== undefined ? { areaTotal: dto.areaTotal } : {}),
        ...(dto.comodos !== undefined ? { comodos: dto.comodos } : {}),
        ...(dto.banheiros !== undefined ? { banheiros: dto.banheiros } : {}),
        ...(dto.valor !== undefined ? { valor: dto.valor } : {}),
        ...(dto.posicoes !== undefined
          ? {
              posicoes:
                dto.posicoes.length > 0
                  ? Array.from(new Set(dto.posicoes)).join(',')
                  : null,
            }
          : {}),
        ...(dto.statusImovel !== undefined
          ? { statusImovel: dto.statusImovel }
          : {}),
        ...(dto.proprietarioId !== undefined
          ? { proprietarioId: dto.proprietarioId }
          : {}),
        ...(dto.corretorCaptadorId !== undefined
          ? { corretorCaptadorId: dto.corretorCaptadorId }
          : {}),
      },
      include: { proprietario: true },
    });

    return this.formatarImovel(atualizado);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.imovel.delete({ where: { id } });
    return { removido: true, id };
  }
}
