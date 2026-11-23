import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { LoginScreen } from '../screens/LoginScreen';
import { DomusContextData } from '../context/DomusContext';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const SILENCED_ACT_WARNINGS = [
  'react-test-renderer is deprecated',
  'not configured to support act',
  'was not wrapped in act',
];

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  const nativeError = console.error.bind(console);
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && SILENCED_ACT_WARNINGS.some((w) => firstArg.includes(w))) {
      return;
    }
    nativeError(...args);
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

function coletarTextos(elemento: any): string[] {
  const lista: string[] = [];
  const visitar = (atual: any) => {
    if (atual === null || atual === undefined) return;
    if (typeof atual === 'string' || typeof atual === 'number') {
      lista.push(String(atual).trim());
      return;
    }
    const itens = Array.isArray(atual) ? atual : atual.children;
    if (Array.isArray(itens)) {
      itens.forEach(visitar);
    }
  };
  visitar(elemento);
  return lista;
}

async function preencherESubmeterLogin(
  root: any,
  identificador: string,
  senha: string
): Promise<void> {
  const campoId = root.root.findByProps({ testID: 'input-login-identificador' });
  const campoSenha = root.root.findByProps({ testID: 'input-login-senha' });
  const botaoEntrar = root.root.findByProps({ testID: 'btn-fazer-login' });

  act(() => {
    campoId.props.onChangeText(identificador);
    campoSenha.props.onChangeText(senha);
  });

  await act(async () => {
    await botaoEntrar.props.onPress();
  });
}

