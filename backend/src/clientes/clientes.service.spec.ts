import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImoveisModule } from '../imoveis/imoveis.module';
import { ImoveisService } from '../imoveis/imoveis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ClientesService } from './clientes.service';

describe('ClientesService (RN04, RN05)', () => {
  let clientesService: ClientesService;
  let imoveisService: ImoveisService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ImoveisModule],
      providers: [ClientesService],
    }).compile();

    clientesService = module.get<ClientesService>(ClientesService);
    imoveisService = module.get<ImoveisService>(ImoveisService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RN04: deve cadastrar cliente com CPF, telefone, e-mail, canalPrincipalContato padrão WHATSAPP e observações', async () => {
    const cliente = await clientesService.create({
      nomeCompleto: 'Maria Clara',
      cpf: '123.456.789-00',
      telefone: '(83) 98888-7777',
      email: 'Maria@Email.com',
      observacoes: 'Interesse em apartamento 2 quartos perto da praia',
    });

    expect(cliente.id).toBeDefined();
    expect(cliente.cpfDocumento).toBe('12345678900');
    expect(cliente.tipoDocumento).toBe('CPF');
    expect(cliente.canalPrincipalContato).toBe('WHATSAPP');
    expect(cliente.email).toBe('maria@email.com');
  });

  it('RN04: deve rejeitar CPF inválido ou duplicado', async () => {
    await expect(
      clientesService.create({
        nomeCompleto: 'Invalido',
        cpf: '123',
        telefone: '8399999999',
      }),
    ).rejects.toThrow(BadRequestException);

    await clientesService.create({
      nomeCompleto: 'Cliente 1',
      cpf: '11122233344',
      telefone: '8399999999',
    });

    await expect(
      clientesService.create({
        nomeCompleto: 'Cliente 2',
        cpf: '111.222.333-44',
        telefone: '8398888888',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('RN05: deve associar um ou mais imóveis de interesse ao cliente na criação e via endpoint dedicado', async () => {
    const imovel1 = await imoveisService.create({
      endereco: 'Av. Epitácio Pessoa, 1000',
      bairro: 'Tambaú',
      tipoImovel: 'APARTAMENTO',
      finalidade: 'VENDA',
      valor: 450000,
    });
    const imovel2 = await imoveisService.create({
      endereco: 'Rua das Trincheiras, 200',
      bairro: 'Centro',
      tipoImovel: 'CASA',
      finalidade: 'ALUGUEL',
      valor: 2500,
    });

    const cliente = await clientesService.create({
      nomeCompleto: 'Roberto Carlos',
      cpfDocumento: '55566677788',
      telefone: '83991112222',
      canalPrincipalContato: 'TELEFONE',
      imoveisInteresseIds: [imovel1.id],
    });

    expect(cliente.imoveisInteresse).toHaveLength(1);
    expect(cliente.imoveisInteresse[0].id).toBe(imovel1.id);

    const atualizado = await clientesService.vincularImoveisInteresse(
      cliente.id,
      [imovel2.id],
    );
    expect(atualizado.imoveisInteresse).toHaveLength(2);

    await expect(
      clientesService.vincularImoveisInteresse(cliente.id, [99999]),
    ).rejects.toThrow(NotFoundException);
  });
});
