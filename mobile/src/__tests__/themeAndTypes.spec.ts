import {
  DomusApiService,
  formatarDataGoogle,
  interpretarDataHora,
} from '../services/domusApi';
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  MENSAGEM_BANNER_AVISOS,
} from '../theme/tokens';
import {
  TipoDocumento,
  CanalContato,
  TipoImovel,
  FinalidadeImovel,
  StatusImovel,
  TipoAgendamento,
  StatusAgendamento,
  TipoAviso,
  AbaDomus,
  Usuario,
  Cliente,
  Imovel,
  Agendamento,
  VisaoGeralAtendimentos,
  AvisoItem,
  ResumoAvisosProximos,
  LoginResponse,
  CreateUsuarioInput,
} from '../types/domus';

describe('DOMUS Theme Tokens', () => {
  it('deve exportar a paleta fiel aos prototipos do documento docx e a mensagem padrao de aviso', () => {
    expect(DOMUS_COLORS.headerBg).toBe('#FFE099');
    expect(DOMUS_COLORS.headerText).toBe('#1A1A1A');
    expect(DOMUS_COLORS.navBarBg).toBe('#262626');
    expect(DOMUS_COLORS.navBarText).toBe('#E5E5E5');
    expect(DOMUS_COLORS.navBarActive).toBe('#FFA347');
    expect(DOMUS_COLORS.canvasBg).toBe('#A6A6A6');
    expect(DOMUS_COLORS.surfaceInput).toBe('#D9D9D9');
    expect(DOMUS_COLORS.checkboxBg).toBe('#F5F5F5');
    expect(DOMUS_COLORS.primaryOrange).toBe('#FFA347');
    expect(DOMUS_COLORS.primaryButtonText).toBe('#111111');
    expect(DOMUS_COLORS.alertBannerBg).toBe('#B8C8E8');
    expect(DOMUS_COLORS.alertBannerText).toBe('#111111');
    expect(DOMUS_COLORS.statusDanger).toBe('#C62828');
    expect(DOMUS_COLORS.statusWarning).toBe('#EF6C00');
    expect(DOMUS_COLORS.statusSuccess).toBe('#2E7D32');
    expect(MENSAGEM_BANNER_AVISOS).toBe('Você tem agendamentos proximo do dias marcados');
  });

  it('deve exportar tokens consistentes de espacamento e borda arredondada', () => {
    expect(DOMUS_SPACING.xs).toBe(4);
    expect(DOMUS_SPACING.sm).toBe(8);
    expect(DOMUS_SPACING.md).toBe(12);
    expect(DOMUS_SPACING.lg).toBe(16);
    expect(DOMUS_SPACING.xl).toBe(20);
    expect(DOMUS_SPACING.xxl).toBe(24);

    expect(DOMUS_RADIUS.sm).toBe(4);
    expect(DOMUS_RADIUS.md).toBe(8);
    expect(DOMUS_RADIUS.lg).toBe(12);
    expect(DOMUS_RADIUS.pill).toBe(999);
  });
});

