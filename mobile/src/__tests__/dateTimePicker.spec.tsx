import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AgendarScreen } from '../screens/AgendarScreen';
import { DomusContextData } from '../context/DomusContext';
import { Cliente, Imovel, Agendamento, Usuario } from '../types/domus';
import {
  dataParaStringBr,
  horaParaString,
  stringBrParaData,
  adicionarDiasDataBr,
  dataBrParaIsoInput,
  gerarDiasCalendarioMes,
  ajustarMinutosHoraBr,
} from '../utils/formatters';
import { DomusDateTimePresets } from '../components/DomusDateTimePresets';
import { DomusWebPickerModal } from '../components/DomusWebPickerModal';

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
    cadastrarUsuario: jest.fn().mockResolvedValue(usuarioMock),
    criarCliente: jest.fn().mockResolvedValue(clienteMock),
    criarImovel: jest.fn().mockResolvedValue(imovelMock),
    criarAgendamento: jest.fn().mockResolvedValue(agendamentoMock),
    programarRetorno: jest.fn().mockResolvedValue(agendamentoMock),
    concluirAgendamento: jest.fn().mockResolvedValue(agendamentoMock),
    sincronizarGoogleCalendar: jest.fn().mockResolvedValue({ sincronizado: true }),
    mostrarToast: jest.fn(),
    configurarModo: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Formatadores e Conversores de Data/Hora para DateTimePicker', () => {
  it('converte Date para string DD/MM/AAAA corretamente com dataParaStringBr', () => {
    const d = new Date(2026, 10, 5); // 05/11/2026 (mes 10 = novembro em base zero)
    expect(dataParaStringBr(d)).toBe('05/11/2026');
  });

  it('converte Date para string HH:MM corretamente com horaParaString', () => {
    const d = new Date(2026, 10, 5, 14, 30);
    expect(horaParaString(d)).toBe('14:30');
  });

  it('converte stringBrParaData com fallback seguro se data for invalida', () => {
    const dInvalido = stringBrParaData('data-invalida', 'hora-invalida');
    expect(dInvalido).toBeInstanceOf(Date);
    expect(isNaN(dInvalido.getTime())).toBe(false);

    const dValido = stringBrParaData('25/12/2026', '10:15');
    expect(dValido.getFullYear()).toBe(2026);
    expect(dValido.getMonth()).toBe(11); // Dezembro
    expect(dValido.getDate()).toBe(25);
    expect(dValido.getHours()).toBe(10);
    expect(dValido.getMinutes()).toBe(15);
  });
});

describe('Integracao de DateTimePicker e Icones na AgendarScreen', () => {
  it('renderiza os botoes com icones de calendario e relogio no AgendarScreen', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const btnDatePicker = root.root.findByProps({ testID: 'btn-abrir-datepicker' });
    expect(btnDatePicker).toBeDefined();

    const btnTimePicker = root.root.findByProps({ testID: 'btn-abrir-timepicker' });
    expect(btnTimePicker).toBeDefined();
  });

  it('abre o DateTimePicker ao clicar no icone de calendario e atualiza o campo ao selecionar', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const btnDatePicker = root.root.findByProps({ testID: 'btn-abrir-datepicker' });

    // Clica no botao de calendario
    act(() => {
      btnDatePicker.props.onPress();
    });

    // DateTimePicker deve estar visivel
    const datePicker = root.root.findByProps({ testID: 'agendar-date-picker' });
    expect(datePicker).toBeDefined();

    // Simula evento 'set' com a data selecionada
    act(() => {
      datePicker.props.onChange({ type: 'set' }, new Date(2026, 10, 20));
    });

    // O input de data agora deve ter a data formatada
    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    expect(inputData.props.value).toBe('20/11/2026');
  });

  it('abre o DateTimePicker ao clicar no icone de relogio e atualiza o campo ao selecionar horario', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const btnTimePicker = root.root.findByProps({ testID: 'btn-abrir-timepicker' });

    // Clica no botao de relogio
    act(() => {
      btnTimePicker.props.onPress();
    });

    // TimePicker deve estar visivel
    const timePicker = root.root.findByProps({ testID: 'agendar-time-picker' });
    expect(timePicker).toBeDefined();

    // Simula evento 'set' com horario selecionado (15:45)
    act(() => {
      timePicker.props.onChange({ type: 'set' }, new Date(2026, 10, 20, 15, 45));
    });

    // O input de hora agora deve ter o horario formatado
    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });
    expect(inputHora.props.value).toBe('15:45');
  });

  it('permite selecionar data via chips rapidos (Hoje, Amanha) em 1 toque na AgendarScreen', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const chipHoje = root.root.findByProps({ testID: 'chip-data-hoje' });
    expect(chipHoje).toBeDefined();

    const dataHojeEsperada = adicionarDiasDataBr(0);
    act(() => {
      chipHoje.props.onPress();
    });

    const inputData = root.root.findByProps({ testID: 'input-agendamento-data' });
    expect(inputData.props.value).toBe(dataHojeEsperada);

    const chipAmanha = root.root.findByProps({ testID: 'chip-data-amanha' });
    const dataAmanhaEsperada = adicionarDiasDataBr(1);
    act(() => {
      chipAmanha.props.onPress();
    });
    expect(inputData.props.value).toBe(dataAmanhaEsperada);
  });

  it('permite selecionar horario via chips rapidos comerciais em 1 toque na AgendarScreen', () => {
    const mockContext = criarContextoMock();
    let root: any;

    act(() => {
      root = renderer.create(<AgendarScreen context={mockContext} />);
    });

    const chip14 = root.root.findByProps({ testID: 'chip-hora-14-00' });
    expect(chip14).toBeDefined();

    act(() => {
      chip14.props.onPress();
    });

    const inputHora = root.root.findByProps({ testID: 'input-agendamento-hora' });
    expect(inputHora.props.value).toBe('14:00');

    const chip16 = root.root.findByProps({ testID: 'chip-hora-16-00' });
    act(() => {
      chip16.props.onPress();
    });
    expect(inputHora.props.value).toBe('16:00');
  });
});

