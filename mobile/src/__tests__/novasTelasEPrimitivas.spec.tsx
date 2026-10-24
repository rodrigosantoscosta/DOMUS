import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { DOMUS_THEME, DOMUS_SHADOWS, MENSAGEM_BANNER_AVISOS } from '../theme/tokens';
import { AvisoBanner } from '../components/AvisoBanner';
import { ImoveisScreen } from '../screens/ImoveisScreen';
import { AgendarScreen } from '../screens/AgendarScreen';
import { AtendimentosScreen } from '../screens/AtendimentosScreen';
import { DomusAppContent } from '../../App';
import { DomusProvider, DomusContextData } from '../context/DomusContext';
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

function coletarTextos(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node).trim()];
  }
  if (Array.isArray(node)) {
    return node.flatMap(coletarTextos);
  }
  if (node.children) {
    return node.children.flatMap(coletarTextos);
  }
  return [];
}

function criarMockContextCompleto(overrides: Partial<DomusContextData> = {}): DomusContextData {
  const clienteMock: Cliente = {
    id: 1,
    nomeCompleto: 'Carlos Eduardo Mendes',
    cpfDocumento: '111.222.333-44',
    tipoDocumento: 'CPF',
    telefone: '(83) 99881-2233',
    canalPrincipalContato: 'WHATSAPP',
  };

  const imovelMock: Imovel = {
    id: 1,
    numeroInscricao: 'JP-MAN-2026-01',
    tipoImovel: 'APARTAMENTO',
    finalidade: 'VENDA',
    endereco: 'Av. Flavio Ribeiro Coutinho, 500',
    bairro: 'Manaira',
    valor: 750000,
    statusImovel: 'DISPONIVEL',
  };

  const agendamentoMock: Agendamento = {
    id: 101,
    titulo: 'Visita Residencial Manaíra',
    tipo: 'VISITA',
    status: 'PENDENTE',
    dataHora: '2026-10-25T10:00:00.000Z',
    duracaoMinutos: 60,
    sincronizarGoogleCalendar: false,
    clienteId: 1,
    imovelId: 1,
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
    abaAtiva: 'Clientes',
    setAbaAtiva: jest.fn(),
    clientes: [clienteMock],
    imoveis: [imovelMock],
    agendamentos: [agendamentoMock],
    visaoGeral: null,
    avisos: {
      possuiAvisos: true,
      mensagemBanner: MENSAGEM_BANNER_AVISOS,
      horasAntecedencia: 48,
      totalAlertas: 1,
      totalProximos: 1,
      totalAtrasados: 0,
      totalSemData: 0,
      proximos: [],
      atrasados: [],
      semData: [],
      alertas: [],
    },
    bannerVisivel: true,
    fecharBanner: jest.fn(),
    modoOffline: true,
    carregando: false,
    erro: null,
    login: jest.fn(),
    logout: jest.fn(),
    recarregarDados: jest.fn().mockResolvedValue(undefined),
    resetarDemo: jest.fn().mockResolvedValue(undefined),
    criarCliente: jest.fn().mockResolvedValue(clienteMock),
    criarImovel: jest.fn().mockResolvedValue(imovelMock),
    criarAgendamento: jest.fn().mockResolvedValue(agendamentoMock),
    programarRetorno: jest.fn().mockResolvedValue(agendamentoMock),
    concluirAgendamento: jest.fn().mockResolvedValue(agendamentoMock),
    sincronizarGoogleCalendar: jest.fn().mockResolvedValue({ googleCalendarUrl: 'https://calendar.google.com' }),
    cadastrarUsuario: jest.fn(),
    configurarModo: jest.fn(),
    mostrarToast: jest.fn(),
    fecharToast: jest.fn(),
    ...overrides,
  };
}

describe('Design System DOMUS_THEME & DOMUS_SHADOWS', () => {
  it('deve exportar tokens modernos iOS HIG com fundo #F2F2F7 e cor primaria #EA580C', () => {
    expect(DOMUS_THEME.background).toBe('#F2F2F7');
    expect(DOMUS_THEME.surface).toBe('#FFFFFF');
    expect(DOMUS_THEME.primary).toBe('#EA580C');
    expect(DOMUS_THEME.textPrimary).toBe('#0F172A');
    expect(DOMUS_THEME.border).toBe('#E2E8F0');
    expect(DOMUS_SHADOWS.sm).toBeDefined();
    expect(DOMUS_SHADOWS.md).toBeDefined();
    expect(DOMUS_SHADOWS.lg).toBeDefined();
  });
});

