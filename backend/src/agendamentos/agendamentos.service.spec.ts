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
    // 15:00 no fuso padrao America/Recife (-03:00) equivale a 18:00 UTC
    expect(visita.dataHora?.toISOString()).toBe('2026-10-20T18:00:00.000Z');
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

  it('RN16 (Solucao 1): deve preservar horario local (-03:00) com ctz=America/Recife e recalcular URL/eventId no update', async () => {
    const cliente = await clientesService.create({
      nomeCompleto: 'Beatriz Oliveira',
      cpf: '55566677788',
      telefone: '83991234567',
      canalPrincipalContato: 'WHATSAPP',
    });
    const imovel1 = await imoveisService.create({
      endereco: 'Av. Epitacio Pessoa, 100',
      bairro: 'Estados',
    });
    const imovel2 = await imoveisService.create({
      endereco: 'Rua Tambau, 250',
      bairro: 'Tambau',
    });

    const criado = await agendamentosService.create({
      titulo: 'Visita inicial',
      descricao: 'Apresentar planta padrao',
      tipo: 'VISITA',
      data: '2026-11-15',
      hora: '14:00',
      duracaoMinutos: 60,
      clienteId: cliente.id,
      imovelId: imovel1.id,
      sincronizarGoogleCalendar: true,
    });

    expect(criado.dataHora?.toISOString()).toBe('2026-11-15T17:00:00.000Z');
    expect(criado.googleCalendarEventId).toBe(`domus-evt-${criado.id}`);
    expect(criado.googleCalendarUrl).toContain('dates=20261115T170000Z%2F20261115T180000Z');
    expect(criado.googleCalendarUrl).toContain('ctz=America%2FRecife');
    expect(criado.googleCalendarUrl).toContain('Epitacio+Pessoa');

    const atualizado = await agendamentosService.update(criado.id, {
      titulo: 'Visita remarcada Tambau',
      descricao: 'Levar chaves e proposta revisada',
      data: '2026-11-16',
      hora: '16:30',
      duracaoMinutos: 90,
      imovelId: imovel2.id,
    });

    expect(atualizado.dataHora?.toISOString()).toBe('2026-11-16T19:30:00.000Z');
    expect(atualizado.googleCalendarEventId).toBe(`domus-evt-${criado.id}`);
    expect(atualizado.googleCalendarUrl).toContain('dates=20261116T193000Z%2F20261116T210000Z');
    expect(atualizado.googleCalendarUrl).toContain('ctz=America%2FRecife');
    expect(atualizado.googleCalendarUrl).toContain('Visita+remarcada+Tambau');
    expect(atualizado.googleCalendarUrl).toContain('Levar+chaves+e+proposta+revisada');
    expect(atualizado.googleCalendarUrl).toContain('Tambau');

    // Alteracao parcial apenas de hora (cruzando meia-noite UTC: 23:00 -03:00 -> 02:00 UTC do dia seguinte)
    const apenasHora = await agendamentosService.update(criado.id, {
      hora: '23:00',
    });
    expect(apenasHora.dataHora?.toISOString()).toBe('2026-11-17T02:00:00.000Z');
    expect(apenasHora.googleCalendarUrl).toContain('dates=20261117T020000Z%2F20261117T033000Z');

    // Alteracao parcial apenas de data deve preservar a hora local existente (23:00)
    const apenasData = await agendamentosService.update(criado.id, {
      data: '2026-11-18',
    });
    expect(apenasData.dataHora?.toISOString()).toBe('2026-11-19T02:00:00.000Z');

    // Data de calendario inexistente deve falhar explicitamente
    await expect(
      agendamentosService.create({
        titulo: 'Data inexistente',
        tipo: 'ATENDIMENTO',
        data: '31/02/2026',
        hora: '10:00',
        clienteId: cliente.id,
      }),
    ).rejects.toThrow(BadRequestException);

    // Remocao de data em ATENDIMENTO limpa os campos de URL/eventId do Google Calendar
    const semData = await agendamentosService.update(criado.id, {
      tipo: 'ATENDIMENTO',
      data: '',
    });
    expect(semData.dataHora).toBeNull();
    expect(semData.googleCalendarEventId).toBeNull();
    expect(semData.googleCalendarUrl).toBeNull();

    const desativado = await agendamentosService.update(criado.id, {
      sincronizarGoogleCalendar: false,
    });
    expect(desativado.sincronizarGoogleCalendar).toBe(false);
    expect(desativado.googleCalendarEventId).toBeNull();
    expect(desativado.googleCalendarUrl).toBeNull();
  });
});
