import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesModule } from '../clientes/clientes.module';
import { ClientesService } from '../clientes/clientes.service';
import { ImoveisModule } from '../imoveis/imoveis.module';
import { ImoveisService } from '../imoveis/imoveis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AgendamentosService } from './agendamentos.service';

describe('AgendamentosService (RN07 a RN12, RN16)', () => {
  let agendamentosService: AgendamentosService;
  let clientesService: ClientesService;
  let imoveisService: ImoveisService;
  let usuariosService: UsuariosService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ClientesModule, ImoveisModule, UsuariosModule],
      providers: [AgendamentosService],
    }).compile();

    agendamentosService = module.get<AgendamentosService>(AgendamentosService);
    clientesService = module.get<ClientesService>(ClientesService);
    imoveisService = module.get<ImoveisService>(ImoveisService);
    usuariosService = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RN07/RN08: deve exigir imovelId e data/hora ao agendar VISITA e converter campos separados data (DD/MM/YYYY) + hora (HH:mm)', async () => {
    const cliente = await clientesService.create({
      nomeCompleto: 'Ana Paula',
      cpf: '12312312399',
      telefone: '83999112233',
      canalPrincipalContato: 'WHATSAPP',
    });

    await expect(
      agendamentosService.create({
        titulo: 'Visita sem imóvel',
        tipo: 'VISITA',
        data: '20/10/2026',
        hora: '15:00',
        clienteId: cliente.id,
      }),
    ).rejects.toThrow(BadRequestException);

    const imovel = await imoveisService.create({
      endereco: 'Av. Bessa, 300',
      bairro: 'Bessa',
    });

    await expect(
      agendamentosService.create({
        titulo: 'Visita sem data',
        tipo: 'VISITA',
        clienteId: cliente.id,
        imovelId: imovel.id,
      }),
    ).rejects.toThrow(BadRequestException);

    const visita = await agendamentosService.create({
      titulo: 'Visita Apto Bessa',
      descricao: 'Apresentar área de lazer e vista mar',
      tipo: 'VISITA',
      data: '20/10/2026',
      hora: '15:00',
      duracao: '1h',
      observacao: 'Cliente vai com o cônjuge',
      clienteId: cliente.id,
      imovelId: imovel.id,
    });

    expect(visita.id).toBeDefined();
    expect(visita.tipo).toBe('VISITA');
    expect(visita.canalContato).toBe('WHATSAPP');
    expect(visita.duracaoMinutos).toBe(60);
    expect(visita.dataHora?.toISOString()).toBe('2026-10-20T15:00:00.000Z');
  });

  it('RN10: deve bloquear conflito de horário na agenda do mesmo corretor', async () => {
    const corretor = await usuariosService.create({
      nome: 'Junior Corretor',
      login: 'junior',
      email: 'junior@domus.com',
      senha: 'Password123',
    });
    const cliente = await clientesService.create({
      nomeCompleto: 'Cliente Conflito',
      cpf: '22233344455',
      telefone: '83988881111',
    });
    const imovel = await imoveisService.create({
      endereco: 'Rua Altiplano, 10',
    });

    await agendamentosService.create({
      titulo: 'Visita 1',
      tipo: 'VISITA',
      data: '2026-10-21',
      hora: '14:00',
      duracaoMinutos: 60,
      clienteId: cliente.id,
      imovelId: imovel.id,
      corretorId: corretor.id,
    });

    await expect(
      agendamentosService.create({
        titulo: 'Visita 2 Sobreposta',
        tipo: 'VISITA',
        data: '2026-10-21',
        hora: '14:30',
        duracaoMinutos: 60,
        clienteId: cliente.id,
        imovelId: imovel.id,
        corretorId: corretor.id,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('RN09/RN11/RN12/RN16: deve programar retorno a partir da visita, sincronizar com Google Calendar, concluir atendimento e agrupar por cliente e por imóvel', async () => {
    const cliente = await clientesService.create({
      nomeCompleto: 'Marcos Vinícius',
      cpf: '44455566677',
      telefone: '83999776655',
      canalPrincipalContato: 'TELEFONE',
    });
    const imovel = await imoveisService.create({
      endereco: 'Av. Cabo Branco, 900',
      bairro: 'Cabo Branco',
    });

    const visita = await agendamentosService.create({
      titulo: 'Visita Cobertura Cabo Branco',
      tipo: 'VISITA',
      data: '2026-10-25',
      hora: '10:00',
      clienteId: cliente.id,
      imovelId: imovel.id,
    });

    const retorno = await agendamentosService.programarRetorno(visita.id, {
      titulo: 'Retorno sobre proposta da cobertura',
      data: '2026-10-27',
      hora: '16:00',
      proximaAcao: 'Ligar para negociar valor de entrada',
      sincronizarGoogleCalendar: true,
    });

    expect(retorno.tipo).toBe('RETORNO');
    expect(retorno.agendamentoOrigemId).toBe(visita.id);
    expect(retorno.imovelId).toBe(imovel.id);
    expect(retorno.canalContato).toBe('TELEFONE');
    expect(retorno.googleCalendarEventId).toContain('domus-evt-');
    expect(retorno.googleCalendarUrl).toContain('calendar.google.com');

    await agendamentosService.create({
      titulo: 'Atendimento inicial sem data de retorno',
      tipo: 'ATENDIMENTO',
      proximaAcao: 'Enviar opções de financiamento',
      clienteId: cliente.id,
    });

    const visaoGeral = await agendamentosService.obterVisaoGeral();
    expect(visaoGeral.totalAtendimentos).toBe(3);
    expect(visaoGeral.totalSemData).toBe(1);
    expect(visaoGeral.porCliente).toHaveLength(1);
    expect(visaoGeral.porCliente[0].totalCompromissos).toBe(3);
    expect(visaoGeral.porImovel).toHaveLength(1);
    expect(visaoGeral.porImovel[0].totalCompromissos).toBe(2);

    const concluido = await agendamentosService.concluir(visita.id, {
      observacao: 'Visita realizada com sucesso',
    });
    expect(concluido.status).toBe('CONCLUIDO');
  });
});