describe('AvisoBanner Component', () => {
  it('renderiza o aviso com pills de contadores e botao de fechar compativel com HIG 44pt', () => {
    const onFechar = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <AvisoBanner
          visivel={true}
          mensagem={MENSAGEM_BANNER_AVISOS}
          totalProximos={3}
          totalAtrasados={1}
          totalSemData={2}
          onFechar={onFechar}
        />
      );
    });

    const textos = coletarTextos(root.toJSON());
    expect(textos.join(' ')).toContain(MENSAGEM_BANNER_AVISOS);
    expect(textos.join(' ')).toContain('3 Próximos');
    expect(textos.join(' ')).toContain('1 Atrasado');
    expect(textos.join(' ')).toContain('2 Sem data');

    const btnFechar = root.root.findByProps({ testID: 'btn-fechar-aviso' });
    expect(btnFechar).toBeDefined();
    const styleFechar = StyleSheet.flatten(btnFechar.props.style);
    expect(styleFechar.minHeight).toBeGreaterThanOrEqual(44);
    expect(styleFechar.minWidth).toBeGreaterThanOrEqual(44);

    act(() => {
      btnFechar.props.onPress();
    });
    expect(onFechar).toHaveBeenCalledTimes(1);
  });
});

describe('ImoveisScreen (Aba Imoveis - Vazia por enquanto)', () => {
  it('renderiza container vazio com testID "imoveis-screen"', () => {
    let root: any;

    act(() => {
      root = renderer.create(<ImoveisScreen />);
    });

    const screen = root.root.findByProps({ testID: 'imoveis-screen' });
    expect(screen).toBeDefined();
    const styleScreen = StyleSheet.flatten(screen.props.style);
    expect(styleScreen.flex).toBe(1);
    expect(styleScreen.backgroundColor).toBe(DOMUS_THEME.background);
  });
});

describe('AgendarScreen (Aba Agendar - Vazia por enquanto)', () => {
  it('renderiza container vazio com testID "agendar-screen"', () => {
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen />);
    });

    const screen = root.root.findByProps({ testID: 'agendar-screen' });
    expect(screen).toBeDefined();
    const styleScreen = StyleSheet.flatten(screen.props.style);
    expect(styleScreen.flex).toBe(1);
    expect(styleScreen.backgroundColor).toBe(DOMUS_THEME.background);
  });
});

describe('AtendimentosScreen (Aba Atendimentos - Vazia por enquanto)', () => {
  it('renderiza container vazio com testID "atendimentos-screen"', () => {
    let root: any;

    act(() => {
      root = renderer.create(<AtendimentosScreen />);
    });

    const screen = root.root.findByProps({ testID: 'atendimentos-screen' });
    expect(screen).toBeDefined();
    const styleScreen = StyleSheet.flatten(screen.props.style);
    expect(styleScreen.flex).toBe(1);
    expect(styleScreen.backgroundColor).toBe(DOMUS_THEME.background);
  });
});

describe('DomusAppContent Layout Principal', () => {
  it('renderiza DomusHeader no topo, conteudo dinâmico no centro e DomusNavBar na base', () => {
    let root: any;

    act(() => {
      root = renderer.create(
        <DomusProvider autoLoginDemo={false}>
          <DomusAppContent />
        </DomusProvider>
      );
    });

    expect(root).toBeDefined();
    const header = root.root.findByProps({ testID: 'domus-header' });
    const navbar = root.root.findByProps({ testID: 'domus-navbar' });
    const container = root.root.findByProps({ testID: 'app-main-container' });

    expect(header).toBeDefined();
    expect(navbar).toBeDefined();
    expect(container).toBeDefined();

    // Permite navegar para a aba Imoveis pela barra inferior
    const tabImoveis = root.root.findByProps({ testID: 'tab-btn-Imoveis' });
    expect(tabImoveis).toBeDefined();

    act(() => {
      tabImoveis.props.onPress();
    });

    // Permite navegar para a aba Agendar
    const tabAgendar = root.root.findByProps({ testID: 'tab-btn-Agendar' });
    expect(tabAgendar).toBeDefined();

    act(() => {
      tabAgendar.props.onPress();
    });

    // Permite navegar para a aba Atendimentos
    const tabAtendimentos = root.root.findByProps({ testID: 'tab-btn-Atendimentos' });
    expect(tabAtendimentos).toBeDefined();

    act(() => {
      tabAtendimentos.props.onPress();
    });

    act(() => {
      root.unmount();
    });
  });
});
