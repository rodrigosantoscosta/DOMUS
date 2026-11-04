import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { AgendarScreen } from '../screens/AgendarScreen';
import { DomusContextData } from '../context/DomusContext';
import { Cliente, Imovel, Agendamento, Usuario } from '../types/domus';
import { DOMUS_THEME } from '../theme/tokens';

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

function criarContextoMock(overrides: Partial<DomusContextData> = {}): DomusContextData {
  const imovelInteresseMock: Imovel = {
    id: 10,
    numeroInscricao: 'JP-MAN-2026-01',
    tipoImovel: 'APARTAMENTO',
    finalidade: 'VENDA',
    endereco: 'Av. Flavio Ribeiro Coutinho, 500',
    bairro: 'Manaira',
    valor: 750000,
    statusImovel: 'DISPONIVEL',
  };

  const imovelOutroMock: Imovel = {
    id: 20,
    numeroInscricao: 'JP-CAB-2026-02',
    tipoImovel: 'CASA',
    finalidade: 'VENDA',
    endereco: 'Rua das Acacias, 120',
    bairro: 'Cabedelo',
    valor: 450000,
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
    imoveisInteresse: [imovelInteresseMock],
  };

  const clienteDoisMock: Cliente = {
    id: 2,
    nomeCompleto: 'Mariana Lima de Sousa',
    cpfDocumento: '222.333.444-55',
    tipoDocumento: 'CPF',
    telefone: '(83) 98765-4321',
    canalPrincipalContato: 'TELEFONE',
    imoveisInteresse: [],
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
    imovel: imovelInteresseMock,
  };

  return {
    usuario: usuarioMock,
    abaAtiva: 'Agendar',
    setAbaAtiva: jest.fn(),
    clientes: [clienteMock, clienteDoisMock],
    imoveis: [imovelInteresseMock, imovelOutroMock],
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

describe('AgendarScreen (Fiel ao Wireframe 02 e Regras RN08, RN10, RN16)', () => {
  it('renderiza os componentes basicos (View, Text, Image, ScrollView, Pressable) e o titulo fiel ao wireframe 02', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const screenContainer = root.root.findByProps({ testID: 'agendar-screen' });
    expect(screenContainer).toBeDefined();
    const styleScreen = StyleSheet.flatten(screenContainer.props.style);
    expect(styleScreen.flex).toBe(1);
    expect(styleScreen.backgroundColor).toBe(DOMUS_THEME.background);

    // Image (Logo DOMUS)
    const logo = root.root.findByProps({ testID: 'agendar-logo' });
    expect(logo).toBeDefined();

    // ScrollView
    const scrollView = root.root.findByProps({ testID: 'agendar-scroll-view' });
    expect(scrollView).toBeDefined();

    // Text com titulo do wireframe 02
    const textos = coletarTextos(root.toJSON());
    const textoCompleto = textos.join(' ');
    expect(textoCompleto).toContain('Criar seu Agendamento');
    expect(textoCompleto).toContain('Titulo');
    expect(textoCompleto).toContain('Descrição');
    expect(textoCompleto).toContain('Data');
    expect(textoCompleto).toContain('Hora:');
    expect(textoCompleto).toContain('Duração');
    expect(textoCompleto).toContain('Observação');

    // Pressable dos tipos e botao de submissao
    const selectorVisita = root.root.findByProps({ testID: 'tipo-selector-visita' });
    const selectorRetorno = root.root.findByProps({ testID: 'tipo-selector-retorno' });
    const selectorAtendimento = root.root.findByProps({ testID: 'tipo-selector-atendimento' });
    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });

    expect(selectorVisita).toBeDefined();
    expect(selectorRetorno).toBeDefined();
    expect(selectorAtendimento).toBeDefined();
    expect(btnSubmit).toBeDefined();
  });

  it('permite alternar entre os tipos VISITA, RETORNO e ATENDIMENTO com escala tatil via Pressable', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const selectorVisita = root.root.findByProps({ testID: 'tipo-selector-visita' });
    const selectorRetorno = root.root.findByProps({ testID: 'tipo-selector-retorno' });
    const selectorAtendimento = root.root.findByProps({ testID: 'tipo-selector-atendimento' });

    // Estado inicial: VISITA selecionado
    expect(selectorVisita.props.accessibilityState.selected).toBe(true);
    expect(selectorRetorno.props.accessibilityState.selected).toBe(false);

    // Alterna para RETORNO
    act(() => {
      selectorRetorno.props.onPress();
    });
    expect(selectorRetorno.props.accessibilityState.selected).toBe(true);
    expect(selectorVisita.props.accessibilityState.selected).toBe(false);

    // Alterna para ATENDIMENTO
    act(() => {
      selectorAtendimento.props.onPress();
    });
    expect(selectorAtendimento.props.accessibilityState.selected).toBe(true);
    expect(selectorRetorno.props.accessibilityState.selected).toBe(false);
  });

  it('permite buscar e selecionar cliente, e trocar o cliente selecionado', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    // Busca cliente por nome
    const inputBusca = root.root.findByProps({ testID: 'input-busca-cliente' });
    act(() => {
      inputBusca.props.onChangeText('Mariana');
    });

    // Seleciona o cliente Mariana (id 2)
    const itemMariana = root.root.findByProps({ testID: 'cliente-item-2' });
    expect(itemMariana).toBeDefined();
    act(() => {
      itemMariana.props.onPress();
    });

    // Agora o card de cliente selecionado aparece com botao de trocar
    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('Mariana Lima de Sousa');

    const btnTrocar = root.root.findByProps({ testID: 'btn-trocar-cliente' });
    expect(btnTrocar).toBeDefined();

    // Clica em trocar cliente
    act(() => {
      btnTrocar.props.onPress();
    });

    // Lista de busca volta a aparecer
    const inputBuscaNovamente = root.root.findByProps({ testID: 'input-busca-cliente' });
    expect(inputBuscaNovamente).toBeDefined();
  });

  it('respeita clientePreSelecionadoId passado como prop inicial', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen context={mockContext} clientePreSelecionadoId={1} />
      );
    });

    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('Carlos Eduardo Mendes');
    const btnTrocar = root.root.findByProps({ testID: 'btn-trocar-cliente' });
    expect(btnTrocar).toBeDefined();
  });

  it('destaca imoveis de interesse quando o cliente selecionado possui vinculo', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen context={mockContext} clientePreSelecionadoId={1} />
      );
    });

    // O imovel id 10 e de interesse do cliente 1
    const badgeInteresse = root.root.findByProps({ testID: 'imovel-interesse-badge-10' });
    expect(badgeInteresse).toBeDefined();
    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('INTERESSE DO CLIENTE');
  });

  it('permite alternar o toggle Pressable de sincronizacao Google Calendar (RN16)', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const toggle = root.root.findByProps({ testID: 'toggle-google-calendar' });
    expect(toggle.props.accessibilityState.checked).toBe(false);

    // Ativa o toggle
    act(() => {
      toggle.props.onPress();
    });
    expect(toggle.props.accessibilityState.checked).toBe(true);

    // Desativa o toggle
    act(() => {
      toggle.props.onPress();
    });
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });

  it('valida RN10: bloqueia submissao e exibe erro e toast quando cliente nao for selecionado', async () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    // Preenche apenas titulo
    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    act(() => {
      inputTitulo.props.onChangeText('Reunião Geral');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    // Nao deve ter chamado criarAgendamento
    expect(mockContext.criarAgendamento).not.toHaveBeenCalled();

    // Deve ter chamado mostrarToast com erro
    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      expect.stringContaining('Cliente é obrigatório'),
      'erro'
    );

    // Banner de erro deve estar visivel
    const bannerErro = root.root.findByProps({ testID: 'banner-erro-agendamento' });
    expect(bannerErro).toBeDefined();
    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('Cliente é obrigatório para criar o agendamento (RN10)');
  });

  it('valida RN08: bloqueia submissao e exibe erro e toast quando tipo VISITA nao possui imovel selecionado', async () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen context={mockContext} clientePreSelecionadoId={1} />
      );
    });

    // Define titulo, data e hora, mas sem selecionar imovel
    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });

    act(() => {
      inputTitulo.props.onChangeText('Visita no Bairro');
      inputData.props.onChangeText('25/10/2026');
      inputHora.props.onChangeText('14:00');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    expect(mockContext.criarAgendamento).not.toHaveBeenCalled();
    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      expect.stringContaining('é obrigatório selecionar um imóvel cadastrado (RN08)'),
      'erro'
    );

    const textos = coletarTextos(root.toJSON()).join(' ');
    expect(textos).toContain('Para agendar uma visita (tipo VISITA), é obrigatório selecionar um imóvel cadastrado (RN08)');
  });

  it('valida RN08: bloqueia submissao quando tipo VISITA nao possui data ou hora informadas', async () => {
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
    act(() => {
      inputTitulo.props.onChangeText('Visita no Imovel');
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    expect(mockContext.criarAgendamento).not.toHaveBeenCalled();
    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      expect.stringContaining('é obrigatório informar a data e hora do compromisso (RN08)'),
      'erro'
    );
  });

  it('submete com sucesso compromisso de VISITA valido, chamando criarAgendamento e exibindo toast', async () => {
    const mockContext = criarContextoMock();
    const onAgendamentoCriado = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <AgendarScreen
          context={mockContext}
          clientePreSelecionadoId={1}
          imovelPreSelecionadoId={10}
          onAgendamentoCriado={onAgendamentoCriado}
        />
      );
    });

    const inputTitulo = root.root.findByProps({ testID: 'input-agendamento-titulo' });
    const inputDescricao = root.root.findByProps({ testID: 'input-agendamento-descricao' });
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });
    const inputDuracao = root.root.findByProps({ testID: 'input-agendamento-duracao' });
    const inputProximaAcao = root.root.findByProps({ testID: 'input-agendamento-proxima-acao' });
    const inputObservacoes = root.root.findByProps({ testID: 'input-agendamento-observacoes' });
    const toggleSync = root.root.findByProps({ testID: 'toggle-google-calendar' });

    act(() => {
      inputTitulo.props.onChangeText('Visita Residencial Manaira');
      inputDescricao.props.onChangeText('Apresentar as opcoes de 3 quartos');
      inputData.props.onChangeText('25/10/2026');
      inputHora.props.onChangeText('10:00');
      inputDuracao.props.onChangeText('90');
      inputProximaAcao.props.onChangeText('Enviar minuta por WhatsApp');
      inputObservacoes.props.onChangeText('Cliente prefere receber contato a tarde');
      toggleSync.props.onPress();
    });

    const btnSubmit = root.root.findByProps({ testID: 'btn-agendar-submit' });
    await act(async () => {
      await btnSubmit.props.onPress();
    });

    expect(mockContext.criarAgendamento).toHaveBeenCalledTimes(1);
    expect(mockContext.criarAgendamento).toHaveBeenCalledWith({
      titulo: 'Visita Residencial Manaira',
      descricao: 'Apresentar as opcoes de 3 quartos',
      tipo: 'VISITA',
      status: 'PENDENTE',
      clienteId: 1,
      imovelId: 10,
      data: '25/10/2026',
      hora: '10:00',
      duracaoMinutos: 90,
      proximaAcao: 'Enviar minuta por WhatsApp',
      observacao: 'Cliente prefere receber contato a tarde',
      sincronizarGoogleCalendar: true,
    });

    expect(mockContext.mostrarToast).toHaveBeenCalledWith(
      'Agendamento criado com sucesso!',
      'sucesso'
    );
    expect(onAgendamentoCriado).toHaveBeenCalledTimes(1);

    const bannerSucesso = root.root.findByProps({ testID: 'banner-sucesso-agendamento' });
    expect(bannerSucesso).toBeDefined();
  });
});
