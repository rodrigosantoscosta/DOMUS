import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesModule } from '../clientes/clientes.module';
import { ClientesService } from '../clientes/clientes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ImoveisService } from './imoveis.service';

describe('ImoveisService (RN06)', () => {
  let imoveisService: ImoveisService;
  let clientesService: ClientesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ClientesModule],
      providers: [ImoveisService],
    }).compile();

    imoveisService = module.get<ImoveisService>(ImoveisService);
    clientesService = module.get<ClientesService>(ClientesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RN06: deve cadastrar imóvel completo vinculado ao proprietário e posições solares', async () => {
    const proprietario = await clientesService.create({
      nomeCompleto: 'Proprietário José',
      cpf: '99988877766',
      telefone: '83988776655',
    });

    const imovel = await imoveisService.create({
      numeroInscricao: 'INS-001',
      tipoImovel: 'APARTAMENTO',
      finalidade: 'VENDA',
      cep: '58039-000',
      endereco: 'Av. Cabo Branco',
      bairro: 'Cabo Branco',
      numero: '150',
      areaTotal: 95.0,
      comodos: 3,
      banheiros: 2,
      valor: 780000,
      posicoes: ['NASCENTE', 'SUL'],
      proprietarioId: proprietario.id,
    });

    expect(imovel.id).toBeDefined();
    expect(imovel.numeroInscricao).toBe('INS-001');
    expect(imovel.posicoes).toEqual(['NASCENTE', 'SUL']);
    expect(imovel.proprietario.id).toBe(proprietario.id);
  });

  it('RN06: deve impedir inscrição duplicada e validar existência do proprietário', async () => {
    await imoveisService.create({
      numeroInscricao: 'INS-DUP',
      endereco: 'Rua A, 10',
    });

    await expect(
      imoveisService.create({
        numeroInscricao: 'INS-DUP',
        endereco: 'Rua B, 20',
      }),
    ).rejects.toThrow(ConflictException);

    await expect(
      imoveisService.create({
        endereco: 'Rua C, 30',
        proprietarioId: 99999,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