function criarContextoAuthMock(
  overrides: Partial<DomusContextData> = {}
): DomusContextData {
  return {
    usuario: null,
    abaAtiva: 'Clientes',
    setAbaAtiva: jest.fn(),
    clientes: [],
    imoveis: [],
    agendamentos: [],
    visaoGeral: null,
    avisos: null,
    bannerVisivel: false,
    fecharBanner: jest.fn(),
    apiOnline: true,
    inicializando: false,
    carregando: false,
    erro: null,
    login: jest.fn().mockResolvedValue({
      accessToken: 'jwt-real',
      usuario: {
        id: 1,
        nome: 'Corretor Real',
        login: 'corretor.real',
        email: 'corretor@domus.com.br',
        perfis: ['CORRETOR'],
        ativo: true,
      },
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    recarregarDados: jest.fn().mockResolvedValue(undefined),
    criarCliente: jest.fn(),
    criarImovel: jest.fn(),
    criarAgendamento: jest.fn(),
    programarRetorno: jest.fn(),
    concluirAgendamento: jest.fn(),
    sincronizarGoogleCalendar: jest.fn(),
    cadastrarUsuario: jest.fn().mockResolvedValue({
      id: 2,
      nome: 'Nova Corretora',
      login: 'nova.corretora',
      email: 'nova@domus.com.br',
      perfis: ['CORRETOR'],
      ativo: true,
    }),
    configurarApiUrl: jest.fn().mockResolvedValue(undefined),
    toast: null,
    mostrarToast: jest.fn(),
    fecharToast: jest.fn(),
    ...overrides,
  };
}

describe('LoginScreen (Autenticacao Real sem Modo Demo)', () => {
  it('renderiza marca DOMUS e formulario limpo sem badges de status de API ou botoes de modo demo', () => {
    const mockCtx = criarContextoAuthMock({ apiOnline: false });
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('DOMUS');
    expect(textos).not.toContain('API Offline');
    expect(textos).not.toContain('API Online');
    expect(textos).not.toContain('Modo Demo');
    expect(textos).not.toContain('Demo');
    expect(root.root.findByProps({ testID: 'login-logo' })).toBeDefined();
    expect(root.root.findAllByProps({ testID: 'login-status-badge' })).toHaveLength(0);

    act(() => {
      root.unmount();
    });
  });

  it('valida campos vazios antes de chamar domus.login', async () => {
    const mockCtx = criarContextoAuthMock();
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    const btnLogin = root.root.findByProps({ testID: 'btn-fazer-login' });
    await act(async () => {
      await btnLogin.props.onPress();
    });

    expect(mockCtx.login).not.toHaveBeenCalled();
    const errorBox = root.root.findByProps({ testID: 'login-error-box' });
    expect(coletarTextos(errorBox).join(' ')).toContain('Informe seu usuário ou e-mail');

    const inputId = root.root.findByProps({ testID: 'input-login-identificador' });
    act(() => {
      inputId.props.onChangeText('corretor.real');
    });

    await act(async () => {
      await btnLogin.props.onPress();
    });

    expect(mockCtx.login).not.toHaveBeenCalled();
    const errorBoxSenha = root.root.findByProps({ testID: 'login-error-box' });
    expect(coletarTextos(errorBoxSenha).join(' ')).toContain('Informe sua senha');

    act(() => {
      root.unmount();
    });
  });

  it('executa login real com usuario e senha informados', async () => {
    const mockCtx = criarContextoAuthMock();
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    await preencherESubmeterLogin(root, '  corretor.real  ', 'Senha@123');

    expect(mockCtx.login).toHaveBeenCalledWith({
      loginOuEmail: 'corretor.real',
      senha: 'Senha@123',
    });

    act(() => {
      root.unmount();
    });
  });

  it('exibe erro inline na falha de login sem expor botoes de configuracao de servidor', async () => {
    const mockCtx = criarContextoAuthMock({
      apiOnline: false,
      login: jest.fn().mockRejectedValue(new Error('Servidor indisponível')),
    });
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    await preencherESubmeterLogin(root, 'corretor.real', 'Senha@123');

    const errorBox = root.root.findByProps({ testID: 'login-error-box' });
    expect(coletarTextos(errorBox).join(' ')).toContain('Servidor indisponível');
    expect(root.root.findAllByProps({ testID: 'btn-login-configurar-api' })).toHaveLength(0);

    act(() => {
      root.unmount();
    });
  });

  it('alterna visibilidade da senha no campo de login', () => {
    const mockCtx = criarContextoAuthMock({ apiOnline: true });
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    let inputSenha = root.root.findByProps({ testID: 'input-login-senha' });
    expect(inputSenha.props.secureTextEntry).toBe(true);

    const btnToggle = root.root.findByProps({ testID: 'btn-toggle-senha' });
    act(() => {
      btnToggle.props.onPress();
    });

    inputSenha = root.root.findByProps({ testID: 'input-login-senha' });
    expect(inputSenha.props.secureTextEntry).toBe(false);

    act(() => {
      root.unmount();
    });
  });

  it('permite alternar para aba Criar Conta, valida confirmacao e cadastra usuario CORRETOR com auto-login', async () => {
    const mockCtx = criarContextoAuthMock();
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    const tabCadastro = root.root.findByProps({ testID: 'login-tab-cadastro' });
    act(() => {
      tabCadastro.props.onPress();
    });

    const inputNome = root.root.findByProps({ testID: 'input-cadastro-nome' });
    const inputLogin = root.root.findByProps({ testID: 'input-cadastro-login' });
    const inputEmail = root.root.findByProps({ testID: 'input-cadastro-email' });
    const inputCpf = root.root.findByProps({ testID: 'input-cadastro-cpf' });
    const inputSenha = root.root.findByProps({ testID: 'input-cadastro-senha' });
    const inputConfirmar = root.root.findByProps({
      testID: 'input-cadastro-confirmar-senha',
    });
    const btnCriar = root.root.findByProps({ testID: 'btn-criar-conta' });

    // Senhas divergentes devem ser bloqueadas
    act(() => {
      inputNome.props.onChangeText('Nova Corretora');
      inputLogin.props.onChangeText('Nova.Corretora');
      inputEmail.props.onChangeText('nova@domus.com.br');
      inputCpf.props.onChangeText('12345678901');
      inputSenha.props.onChangeText('Senha@123');
      inputConfirmar.props.onChangeText('SenhaDiferente');
    });

    await act(async () => {
      await btnCriar.props.onPress();
    });

    expect(mockCtx.cadastrarUsuario).not.toHaveBeenCalled();
    expect(
      coletarTextos(root.root.findByProps({ testID: 'login-error-box' })).join(' ')
    ).toContain('confirmação da senha não confere');

    // Corrige confirmacao e envia
    act(() => {
      inputConfirmar.props.onChangeText('Senha@123');
    });

    await act(async () => {
      await btnCriar.props.onPress();
    });

    expect(mockCtx.cadastrarUsuario).toHaveBeenCalledWith({
      nome: 'Nova Corretora',
      login: 'nova.corretora',
      email: 'nova@domus.com.br',
      cpf: '12345678901',
      senha: 'Senha@123',
      confirmarSenha: 'Senha@123',
      perfis: ['CORRETOR'],
    });
    expect(mockCtx.login).toHaveBeenCalledWith({
      loginOuEmail: 'nova.corretora',
      senha: 'Senha@123',
    });

    act(() => {
      root.unmount();
    });
  });

  it('redireciona para aba Entrar com login preenchido se o auto-login falhar apos cadastro bem-sucedido', async () => {
    const mockCtx = criarContextoAuthMock({
      login: jest.fn().mockRejectedValue(new Error('Oscilação de rede')),
    });
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    act(() => {
      root.root.findByProps({ testID: 'login-tab-cadastro' }).props.onPress();
    });

    act(() => {
      root.root.findByProps({ testID: 'input-cadastro-nome' }).props.onChangeText('Pedro');
      root.root.findByProps({ testID: 'input-cadastro-login' }).props.onChangeText('pedro.corretor');
      root.root.findByProps({ testID: 'input-cadastro-email' }).props.onChangeText('pedro@domus.com.br');
      root.root.findByProps({ testID: 'input-cadastro-senha' }).props.onChangeText('Senha@123');
      root.root.findByProps({ testID: 'input-cadastro-confirmar-senha' }).props.onChangeText('Senha@123');
    });

    await act(async () => {
      await root.root.findByProps({ testID: 'btn-criar-conta' }).props.onPress();
    });

    expect(mockCtx.cadastrarUsuario).toHaveBeenCalledTimes(1);
    const inputLogin = root.root.findByProps({ testID: 'input-login-identificador' });
    expect(inputLogin.props.value).toBe('pedro.corretor');
    const errorBox = root.root.findByProps({ testID: 'login-error-box' });
    expect(coletarTextos(errorBox).join(' ')).toContain('Oscilação de rede');

    act(() => {
      root.unmount();
    });
  });

  it('assegura touch targets minimos de 44pt nos elementos interativos da LoginScreen (Apple HIG)', () => {
    const mockCtx = criarContextoAuthMock({ apiOnline: false });
    let root: any;

    act(() => {
      root = renderer.create(<LoginScreen context={mockCtx} />);
    });

    const tabEntrar = root.root.findByProps({ testID: 'login-tab-entrar' });
    const tabCadastro = root.root.findByProps({ testID: 'login-tab-cadastro' });
    const btnToggle = root.root.findByProps({ testID: 'btn-toggle-senha' });
    const btnLogin = root.root.findByProps({ testID: 'btn-fazer-login' });
    const btnLoginPressable = btnLogin.findByType('Pressable');

    expect(StyleSheet.flatten(tabEntrar.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(tabCadastro.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(btnToggle.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(btnToggle.props.style).minWidth).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(btnLoginPressable.props.style).minHeight).toBeGreaterThanOrEqual(44);

    act(() => {
      root.unmount();
    });
  });
});
