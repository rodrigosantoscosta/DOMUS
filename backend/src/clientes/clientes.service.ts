import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  normalizarDocumento(doc?: string | null): string {
    if (!doc) return '';
    return doc.replace(/\D/g, '');
  }

  private async validarImoveisExistentes(imovelIds?: number[]) {
    if (!imovelIds || imovelIds.length === 0) return [];
    const idsUnicos = Array.from(new Set(imovelIds));
    const encontrados = await this.prisma.imovel.findMany({
      where: { id: { in: idsUnicos } },
      select: { id: true },
    });

    if (encontrados.length !== idsUnicos.length) {
      const idsEncontrados = new Set(encontrados.map((i) => i.id));
      const inexistentes = idsUnicos.filter((id) => !idsEncontrados.has(id));
      throw new NotFoundException(
        `Imóvel(is) de interesse não encontrado(s): ${inexistentes.join(', ')}`,
      );
    }
    return idsUnicos;
  }

  async create(dto: CreateClienteDto) {
    const nomeFinal = (dto.nomeCompleto || dto.nome || '').trim();
    if (!nomeFinal) {
      throw new BadRequestException('O nome completo do cliente é obrigatório');
    }

    const docFinal = this.normalizarDocumento(dto.cpfDocumento || dto.cpf);
    if (!docFinal || (docFinal.length !== 11 && docFinal.length !== 14)) {
      throw new BadRequestException(
        'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para o cliente',
      );
    }

    const tipoDoc =
      dto.tipoDocumento || (docFinal.length === 14 ? 'CNPJ' : 'CPF');

    const existente = await this.prisma.cliente.findUnique({
      where: { cpfDocumento: docFinal },
    });
    if (existente) {
      throw new ConflictException(
        `Já existe um cliente cadastrado com o documento ${docFinal}`,
      );
    }

    const idsImoveis = await this.validarImoveisExistentes(
      dto.imoveisInteresseIds,
    );

    return this.prisma.cliente.create({
      data: {
        nomeCompleto: nomeFinal,
        cpfDocumento: docFinal,
        tipoDocumento: tipoDoc,
        telefone: dto.telefone.trim(),
        celular: dto.celular?.trim() || dto.telefone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        canalPrincipalContato: dto.canalPrincipalContato || 'WHATSAPP',
        observacoes: dto.observacoes?.trim() || null,
        ...(idsImoveis.length > 0
          ? {
              imoveisInteresse: {
                connect: idsImoveis.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        imoveisInteresse: true,
        imoveisProprios: true,
      },
    });
  }

  async findAll(filtros?: {
    busca?: string;
    canalPrincipalContato?: string;
  }) {
    const busca = filtros?.busca?.trim();
    return this.prisma.cliente.findMany({
      where: {
        ...(filtros?.canalPrincipalContato
          ? { canalPrincipalContato: filtros.canalPrincipalContato }
          : {}),
        ...(busca
          ? {
              OR: [
                { nomeCompleto: { contains: busca } },
                { cpfDocumento: { contains: busca.replace(/\D/g, '') || busca } },
                { telefone: { contains: busca } },
                { email: { contains: busca } },
              ],
            }
          : {}),
      },
      include: {
        imoveisInteresse: true,
        _count: {
          select: {
            agendamentos: true,
            imoveisInteresse: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        imoveisInteresse: true,
        imoveisProprios: true,
        agendamentos: {
          include: { imovel: true },
          orderBy: { dataHora: 'asc' },
        },
      },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }
    return cliente;
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.findOne(id);

    const nomeFinal =
      dto.nomeCompleto !== undefined || dto.nome !== undefined
        ? (dto.nomeCompleto || dto.nome || '').trim()
        : undefined;

    let docFinal: string | undefined;
    if (dto.cpfDocumento !== undefined || dto.cpf !== undefined) {
      docFinal = this.normalizarDocumento(dto.cpfDocumento || dto.cpf);
      if (!docFinal || (docFinal.length !== 11 && docFinal.length !== 14)) {
        throw new BadRequestException(
          'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido',
        );
      }
      const conflito = await this.prisma.cliente.findFirst({
        where: {
          id: { not: id },
          cpfDocumento: docFinal,
        },
      });
      if (conflito) {
        throw new ConflictException(
          `Já existe outro cliente com o documento ${docFinal}`,
        );
      }
    }

    const idsImoveis =
      dto.imoveisInteresseIds !== undefined
        ? await this.validarImoveisExistentes(dto.imoveisInteresseIds)
        : undefined;

    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...(nomeFinal ? { nomeCompleto: nomeFinal } : {}),
        ...(docFinal ? { cpfDocumento: docFinal } : {}),
        ...(dto.tipoDocumento !== undefined
          ? { tipoDocumento: dto.tipoDocumento }
          : {}),
        ...(dto.telefone !== undefined
          ? { telefone: dto.telefone.trim() }
          : {}),
        ...(dto.celular !== undefined
          ? { celular: dto.celular?.trim() || null }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.trim().toLowerCase() || null }
          : {}),
        ...(dto.canalPrincipalContato !== undefined
          ? { canalPrincipalContato: dto.canalPrincipalContato }
          : {}),
        ...(dto.observacoes !== undefined
          ? { observacoes: dto.observacoes?.trim() || null }
          : {}),
        ...(idsImoveis !== undefined
          ? {
              imoveisInteresse: {
                set: idsImoveis.map((imovelId) => ({ id: imovelId })),
              },
            }
          : {}),
      },
      include: {
        imoveisInteresse: true,
        imoveisProprios: true,
      },
    });
  }

  async vincularImoveisInteresse(clienteId: number, imovelIds: number[]) {
    await this.findOne(clienteId);
    const idsValidos = await this.validarImoveisExistentes(imovelIds);

    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        imoveisInteresse: {
          connect: idsValidos.map((id) => ({ id })),
        },
      },
      include: {
        imoveisInteresse: true,
      },
    });
  }

  async desvincularImovelInteresse(clienteId: number, imovelId: number) {
    await this.findOne(clienteId);
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        imoveisInteresse: {
          disconnect: [{ id: imovelId }],
        },
      },
      include: {
        imoveisInteresse: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.cliente.delete({ where: { id } });
    return { removido: true, id };
  }
}