describe('DOMUS TypeScript Contracts', () => {
  it('deve permitir a instanciacao de estruturas de dados aderentes as entidades do sistema', () => {
    const usuario: Usuario = {
      id: 1,
      nome: 'Corretor Junior',
      login: 'junior',
      email: 'junior@domus.com.br',
      perfis: 'CORRETOR',
      ativo: true,
    };

    const tipoDoc: TipoDocumento = 'CPF';
    const canal: CanalContato = 'WHATSAPP';
    const tipoImovel: TipoImovel = 'APARTAMENTO';
    const finalidade: FinalidadeImovel = 'VENDA';
    const statusImovel: StatusImovel = 'DISPONIVEL';
    const tipoAgendamento: TipoAgendamento = 'VISITA';
    const statusAgendamento: StatusAgendamento = 'PENDENTE';
    const tipoAviso: TipoAviso = 'COMPROMISSO_PROXIMO';
    const aba: AbaDomus = 'Atendimentos';

    const cliente: Cliente = {
      id: 10,
      nomeCompleto: 'Carlos Eduardo Mendes',
      cpfDocumento: '123.456.789-00',
      tipoDocumento: tipoDoc,
      telefone: '(83) 99999-1111',
      canalPrincipalContato: canal,
    };

    const imovel: Imovel = {
      id: 100,
      numeroInscricao: 'JP-MAN-2026-01',
      tipoImovel,
      finalidade,
      endereco: 'Av. Gov. Flavio Ribeiro Coutinho, 500',
      bairro: 'Manaira',
      statusImovel,
      valor: 450000,
    };

    const agendamento: Agendamento = {
      id: 501,
      titulo: 'Visita Residencial Manaíra',
      tipo: tipoAgendamento,
      status: statusAgendamento,
      dataHora: '2026-10-21T10:00:00.000Z',
      duracaoMinutos: 60,
      sincronizarGoogleCalendar: false,
      clienteId: cliente.id,
      imovelId: imovel.id,
      corretorId: usuario.id,
      cliente,
      imovel,
    };

    const aviso: AvisoItem = {
      id: 1,
      tipoAviso,
      titulo: 'Compromisso próximo: Visita Residencial Manaíra',
      mensagem: `${MENSAGEM_BANNER_AVISOS} — "Visita Residencial Manaíra"`,
      status: 'PENDENTE',
      agendamentoId: agendamento.id,
      agendamento,
    };

    const visaoGeral: VisaoGeralAtendimentos = {
      totalAtendimentos: 1,
      totalPendentes: 1,
      totalSemData: 0,
      proximosCompromissos: [agendamento],
      tarefasSemData: [],
      porCliente: [
        {
          cliente,
          totalCompromissos: 1,
          pendentes: 1,
          compromissos: [agendamento],
        },
      ],
      porImovel: [
        {
          imovel,
          totalCompromissos: 1,
          pendentes: 1,
          compromissos: [agendamento],
        },
      ],
    };

    const resumoAvisos: ResumoAvisosProximos = {
      possuiAvisos: true,
      mensagemBanner: MENSAGEM_BANNER_AVISOS,
      horasAntecedencia: 48,
      totalAlertas: 1,
      totalProximos: 1,
      totalAtrasados: 0,
      totalSemData: 0,
      proximos: [aviso],
      atrasados: [],
      semData: [],
      alertas: [aviso],
    };

    const loginResponse: LoginResponse = {
      accessToken: 'jwt-real-assinado',
      usuario,
    };

    const cadastroUsuario: CreateUsuarioInput = {
      nome: 'Maria Corretora',
      login: 'maria.corretora',
      email: 'maria@domus.com.br',
      senha: 'Senha@123',
      confirmarSenha: 'Senha@123',
      perfis: ['CORRETOR'],
    };

    expect(usuario.login).toBe('junior');
    expect(cliente.nomeCompleto).toBe('Carlos Eduardo Mendes');
    expect(imovel.numeroInscricao).toBe('JP-MAN-2026-01');
    expect(agendamento.id).toBe(501);
    expect(aviso.tipoAviso).toBe('COMPROMISSO_PROXIMO');
    expect(visaoGeral.totalPendentes).toBe(1);
    expect(resumoAvisos.possuiAvisos).toBe(true);
    expect(loginResponse.accessToken).toBe('jwt-real-assinado');
    expect(cadastroUsuario.perfis).toEqual(['CORRETOR']);
    expect(aba).toBe('Atendimentos');
  });

  it('deve interpretar data/hora local (-03:00), validar calendario UTC e preservar googleCalendarUrl via API REST', async () => {
    const interpretado = interpretarDataHora('20/10/2026', '14:00');
    expect(interpretado?.toISOString()).toBe('2026-10-20T17:00:00.000Z');
    expect(formatarDataGoogle(interpretado!)).toBe('20261020T170000Z');

    const isoSemOffset = interpretarDataHora(undefined, undefined, '2026-10-20T14:00:00');
    expect(isoSemOffset?.toISOString()).toBe('2026-10-20T17:00:00.000Z');

    expect(() => interpretarDataHora('31/02/2026', '14:00')).toThrow(
      'Data ou hora fora do intervalo válido'
    );

    const urlEsperada =
      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=%5BDOMUS%5D+Visita+Fuso+Recife&dates=20261020T170000Z%2F20261020T180000Z&ctz=America%2FRecife';
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: jest.fn().mockResolvedValue({
        id: 101,
        titulo: 'Visita Fuso Recife',
        tipo: 'ATENDIMENTO',
        status: 'PENDENTE',
        dataHora: '2026-10-20T17:00:00.000Z',
        duracaoMinutos: 60,
        sincronizarGoogleCalendar: true,
        googleCalendarEventId: 'domus-evt-101',
        googleCalendarUrl: urlEsperada,
        clienteId: 1,
      }),
    }) as any;

    try {
      const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });
      const criado = await api.criarAgendamento({
        titulo: 'Visita Fuso Recife',
        tipo: 'ATENDIMENTO',
        clienteId: 1,
        data: '20/10/2026',
        hora: '14:00',
        duracaoMinutos: 60,
        sincronizarGoogleCalendar: true,
      });

      expect(criado.dataHora).toBe('2026-10-20T17:00:00.000Z');
      expect(criado.googleCalendarUrl).toContain('dates=20261020T170000Z%2F20261020T180000Z');
      expect(criado.googleCalendarUrl).toContain('ctz=America%2FRecife');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
