import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ImoveisScreen } from '../screens/ImoveisScreen';
import { AtendimentosScreen } from '../screens/AtendimentosScreen';
import { DomusContextData } from '../context/DomusContext';
import { Cliente, Imovel, Agendamento, Usuario } from '../types/domus';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('react-test-renderer is deprecated') ||
        args[0].includes('not configured to support act') ||
        args[0].includes('was not wrapped in act'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

function criarContextoMock(overrides: Partial<DomusContextData> = {}): DomusContextData {
  const clienteMock: Cliente = {
    id: 1,
    nomeCompleto: 'Carlos Eduardo Mendes',
    cpfDocumento: '111.222.333-44',
    tipoDocumento: 'CPF',
    telefone: '(83) 99881-2233',
    canalPrincipalContato: 'WHATSAPP',
  };

  const imovelMock: Imovel = {
    id: 10,
    numeroInscricao: 'JP-MAN-2026-01',
    tipoImovel: 'APARTAMENTO',
    finalidade: 'VENDA',
    endereco: 'Av. Flavio Ribeiro Coutinho, 500',
    bairro: 'Manaira',
    valor: 750000,
    statusImovel: 'DISPONIVEL',
    areaTotal: 85.5,
    comodos: 3,
    banheiros: 2,
    proprietarioId: 1,
    proprietario: clienteMock,
  };

  const agendamentoMock: Agendamento = {
    id: 101,
    titulo: 'Visita Residencial Manaira',
    tipo: 'VISITA',
    status: 'PENDENTE',
    dataHora: '2026-10-25T10:00:00.000Z',
    duracaoMinutos: 60,
    sincronizarGoogleCalendar: false,
    clienteId: 1,
    imovelId: 10,
    cliente: clienteMock,
    imovel: imovelMock,
  };

  const usuarioMock: Usuario = {
    id: 1,
    nome: 'Junior Corretor',
    login: 'junior.corretor',
    email: 'junior@domus.com.br',
    perfis: ['CORRETOR'],
    ativo: true,
  };

  return {
    usuario: usuarioMock,
    abaAtiva: 'Imoveis',
    setAbaAtiva: jest.fn(),
    clientes: [clienteMock],
    imoveis: [imovelMock],
    agendamentos: [agendamentoMock],
    visaoGeral: null,
    avisos: {
      possuiAvisos: false,
      mensagemBanner: null,
      horasAntecedencia: 48,
      totalAlertas: 0,
      totalProximos: 0,
      totalAtrasados: 0,
      totalSemData: 0,
      proximos: [],
      atrasados: [],
      semData: [],
      alertas: [],
    },
    bannerVisivel: false,
    fecharBanner: jest.fn(),
    modoOffline: false,
    carregando: false,
    erro: null,
    login: jest.fn(),
    logout: jest.fn(),
    recarregarDados: jest.fn().mockResolvedValue(undefined),
    resetarDemo: jest.fn().mockResolvedValue(undefined),
    criarCliente: jest.fn(),
    criarImovel: jest.fn().mockResolvedValue(imovelMock),
    criarAgendamento: jest.fn(),
    concluirAgendamento: jest.fn().mockResolvedValue({ ...agendamentoMock, status: 'CONCLUIDO' }),
    programarRetorno: jest.fn().mockResolvedValue(agendamentoMock),
    sincronizarGoogleCalendar: jest.fn().mockResolvedValue({ sincronizado: true }),
    cadastrarUsuario: jest.fn(),
    configurarModo: jest.fn(),
    mostrarToast: jest.fn(),
    fecharToast: jest.fn(),
    ...overrides,
  };
}

describe('ImoveisScreen - Integracao e Fluxos Funcionais', () => {
  it('renderiza o formulario e a lista de imoveis cadastrados', () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<ImoveisScreen context={mockCtx} />);
    });

    const titulo = root.root.findByProps({ testID: 'titulo-cadastro-imovel' });
    expect(titulo).toBeDefined();

    const inputEndereco = root.root.findByProps({ testID: 'input-imovel-endereco' });
    expect(inputEndereco).toBeDefined();

    const cardImovel = root.root.findByProps({ testID: 'card-imovel-10' });
    expect(cardImovel).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('exibe alerta de erro ao submeter formulario sem endereco', async () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<ImoveisScreen context={mockCtx} />);
    });

    const btnCadastrar = root.root.findByProps({ testID: 'btn-cadastrar-imovel' });
    await act(async () => {
      btnCadastrar.props.onPress();
    });

    const errorBox = root.root.findByProps({ testID: 'imovel-error-box' });
    expect(errorBox).toBeDefined();
    expect(mockCtx.criarImovel).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('cadastra imovel com sucesso e chama criarImovel com dados parseados', async () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<ImoveisScreen context={mockCtx} />);
    });

    const inputEndereco = root.root.findByProps({ testID: 'input-imovel-endereco' });
    const inputArea = root.root.findByProps({ testID: 'input-imovel-area' });
    const inputValor = root.root.findByProps({ testID: 'input-imovel-valor' });

    act(() => {
      inputEndereco.props.onChangeText('Rua das Acácias, 100');
      inputArea.props.onChangeText('120.5');
      inputValor.props.onChangeText('50000000');
    });

    const btnCadastrar = root.root.findByProps({ testID: 'btn-cadastrar-imovel' });
    await act(async () => {
      btnCadastrar.props.onPress();
    });

    expect(mockCtx.criarImovel).toHaveBeenCalledWith(
      expect.objectContaining({
        endereco: 'Rua das Acácias, 100',
        areaTotal: 120.5,
        valor: 500000,
        tipoImovel: 'CASA',
        finalidade: 'VENDA',
        statusImovel: 'DISPONIVEL',
      })
    );

    act(() => {
      root.unmount();
    });
  });

  it('aciona callback onAgendarImovel ao clicar no atalho do card', () => {
    const mockCtx = criarContextoMock();
    const onAgendarMock = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <ImoveisScreen context={mockCtx} onAgendarImovel={onAgendarMock} />
      );
    });

    const btnAgendar = root.root.findByProps({ testID: 'btn-agendar-imovel-10' });
    act(() => {
      btnAgendar.props.onPress();
    });

    expect(onAgendarMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, tipoImovel: 'APARTAMENTO' })
    );

    act(() => {
      root.unmount();
    });
  });
});