describe('Utilitarios Avancados de Data/Hora e Componente DomusDateTimePresets', () => {
  it('adicionarDiasDataBr calcula datas relativas corretamente a partir de uma data base', () => {
    const base = new Date(2026, 10, 10); // 10/11/2026
    expect(adicionarDiasDataBr(0, base)).toBe('10/11/2026');
    expect(adicionarDiasDataBr(1, base)).toBe('11/11/2026');
    expect(adicionarDiasDataBr(3, base)).toBe('13/11/2026');
    expect(adicionarDiasDataBr(7, base)).toBe('17/11/2026');
  });

  it('dataBrParaIsoInput converte data DD/MM/AAAA para formato ISO YYYY-MM-DD para ancoragem no picker web', () => {
    expect(dataBrParaIsoInput('25/10/2026')).toBe('2026-10-25');
    expect(dataBrParaIsoInput('05/01/2027')).toBe('2027-01-05');
    expect(dataBrParaIsoInput('')).toBe('');
    expect(dataBrParaIsoInput('invalida')).toBe('');
  });

  it('renderiza o componente DomusDateTimePresets isoladamente com callbacks funcionais', () => {
    const onSelectData = jest.fn();
    const onSelectHora = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <DomusDateTimePresets
          dataAtual=""
          horaAtual=""
          onSelectData={onSelectData}
          onSelectHora={onSelectHora}
          testIDPrefix="teste"
        />
      );
    });

    const container = root.root.findByProps({ testID: 'teste-presets-container' });
    expect(container).toBeDefined();

    const chipHoje = root.root.findByProps({ testID: 'chip-data-hoje' });
    act(() => {
      chipHoje.props.onPress();
    });
    expect(onSelectData).toHaveBeenCalledWith(adicionarDiasDataBr(0));

    const chip09 = root.root.findByProps({ testID: 'chip-hora-09-00' });
    act(() => {
      chip09.props.onPress();
    });
    expect(onSelectHora).toHaveBeenCalledWith('09:00');
  });

  it('gerarDiasCalendarioMes gera matriz completa de semanas para o mes solicitado', () => {
    // Novembro de 2026 (mes base zero 10): inicia no domingo (1 de nov) e tem 30 dias
    const dias = gerarDiasCalendarioMes(2026, 10);
    expect(dias.length % 7).toBe(0);
    expect(dias.length).toBeGreaterThanOrEqual(35);
    const diasAtuais = dias.filter((d) => d.mesAtual);
    expect(diasAtuais.length).toBe(30);
    expect(diasAtuais[0].dia).toBe(1);
    expect(diasAtuais[29].dia).toBe(30);
  });

  it('ajustarMinutosHoraBr adiciona e subtrai minutos com limites de 24 horas', () => {
    expect(ajustarMinutosHoraBr('14:00', 15)).toBe('14:15');
    expect(ajustarMinutosHoraBr('14:00', -15)).toBe('13:45');
    expect(ajustarMinutosHoraBr('23:45', 30)).toBe('00:15');
    expect(ajustarMinutosHoraBr('00:10', -20)).toBe('23:50');
  });
});

describe('Componente DomusWebPickerModal para Expo Web', () => {
  it('renderiza seletor de data e confirma valor selecionado', () => {
    const onConfirmar = jest.fn();
    const onFechar = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <DomusWebPickerModal
          visivel={true}
          tipo="date"
          valorAtual="10/11/2026"
          onConfirmar={onConfirmar}
          onFechar={onFechar}
          testIDPrefix="teste-web"
        />
      );
    });

    const modal = root.root.findByProps({ testID: 'teste-web-modal' });
    expect(modal).toBeDefined();

    const btnConfirmar = root.root.findByProps({ testID: 'teste-web-btn-confirmar' });
    act(() => {
      btnConfirmar.props.onPress();
    });

    expect(onConfirmar).toHaveBeenCalledWith('10/11/2026');
    expect(onFechar).toHaveBeenCalled();
  });

  it('renderiza seletor de horario e permite confirmar', () => {
    const onConfirmar = jest.fn();
    const onFechar = jest.fn();
    let root: any;

    act(() => {
      root = renderer.create(
        <DomusWebPickerModal
          visivel={true}
          tipo="time"
          valorAtual="16:00"
          onConfirmar={onConfirmar}
          onFechar={onFechar}
          testIDPrefix="teste-web-hora"
        />
      );
    });

    const btnConfirmar = root.root.findByProps({ testID: 'teste-web-hora-btn-confirmar' });
    act(() => {
      btnConfirmar.props.onPress();
    });

    expect(onConfirmar).toHaveBeenCalledWith('16:00');
    expect(onFechar).toHaveBeenCalled();
  });
});
