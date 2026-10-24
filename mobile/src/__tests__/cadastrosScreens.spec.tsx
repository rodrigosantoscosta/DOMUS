import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ClientesScreen } from '../screens/ClientesScreen';
import { DomusContextData } from '../context/DomusContext';
import { Cliente, Imovel, Usuario } from '../types/domus';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('react-test-renderer is deprecated')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Utilitario recursivo para inspecionar arvore de nós json do test-renderer
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

function criarMockContext(overrides: Partial<DomusContextData> = {}): DomusContextData {
  const clienteMock: Cliente = {
    id: 1,
    nomeCompleto: 'Carlos Eduardo Mendes',
    cpfDocumento: '111.222.333-44',
    tipoDocumento: 'CPF',
    telefone: '(83) 99881-2233',
    celular: '(83) 99881-2233',
    email: 'carlos.mendes@email.com',
    canalPrincipalContato: 'WHATSAPP',
    observacoes: 'Interesse em apto de 3 quartos em Manaira',
    imoveisInteresse: [
      {
        id: 1,
        numeroInscricao: 'JP-MAN-2026-01',
        tipoImovel: 'APARTAMENTO',
        finalidade: 'VENDA',
        endereco: 'Av. Flavio Ribeiro Coutinho, 500',
        bairro: 'Manaira',
        valor: 750000,
        statusImovel: 'DISPONIVEL',
      },
    ],
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
    clientesInteressados: [clienteMock],
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
    agendamentos: [],
    visaoGeral: null,
    avisos: null,
    bannerVisivel: true,
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
    criarCliente: jest.fn().mockResolvedValue(clienteMock),
    criarImovel: jest.fn().mockResolvedValue(imovelMock),
    criarAgendamento: jest.fn(),
    programarRetorno: jest.fn(),
    concluirAgendamento: jest.fn(),
    sincronizarGoogleCalendar: jest.fn(),
    cadastrarUsuario: jest.fn().mockResolvedValue(usuarioMock),
    configurarModo: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ClientesScreen (Fiel ao wireframe 01-cadastro-cliente.png e Secao 4.2)', () => {
  it('renderiza rotulo "Cadastro de Cliente" e os campos na ordem fiel: nome Completo, CPF, Telefone, E-mail', () => {
    const mockContext = criarMockContext();
    let testInstance: renderer.ReactTestRenderer;

    act(() => {
      testInstance = renderer.create(<ClientesScreen context={mockContext} />);
    });

    const textos = coletarTextos(testInstance!.toJSON());
    expect(textos.join(' ')).toContain('Cadastro de Cliente');

    const inputNome = testInstance!.root.findByProps({ testID: 'input-cliente-nome' });
    const inputCpf = testInstance!.root.findByProps({ testID: 'input-cliente-cpf' });
    const inputTelefone = testInstance!.root.findByProps({ testID: 'input-cliente-telefone' });
    const inputEmail = testInstance!.root.findByProps({ testID: 'input-cliente-email' });
    const btnCadastrar = testInstance!.root.findByProps({ testID: 'btn-cadastrar-cliente' });

    expect(inputNome).toBeDefined();
    expect(inputCpf).toBeDefined();
    expect(inputTelefone).toBeDefined();
    expect(inputEmail).toBeDefined();
    expect(btnCadastrar).toBeDefined();

    expect(inputNome.props.label).toBe('nome Completo');
    expect(inputCpf.props.label).toBe('CPF');
    expect(inputTelefone.props.label).toBe('Telefone');
    expect(inputEmail.props.label).toBe('E-mail');
  });

  it('renderiza os chips de Canal Principal de Contato (WHATSAPP default, TELEFONE, REDE_SOCIAL, EMAIL, PRESENCIAL)', () => {
    const mockContext = criarMockContext();
    let testInstance: renderer.ReactTestRenderer;

    act(() => {
      testInstance = renderer.create(<ClientesScreen context={mockContext} />);
    });

    const chipWhatsapp = testInstance!.root.findByProps({ testID: 'chip-canal-WHATSAPP' });
    const chipTelefone = testInstance!.root.findByProps({ testID: 'chip-canal-TELEFONE' });
    const chipRedeSocial = testInstance!.root.findByProps({ testID: 'chip-canal-REDE_SOCIAL' });
    const chipEmail = testInstance!.root.findByProps({ testID: 'chip-canal-EMAIL' });
    const chipPresencial = testInstance!.root.findByProps({ testID: 'chip-canal-PRESENCIAL' });

    expect(chipWhatsapp).toBeDefined();
    expect(chipTelefone).toBeDefined();
    expect(chipRedeSocial).toBeDefined();
    expect(chipEmail).toBeDefined();
    expect(chipPresencial).toBeDefined();
  });

  it('renderiza campo Observacoes e chips de selecao de Imoveis de Interesse', () => {
    const mockContext = criarMockContext();
    let testInstance: renderer.ReactTestRenderer;

    act(() => {
      testInstance = renderer.create(<ClientesScreen context={mockContext} />);
    });

    const inputObs = testInstance!.root.findByProps({ testID: 'input-cliente-observacoes' });
    const chipImovel1 = testInstance!.root.findByProps({ testID: 'chip-imovel-1' });

    expect(inputObs).toBeDefined();
    expect(chipImovel1).toBeDefined();
  });

  it('valida campos obrigatorios (nome Completo, CPF e Telefone) ao clicar em Cadastrar', async () => {
    const criarClienteMock = jest.fn();
    const mockContext = criarMockContext({ criarCliente: criarClienteMock });
    let testInstance: renderer.ReactTestRenderer;

    act(() => {
      testInstance = renderer.create(<ClientesScreen context={mockContext} />);
    });

    const btnCadastrar = testInstance!.root.findByProps({ testID: 'btn-cadastrar-cliente' });
    await act(async () => {
      await btnCadastrar.props.onPress();
    });

    expect(criarClienteMock).not.toHaveBeenCalled();
  });

  it('cadastra cliente com sucesso chamando criarCliente no contexto e exibindo feedback', async () => {
    const criarClienteMock = jest.fn().mockResolvedValue({
      id: 2,
      nomeCompleto: 'Ana Beatriz Ramos',
      cpfDocumento: '222.333.444-55',
      telefone: '(83) 98765-4321',
      email: 'ana@email.com',
      canalPrincipalContato: 'WHATSAPP',
    });
    const mockContext = criarMockContext({ criarCliente: criarClienteMock });
    let testInstance: renderer.ReactTestRenderer;

    act(() => {
      testInstance = renderer.create(<ClientesScreen context={mockContext} />);
    });

    const inputNome = testInstance!.root.findByProps({ testID: 'input-cliente-nome' });
    const inputCpf = testInstance!.root.findByProps({ testID: 'input-cliente-cpf' });
    const inputTelefone = testInstance!.root.findByProps({ testID: 'input-cliente-telefone' });
    const inputEmail = testInstance!.root.findByProps({ testID: 'input-cliente-email' });
    const chipImovel1 = testInstance!.root.findByProps({ testID: 'chip-imovel-1' });
    const btnCadastrar = testInstance!.root.findByProps({ testID: 'btn-cadastrar-cliente' });

    act(() => {
      inputNome.props.onChangeText('Ana Beatriz Ramos');
      inputCpf.props.onChangeText('22233344455');
      inputTelefone.props.onChangeText('83987654321');
      inputEmail.props.onChangeText('ana@email.com');
      chipImovel1.props.onPress();
    });

    await act(async () => {
      await btnCadastrar.props.onPress();
    });

    expect(criarClienteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nomeCompleto: 'Ana Beatriz Ramos',
        cpfDocumento: '222.333.444-55',
        telefone: '(83) 98765-4321',
        email: 'ana@email.com',
        canalPrincipalContato: 'WHATSAPP',
        imoveisInteresseIds: [1],
      })
    );
  });
});