describe('AtendimentosScreen - Integracao e Fluxos Funcionais', () => {
  it('renderiza metricas, cards de atendimento e filtros segmentados', () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AtendimentosScreen context={mockCtx} />);
    });

    const cardAtendimento = root.root.findByProps({ testID: 'card-atendimento-101' });
    expect(cardAtendimento).toBeDefined();

    const filtroTodos = root.root.findByProps({ testID: 'filtro-todos' });
    const filtroCliente = root.root.findByProps({ testID: 'filtro-por-cliente' });
    const filtroImovel = root.root.findByProps({ testID: 'filtro-por-imovel' });
    const filtroSemData = root.root.findByProps({ testID: 'filtro-sem-data' });

    expect(filtroTodos).toBeDefined();
    expect(filtroCliente).toBeDefined();
    expect(filtroImovel).toBeDefined();
    expect(filtroSemData).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('permite abrir o modal de detalhes e acionar programar retorno', async () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AtendimentosScreen context={mockCtx} />);
    });

    const btnVisualizar = root.root.findByProps({
      testID: 'btn-visualizar-atendimento-101',
    });
    act(() => {
      btnVisualizar.props.onPress();
    });

    const btnModoRetorno = root.root.findByProps({ testID: 'btn-abrir-modo-retorno' });
    act(() => {
      btnModoRetorno.props.onPress();
    });

    const inputData = root.root.findByProps({ testID: 'input-retorno-data' });
    const inputHora = root.root.findByProps({ testID: 'input-retorno-hora' });
    const inputAcao = root.root.findByProps({ testID: 'input-retorno-proxima-acao' });

    act(() => {
      inputData.props.onChangeText('2026-11-10');
      inputHora.props.onChangeText('14:30');
      inputAcao.props.onChangeText('Apresentar minuta do contrato');
    });

    const btnSalvar = root.root.findByProps({ testID: 'btn-salvar-retorno' });
    await act(async () => {
      btnSalvar.props.onPress();
    });

    expect(mockCtx.programarRetorno).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        data: '2026-11-10',
        hora: '14:30',
        proximaAcao: 'Apresentar minuta do contrato',
      })
    );

    act(() => {
      root.unmount();
    });
  });

  it('permite concluir atendimento chamando concluirAgendamento', async () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AtendimentosScreen context={mockCtx} />);
    });

    const btnVisualizar = root.root.findByProps({
      testID: 'btn-visualizar-atendimento-101',
    });
    act(() => {
      btnVisualizar.props.onPress();
    });

    const btnModoConcluir = root.root.findByProps({ testID: 'btn-abrir-modo-concluir' });
    act(() => {
      btnModoConcluir.props.onPress();
    });

    const inputObs = root.root.findByProps({ testID: 'input-conclusao-obs' });
    act(() => {
      inputObs.props.onChangeText('Visita produtiva, proposta enviada');
    });

    const btnConfirmar = root.root.findByProps({ testID: 'btn-concluir-atendimento' });
    await act(async () => {
      btnConfirmar.props.onPress();
    });

    expect(mockCtx.concluirAgendamento).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        observacaoConclusao: 'Visita produtiva, proposta enviada',
      })
    );

    act(() => {
      root.unmount();
    });
  });

  it('permite sincronizar com google calendar chamando sincronizarGoogleCalendar', async () => {
    const mockCtx = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AtendimentosScreen context={mockCtx} />);
    });

    const btnVisualizar = root.root.findByProps({
      testID: 'btn-visualizar-atendimento-101',
    });
    act(() => {
      btnVisualizar.props.onPress();
    });

    const btnSync = root.root.findByProps({ testID: 'btn-sync-google' });
    await act(async () => {
      btnSync.props.onPress();
    });

    expect(mockCtx.sincronizarGoogleCalendar).toHaveBeenCalledWith(101);

    act(() => {
      root.unmount();
    });
  });
});
