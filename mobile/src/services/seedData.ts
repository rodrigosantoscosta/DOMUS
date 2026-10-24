import { Cliente, DomusLocalState, Imovel, Usuario } from '../types/domus';

export function criarEstadoSeedJunior(): DomusLocalState {
  const agora = Date.now();
  const em24Horas = new Date(agora + 24 * 3600_000).toISOString();
  const ha48Horas = new Date(agora - 48 * 3600_000).toISOString();

  const usuarioJunior: Usuario = {
    id: 1,
    nome: 'Junior (Corretor Autônomo - João Pessoa/PB)',
    login: 'junior.corretor',
    email: 'junior@domus.com.br',
    cpf: '11122233344',
    perfis: ['CORRETOR', 'CADASTRADOR'],
    ativo: true,
    ultimoLogin: null,
    criadoEm: new Date(agora - 7 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 7 * 24 * 3600_000).toISOString(),
  };

  const imovelManaira: Imovel = {
    id: 1,
    numeroInscricao: 'JP-MAN-2026-01',
    tipoImovel: 'APARTAMENTO',
    finalidade: 'VENDA',
    endereco: 'Av. Gov. Flávio Ribeiro Coutinho, 500, Apto 802',
    bairro: 'Manaíra',
    numero: '500',
    complemento: 'Apto 802',
    cep: '58038-000',
    areaTotal: 110,
    comodos: 3,
    banheiros: 2,
    valor: 620000,
    posicoes: ['NASCENTE', 'NORTE'],
    statusImovel: 'DISPONIVEL',
    corretorCaptadorId: 1,
    criadoEm: new Date(agora - 5 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 5 * 24 * 3600_000).toISOString(),
  };

  const clienteCarlos: Cliente = {
    id: 1,
    nomeCompleto: 'Carlos Eduardo Mendes',
    cpfDocumento: '98765432100',
    tipoDocumento: 'CPF',
    telefone: '(83) 99988-7766',
    celular: '(83) 99988-7766',
    email: 'carlos.mendes@email.com',
    canalPrincipalContato: 'WHATSAPP',
    observacoes: 'Procura apartamento 3 quartos em Manaíra, posição nascente.',
    imoveisInteresse: [{ ...imovelManaira }],
    criadoEm: new Date(agora - 3 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 3 * 24 * 3600_000).toISOString(),
  };

  const agendamentoVisita = {
    id: 1,
    titulo: 'Visita ao Apto Manaíra com Carlos',
    descricao: 'Apresentar imóvel e documentação inicial',
    descricaoCurta: 'Apresentar imóvel e documentação inicial',
    tipo: 'VISITA' as const,
    status: 'CONFIRMADO' as const,
    dataHora: em24Horas,
    duracaoMinutos: 60,
    observacao: 'Confirmado via WhatsApp',
    canalContato: 'WHATSAPP' as const,
    proximaAcao: 'Enviar simulação de financiamento após a visita',
    sincronizarGoogleCalendar: true,
    googleCalendarEventId: 'domus-evt-seed-1',
    googleCalendarUrl:
      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=%5BDOMUS%5D+Visita+ao+Apto+Mana%C3%ADra+com+Carlos',
    clienteId: 1,
    imovelId: 1,
    corretorId: 1,
    cliente: { ...clienteCarlos, imoveisInteresse: undefined },
    imovel: { ...imovelManaira },
    corretor: { ...usuarioJunior },
    criadoEm: new Date(agora - 2 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 2 * 24 * 3600_000).toISOString(),
  };

  const agendamentoRetorno = {
    id: 2,
    titulo: 'Retorno sobre contraproposta',
    descricao: 'Cobrar posição do comprador e checar aceite do proprietário',
    descricaoCurta: 'Checar aceite do proprietário',
    tipo: 'RETORNO' as const,
    status: 'PENDENTE' as const,
    dataHora: ha48Horas,
    duracaoMinutos: 30,
    observacao: 'Aguardando retorno do proprietário',
    canalContato: 'WHATSAPP' as const,
    proximaAcao: 'Checar aceite do proprietário',
    dataRetorno: ha48Horas,
    sincronizarGoogleCalendar: false,
    clienteId: 1,
    imovelId: 1,
    corretorId: 1,
    cliente: { ...clienteCarlos, imoveisInteresse: undefined },
    imovel: { ...imovelManaira },
    corretor: { ...usuarioJunior },
    criadoEm: new Date(agora - 4 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 4 * 24 * 3600_000).toISOString(),
  };

  const agendamentoSemData = {
    id: 3,
    titulo: 'Atendimento inicial sobre interesse em Manaíra',
    descricao: 'Identificar preferências de metragem e posição solar',
    descricaoCurta: 'Definir data para visita',
    tipo: 'ATENDIMENTO' as const,
    status: 'PENDENTE' as const,
    dataHora: null,
    duracaoMinutos: 30,
    observacao: 'Primeiro contato realizado pelo portal',
    canalContato: 'WHATSAPP' as const,
    proximaAcao: 'Definir data para visita aos imóveis selecionados',
    dataRetorno: null,
    sincronizarGoogleCalendar: false,
    clienteId: 1,
    imovelId: 1,
    corretorId: 1,
    cliente: { ...clienteCarlos, imoveisInteresse: undefined },
    imovel: { ...imovelManaira },
    corretor: { ...usuarioJunior },
    criadoEm: new Date(agora - 1 * 24 * 3600_000).toISOString(),
    atualizadoEm: new Date(agora - 1 * 24 * 3600_000).toISOString(),
  };

  return {
    usuarios: [usuarioJunior],
    clientes: [clienteCarlos],
    imoveis: [imovelManaira],
    agendamentos: [agendamentoVisita, agendamentoRetorno, agendamentoSemData],
    avisos: [],
    usuarioLogadoId: 1,
    modoOfflineForcado: false,
    apiBaseUrl: 'http://localhost:3000/api',
  };
}
