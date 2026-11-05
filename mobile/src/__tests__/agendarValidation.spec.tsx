import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AgendarScreen } from '../screens/AgendarScreen';
import { DomusContextData } from '../context/DomusContext';
import { Cliente, Imovel, Agendamento, Usuario } from '../types/domus';
import {
  formatarDataBr,
  formatarHora,
  validarDataBr,
  validarHora,
} from '../utils/formatters';

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
  const imovelMock: Imovel = {
    id: 10,
    numeroInscricao: 'JP-MAN-2026-01',
    tipoImovel: 'APARTAMENTO',
    finalidade: 'VENDA',
    endereco: 'Av. Flavio Ribeiro Coutinho, 500',
    bairro: 'Manaira',
    valor: 750000,
    statusImovel: 'DISPONIVEL',
  };

  const clienteMock: Cliente = {
    id: 1,
    nomeCompleto: 'Carlos Eduardo Mendes',
    cpfDocumento: '111.222.333-44',
    tipoDocumento: 'CPF',
    telefone: '(83) 99881-2233',
    celular: '(83) 99881-2233',
    email: 'carlos.mendes@email.com',
    canalPrincipalContato: 'WHATSAPP',
    observacoes: 'Interesse em apto em Manaira',
    imoveisInteresse: [imovelMock],
  };

  const usuarioMock: Usuario = {
    id: 1,
    nome: 'Junior Corretor',
    login: 'junior.corretor',
    email: 'junior@domus.com.br',
    perfis: ['CORRETOR'],
    ativo: true,
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

  return {
    usuario: usuarioMock,
    abaAtiva: 'Agendar',
    setAbaAtiva: jest.fn(),
    clientes: [clienteMock],
    imoveis: [imovelMock],
    agendamentos: [agendamentoMock],
    visaoGeral: null,
    avisos: null,
    bannerVisivel: false,
    fecharBanner: jest.fn(),
    modoOffline: true,
    carregando: false,
    erro: null,
    login: jest.fn().mockResolvedValue({
      accessToken: 'token-mock',
      usuario: usuarioMock,
      modoOffline: true,
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    recarregarDados: jest.fn().mockResolvedValue(undefined),
    resetarDemo: jest.fn().mockResolvedValue(undefined),
    criarCliente: jest.fn(),
    criarImovel: jest.fn(),
    criarAgendamento: jest.fn().mockResolvedValue(agendamentoMock),
    programarRetorno: jest.fn(),
    concluirAgendamento: jest.fn(),
    sincronizarGoogleCalendar: jest.fn(),
    cadastrarUsuario: jest.fn(),
    configurarModo: jest.fn(),
    toast: null,
    mostrarToast: jest.fn(),
    fecharToast: jest.fn(),
    ...overrides,
  };
}

describe('Validadores e Mascaras de Data e Hora', () => {
  it('formatarDataBr aplica mascara DD/MM/AAAA conforme digitacao', () => {
    expect(formatarDataBr('')).toBe('');
    expect(formatarDataBr('25')).toBe('25');
    expect(formatarDataBr('2510')).toBe('25/10');
    expect(formatarDataBr('25102026')).toBe('25/10/2026');
    expect(formatarDataBr('25/10/2026')).toBe('25/10/2026');
  });

  it('formatarHora aplica mascara HH:MM conforme digitacao', () => {
    expect(formatarHora('')).toBe('');
    expect(formatarHora('14')).toBe('14');
    expect(formatarHora('1430')).toBe('14:30');
    expect(formatarHora('14:30')).toBe('14:30');
  });

  it('validarDataBr valida dias do mes e anos compativeis', () => {
    expect(validarDataBr('25/10/2026')).toBe(true);
    expect(validarDataBr('29/02/2024')).toBe(true);
    expect(validarDataBr('29/02/2025')).toBe(false);
    expect(validarDataBr('31/04/2026')).toBe(false);
    expect(validarDataBr('99/99/2026')).toBe(false);
    expect(validarDataBr('')).toBe(false);
  });

  it('validarHora valida limites de 00:00 a 23:59', () => {
    expect(validarHora('00:00')).toBe(true);
    expect(validarHora('14:30')).toBe(true);
    expect(validarHora('23:59')).toBe(true);
    expect(validarHora('24:00')).toBe(false);
    expect(validarHora('12:60')).toBe(false);
    expect(validarHora('')).toBe(false);
  });
});

describe('AgendarScreen - Validacao de Formato e Guarda de Reentrancia', () => {
  it('bloqueia submissao e exibe erro quando a data for invalida', async () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen
          context={mockContext}
          clientePreSelecionadoId={1}
          imovelPreSelecionadoId={10}
        />
      );
    });

    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });

    act(() => {
      inputTitulo.props.onChangeText('Visita Invalida');
      inputData.props.onChangeText('99/99/2026');
      inputHora.props.onChangeText('14:00');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    expect(mockContext.criarAgendamento).not.toHaveBeenCalled();
    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      expect.stringContaining('Data informada'),
      'erro'
    );
  });

  it('bloqueia submissao e exibe erro quando a hora for invalida', async () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen
          context={mockContext}
          clientePreSelecionadoId={1}
          imovelPreSelecionadoId={10}
        />
      );
    });

    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });

    act(() => {
      inputTitulo.props.onChangeText('Visita Invalida');
      inputData.props.onChangeText('25/10/2026');
      inputHora.props.onChangeText('25:00');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    expect(mockContext.criarAgendamento).not.toHaveBeenCalled();
    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      expect.stringContaining('Hora informada'),
      'erro'
    );
  });

  it('aplica guarda de reentrancia contra cliques concorrentes / rapidos', async () => {
    let resolverPromise: any;
    const promisePendente = new Promise((resolve) => {
      resolverPromise = resolve;
    });

    const mockContext = criarContextoMock({
      criarAgendamento: jest.fn().mockImplementation(() => promisePendente),
    });

    let root: any;
    act(() => {
      root = renderer.create(
        <AgendarScreen
          context={mockContext}
          clientePreSelecionadoId={1}
          imovelPreSelecionadoId={10}
        />
      );
    });

    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });

    act(() => {
      inputTitulo.props.onChangeText('Visita Concorrente');
      inputData.props.onChangeText('25/10/2026');
      inputHora.props.onChangeText('14:00');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });

    let p1: any;
    act(() => {
      p1 = btnSubmit.props.onPress();
    });

    // Segundo clique enquanto a primeira chamada ainda esta em andamento
    act(() => {
      btnSubmit.props.onPress();
    });

    await act(async () => {
      resolverPromise({ id: 999, titulo: 'Visita Concorrente' });
      await p1;
    });

    // Confirma que foi chamado apenas 1 vez (o segundo foi bloqueado pela guarda)
    expect(mockContext.criarAgendamento).toHaveBeenCalledTimes(1);
  });
});
