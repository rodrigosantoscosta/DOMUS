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
  DomusLocalState,
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

    const estadoLocal: DomusLocalState = {
      usuarios: [usuario],
      clientes: [cliente],
      imoveis: [imovel],
      agendamentos: [agendamento],
      avisos: [aviso],
      usuarioLogadoId: usuario.id,
      modoOfflineForcado: true,
      apiBaseUrl: 'http://localhost:3000/api',
    };

    expect(usuario.login).toBe('junior');
    expect(cliente.nomeCompleto).toBe('Carlos Eduardo Mendes');
    expect(imovel.numeroInscricao).toBe('JP-MAN-2026-01');
    expect(agendamento.id).toBe(501);
    expect(aviso.tipoAviso).toBe('COMPROMISSO_PROXIMO');
    expect(visaoGeral.totalPendentes).toBe(1);
    expect(resumoAvisos.possuiAvisos).toBe(true);
    expect(estadoLocal.modoOfflineForcado).toBe(true);
    expect(aba).toBe('Atendimentos');
  });
});
