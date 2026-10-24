export type TipoDocumento = 'CPF' | 'CNPJ';

export type CanalContato =
  | 'WHATSAPP'
  | 'TELEFONE'
  | 'REDE_SOCIAL'
  | 'EMAIL'
  | 'PRESENCIAL';

export type TipoImovel = 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COMERCIAL';

export type FinalidadeImovel = 'VENDA' | 'ALUGUEL' | 'AMBOS';

export type StatusImovel =
  | 'DISPONIVEL'
  | 'RESERVADO'
  | 'VENDIDO'
  | 'ALUGADO'
  | 'INATIVO';

export type TipoAgendamento = 'VISITA' | 'RETORNO' | 'ATENDIMENTO';

export type StatusAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type TipoAviso =
  | 'COMPROMISSO_PROXIMO'
  | 'RETORNO_ATRASADO'
  | 'TAREFA_SEM_DATA';

export type AbaDomus = 'Agendar' | 'Imoveis' | 'Atendimentos' | 'Clientes';

export type PerfilUsuario = 'CORRETOR' | 'CADASTRADOR' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  cpf?: string | null;
  email: string;
  perfis: string | string[];
  ativo: boolean;
  ultimoLogin?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateUsuarioInput {
  nome: string;
  login: string;
  email: string;
  senha: string;
  cpf?: string;
  perfis?: string;
}

export interface LoginInput {
  loginOuEmail: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
  modoOffline: boolean;
}

export interface Cliente {
  id: number;
  nomeCompleto: string;
  cpfDocumento: string;
  tipoDocumento: TipoDocumento;
  telefone: string;
  celular?: string | null;
  email?: string | null;
  canalPrincipalContato: CanalContato;
  observacoes?: string | null;
  imoveisInteresse?: Imovel[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateClienteInput {
  nomeCompleto: string;
  cpfDocumento: string;
  tipoDocumento?: TipoDocumento;
  telefone: string;
  celular?: string;
  email?: string;
  canalPrincipalContato?: CanalContato;
  observacoes?: string;
  imovelInteresseIds?: number[];
  imoveisInteresseIds?: number[];
}

export interface Imovel {
  id: number;
  numeroInscricao?: string | null;
  tipoImovel: TipoImovel;
  finalidade: FinalidadeImovel;
  cep?: string | null;
  endereco: string;
  bairro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  areaTotal?: number | null;
  comodos?: number;
  banheiros?: number;
  valor?: number;
  posicoes?: string | string[] | null;
  statusImovel: StatusImovel;
  proprietarioId?: number | null;
  corretorCaptadorId?: number | null;
  proprietario?: Cliente | null;
  corretorCaptador?: Usuario | null;
  clientesInteressados?: Cliente[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateImovelInput {
  numeroInscricao?: string;
  tipoImovel?: TipoImovel;
  finalidade?: FinalidadeImovel;
  cep?: string;
  endereco: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  areaTotal?: number;
  comodos?: number;
  banheiros?: number;
  valor?: number;
  posicoes?: string | string[];
  statusImovel?: StatusImovel;
  proprietarioId?: number;
  corretorCaptadorId?: number;
}

export interface Agendamento {
  id: number;
  titulo: string;
  descricao?: string | null;
  descricaoCurta?: string | null;
  tipo: TipoAgendamento;
  status: StatusAgendamento;
  dataHora?: string | null;
  duracaoMinutos: number;
  observacao?: string | null;
  canalContato?: CanalContato | null;
  proximaAcao?: string | null;
  dataRetorno?: string | null;
  sincronizarGoogleCalendar: boolean;
  googleCalendarEventId?: string | null;
  googleCalendarUrl?: string | null;
  clienteId: number;
  imovelId?: number | null;
  corretorId?: number | null;
  agendamentoOrigemId?: number | null;
  cliente?: Cliente;
  imovel?: Imovel | null;
  corretor?: Usuario | null;
  agendamentoOrigem?: Agendamento | null;
  retornosDerivados?: Agendamento[];
  avisos?: AvisoItem[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateAgendamentoInput {
  titulo: string;
  descricao?: string;
  descricaoCurta?: string;
  tipo: TipoAgendamento;
  status?: StatusAgendamento;
  data?: string;
  hora?: string;
  dataHoraIso?: string;
  duracaoMinutos?: number;
  observacao?: string;
  canalContato?: CanalContato;
  proximaAcao?: string;
  dataRetorno?: string;
  horaRetorno?: string;
  dataRetornoIso?: string;
  sincronizarGoogleCalendar?: boolean;
  clienteId: number;
  imovelId?: number;
  corretorId?: number;
  agendamentoOrigemId?: number;
}

export interface ProgramarRetornoInput {
  titulo?: string;
  data?: string;
  hora?: string;
  dataHoraIso?: string;
  duracaoMinutos?: number;
  canalContato?: CanalContato;
  observacao?: string;
  proximaAcao?: string;
  sincronizarGoogleCalendar?: boolean;
}

export interface ConcluirAgendamentoInput {
  observacaoConclusao?: string;
  programarRetornoAutomatico?: boolean;
  retorno?: ProgramarRetornoInput;
}

export interface GrupoAtendimentosCliente {
  cliente: Cliente;
  totalCompromissos: number;
  pendentes: number;
  compromissos: Agendamento[];
}

export interface GrupoAtendimentosImovel {
  imovel: Imovel;
  totalCompromissos: number;
  pendentes: number;
  compromissos: Agendamento[];
}

export interface VisaoGeralAtendimentos {
  totalAtendimentos: number;
  totalPendentes: number;
  totalSemData: number;
  proximosCompromissos: Agendamento[];
  tarefasSemData: Agendamento[];
  porCliente: GrupoAtendimentosCliente[];
  porImovel: GrupoAtendimentosImovel[];
}

export interface AvisoItem {
  id?: number;
  tipoAviso: TipoAviso;
  titulo: string;
  mensagem: string;
  status?: 'PENDENTE' | 'DISPENSADO';
  agendamentoId?: number;
  usuarioId?: number | null;
  disparadoEm?: string;
  dispensadoEm?: string | null;
  agendamento?: Agendamento;
}

export interface ResumoAvisosProximos {
  possuiAvisos: boolean;
  mensagemBanner: string | null;
  horasAntecedencia: number;
  totalAlertas: number;
  totalProximos: number;
  totalAtrasados: number;
  totalSemData: number;
  proximos: AvisoItem[];
  atrasados: AvisoItem[];
  semData: AvisoItem[];
  alertas: AvisoItem[];
}

export interface DomusLocalState {
  usuarios: Usuario[];
  clientes: Cliente[];
  imoveis: Imovel[];
  agendamentos: Agendamento[];
  avisos: AvisoItem[];
  usuarioLogadoId: number | null;
  modoOfflineForcado: boolean;
  apiBaseUrl: string;
}

export interface FiltroAgendamentos {
  status?: StatusAgendamento;
  tipo?: TipoAgendamento;
  clienteId?: number;
  imovelId?: number;
  corretorId?: number;
  semData?: boolean;
  dataInicio?: string;
  dataFim?: string;
}

export interface FiltroClientes {
  busca?: string;
  canalPrincipalContato?: CanalContato;
}
