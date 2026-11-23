import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  Agendamento,
  Cliente,
  ConcluirAgendamentoInput,
  CreateAgendamentoInput,
  CreateClienteInput,
  CreateImovelInput,
  CreateUsuarioInput,
  FiltroAgendamentos,
  FiltroClientes,
  Imovel,
  LoginResponse,
  ProgramarRetornoInput,
  ResumoAvisosProximos,
  Usuario,
  VisaoGeralAtendimentos,
} from '../types/domus';
import { domusStorage } from './storage';

const STORAGE_KEY_TOKEN = '@domus:access_token';
const STORAGE_KEY_API_URL = '@domus:api_base_url';
const LEGACY_STORAGE_KEY_STATE = '@domus:local_state';
const MOCK_TOKEN_PREFIX = 'domus-mock-token-';
const HTTP_TIMEOUT_MS = 8000;
const PING_TIMEOUT_MS = 5000;

function parseDataBruta(dataBruta: string): { ano: number; mes: number; dia: number } | Date {
  const limpa = dataBruta.trim();
  const matchIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpa);
  if (matchIso) {
    return { ano: Number(matchIso[1]), mes: Number(matchIso[2]), dia: Number(matchIso[3]) };
  }
  const matchBr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpa);
  if (matchBr) {
    return { dia: Number(matchBr[1]), mes: Number(matchBr[2]), ano: Number(matchBr[3]) };
  }
  const fallback = new Date(limpa);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`Formato de data inválido: ${dataBruta}. Use YYYY-MM-DD ou DD/MM/YYYY`);
  }
  return fallback;
}

export function interpretarDataHora(
  data?: string | null,
  hora?: string | null,
  dataHoraIso?: string | null
): Date | null {
  if (dataHoraIso?.trim()) {
    const parsedIso = new Date(dataHoraIso.trim());
    if (Number.isNaN(parsedIso.getTime())) {
      throw new Error(`Formato de dataHora inválido: ${dataHoraIso}`);
    }
    return parsedIso;
  }

  if (!data?.trim()) {
    return null;
  }

  const parsedData = parseDataBruta(data);
  if (parsedData instanceof Date) {
    return parsedData;
  }

  const horaNormalizada = hora?.trim() ? hora.trim() : '09:00';
  const matchHora = /^(\d{1,2}):(\d{2})$/.exec(horaNormalizada);
  if (!matchHora) {
    throw new Error(`Formato de hora inválido: ${hora}. Use HH:mm`);
  }

  const { ano, mes, dia } = parsedData;
  const horas = Number(matchHora[1]);
  const minutos = Number(matchHora[2]);
  const foraDoIntervalo =
    mes < 1 || mes > 12 || dia < 1 || dia > 31 || horas < 0 || horas > 23 || minutos < 0 || minutos > 59;

  if (foraDoIntervalo) {
    throw new Error('Data ou hora fora do intervalo válido');
  }

  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const resultado = new Date(`${pad(ano, 4)}-${pad(mes)}-${pad(dia)}T${pad(horas)}:${pad(minutos)}:00.000Z`);
  if (Number.isNaN(resultado.getTime())) {
    throw new Error('Data ou hora inválida');
  }
  return resultado;
}

export function formatarDataGoogle(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function normalizarApiUrl(url?: string | null): string {
  if (!url || !url.trim()) {
    return 'http://localhost:3000/api';
  }
  const limpa = url.trim().replace(/\/+$/, '');
  if (!limpa.endsWith('/api')) {
    return `${limpa}/api`;
  }
  return limpa;
}

export function obterApiBaseUrlPadrao(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }

  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000/api`;
      }
    }
  } catch {
    // fallback seguro caso Constants nao esteja disponivel
  }

  return 'http://localhost:3000/api';
}

function extrairMensagemErro(errorBody: any, status: number, statusText: string): string {
  const raw = errorBody?.message;
  if (Array.isArray(raw)) {
    const joined = raw.filter(Boolean).join('; ');
    if (joined) return joined;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return `Erro HTTP ${status}: ${statusText || 'Falha na requisição'}`;
}

export class DomusApiService {
  private apiBaseUrl: string;
  private apiOnlineReal: boolean = false;
  private onUnauthorizedCallback?: () => void;

  constructor(config?: { baseUrl?: string }) {
    this.apiBaseUrl = normalizarApiUrl(config?.baseUrl || obterApiBaseUrlPadrao());
  }

  public get estaOnline(): boolean {
    return this.apiOnlineReal;
  }

  public get baseUrl(): string {
    return this.apiBaseUrl;
  }

  registrarOnUnauthorized(callback?: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  async inicializar(): Promise<void> {
    const urlSalva = await domusStorage.getItem<string>(STORAGE_KEY_API_URL);
    if (urlSalva && urlSalva.trim()) {
      this.apiBaseUrl = normalizarApiUrl(urlSalva);
    }

    await domusStorage.removeItem(LEGACY_STORAGE_KEY_STATE);

    const token = await domusStorage.getItem<string>(STORAGE_KEY_TOKEN);
    if (typeof token === 'string' && token.startsWith(MOCK_TOKEN_PREFIX)) {
      await domusStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }

  async configurarApiUrl(baseUrl: string): Promise<void> {
    this.apiBaseUrl = normalizarApiUrl(baseUrl);
    await domusStorage.setItem(STORAGE_KEY_API_URL, this.apiBaseUrl);
  }

  async testarConexao(
    urlTeste?: string
  ): Promise<{ ok: boolean; mensagem: string; status?: number }> {
    const alvo = normalizarApiUrl(urlTeste || this.apiBaseUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    if (timer && typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
    const isCurrentBase = alvo === this.apiBaseUrl;

    try {
      const res = await fetch(`${alvo}/avisos/proximos`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (res.status === 200 || res.status === 401) {
        if (isCurrentBase) {
          this.apiOnlineReal = true;
        }
        return {
          ok: true,
          mensagem: `API online (status ${res.status})`,
          status: res.status,
        };
      }

      if (isCurrentBase && res.status >= 502) {
        this.apiOnlineReal = false;
      }
      return {
        ok: false,
        mensagem: `API respondeu com status HTTP ${res.status}`,
        status: res.status,
      };
    } catch (err: any) {
      if (isCurrentBase) {
        this.apiOnlineReal = false;
      }
      const msg =
        err?.name === 'AbortError'
          ? 'Tempo limite excedido ao tentar conectar à API'
          : err?.message || 'Falha ao conectar com o servidor';
      return {
        ok: false,
        mensagem: msg,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async requisicaoApi<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const pathOnly = normalizedEndpoint.split('?')[0];
    const isPublic =
      pathOnly === '/auth/login' || (pathOnly === '/usuarios' && method === 'POST');

    let token: string | null = null;
    if (!isPublic) {
      const storedToken = await domusStorage.getItem<string>(STORAGE_KEY_TOKEN);
      if (typeof storedToken === 'string' && storedToken.startsWith(MOCK_TOKEN_PREFIX)) {
        await domusStorage.removeItem(STORAGE_KEY_TOKEN);
      } else {
        token = storedToken;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    if (timer && typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }

    const url = `${this.apiBaseUrl.replace(/\/$/, '')}${normalizedEndpoint}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      this.apiOnlineReal = false;
      throw new Error(
        'Não foi possível conectar à API DOMUS. Verifique se o backend está em execução e confira a URL de conexão.'
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401) {
      this.apiOnlineReal = true;
      if (!isPublic) {
        await domusStorage.removeItem(STORAGE_KEY_TOKEN);
        this.onUnauthorizedCallback?.();
      }
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        extrairMensagemErro(errorBody, res.status, res.statusText || 'Sessão inválida ou expirada')
      );
    }

    if (!res.ok) {
      this.apiOnlineReal = res.status < 502;
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(extrairMensagemErro(errorBody, res.status, res.statusText));
    }

    this.apiOnlineReal = true;
    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json().catch(() => undefined)) as T;
  }

  async login(credenciais: {
    loginOuEmail: string;
    senha: string;
  }): Promise<LoginResponse> {
    const identificador = (credenciais.loginOuEmail || '').trim();
    const senha = credenciais.senha || '';

    if (!identificador || !senha) {
      throw new Error('Informe o usuário (login/e-mail) e a senha');
    }

    const res = await this.requisicaoApi<{
      accessToken: string;
      usuario: Usuario;
    }>('/auth/login', {
      method: 'POST',
      body: {
        login: identificador,
        senha,
      },
    });

    if (!res?.accessToken || !res?.usuario) {
      throw new Error('Resposta inválida do servidor de autenticação.');
    }

    await domusStorage.setItem(STORAGE_KEY_TOKEN, res.accessToken);
    return {
      accessToken: res.accessToken,
      usuario: res.usuario,
    };
  }

  async logout(): Promise<void> {
    await domusStorage.removeItem(STORAGE_KEY_TOKEN);
    await domusStorage.removeItem(LEGACY_STORAGE_KEY_STATE);
  }

  async obterUsuarioLogado(): Promise<Usuario | null> {
    const token = await domusStorage.getItem<string>(STORAGE_KEY_TOKEN);
    if (!token) {
      return null;
    }
    if (typeof token === 'string' && token.startsWith(MOCK_TOKEN_PREFIX)) {
      await domusStorage.removeItem(STORAGE_KEY_TOKEN);
      return null;
    }

    return this.requisicaoApi<Usuario>('/auth/me');
  }

  async cadastrarUsuario(input: CreateUsuarioInput): Promise<Usuario> {
    const nome = (input.nome || '').trim();
    const login = (input.login || '').trim().toLowerCase();
    const email = (input.email || '').trim().toLowerCase();
    const senha = input.senha || '';

    if (!nome || !login || !email || !senha) {
      throw new Error('Nome, login, e-mail e senha são obrigatórios');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    if (input.confirmarSenha !== undefined && input.confirmarSenha !== senha) {
      throw new Error('A confirmação da senha não confere com a senha informada');
    }

    const payload: CreateUsuarioInput = {
      nome,
      login,
      email,
      senha,
      perfis: input.perfis && input.perfis.length > 0 ? input.perfis : ['CORRETOR'],
    };

    if (input.confirmarSenha !== undefined) {
      payload.confirmarSenha = input.confirmarSenha;
    }

    const cpfLimpo = input.cpf ? input.cpf.replace(/\D/g, '') : '';
    if (cpfLimpo) {
      payload.cpf = cpfLimpo;
    }

    return this.requisicaoApi<Usuario>('/usuarios', {
      method: 'POST',
      body: payload,
    });
  }

  async listarClientes(filtros?: FiltroClientes): Promise<Cliente[]> {
    const params = new URLSearchParams();
    if (filtros?.busca) params.append('busca', filtros.busca);
    if (filtros?.canalPrincipalContato) {
      params.append('canalPrincipalContato', filtros.canalPrincipalContato);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requisicaoApi<Cliente[]>(`/clientes${query}`);
  }

  async criarCliente(input: CreateClienteInput): Promise<Cliente> {
    const nome = (input.nomeCompleto || '').trim();
    if (!nome) {
      throw new Error('O nome completo do cliente é obrigatório');
    }

    const docLimpo = (input.cpfDocumento || '').replace(/\D/g, '');
    if (!docLimpo || (docLimpo.length !== 11 && docLimpo.length !== 14)) {
      throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para o cliente');
    }

    return this.requisicaoApi<Cliente>('/clientes', {
      method: 'POST',
      body: input,
    });
  }

  async vincularImoveisInteresse(clienteId: number, imovelIds: number[]): Promise<Cliente> {
    return this.requisicaoApi<Cliente>(`/clientes/${clienteId}/imoveis-interesse`, {
      method: 'POST',
      body: { imovelIds },
    });
  }

  async listarImoveis(filtros?: {
    finalidade?: string;
    tipoImovel?: string;
    statusImovel?: string;
    bairro?: string;
  }): Promise<Imovel[]> {
    const params = new URLSearchParams();
    if (filtros?.finalidade) params.append('finalidade', filtros.finalidade);
    if (filtros?.tipoImovel) params.append('tipoImovel', filtros.tipoImovel);
    if (filtros?.statusImovel) params.append('statusImovel', filtros.statusImovel);
    if (filtros?.bairro) params.append('bairro', filtros.bairro);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requisicaoApi<Imovel[]>(`/imoveis${query}`);
  }

  async criarImovel(input: CreateImovelInput): Promise<Imovel> {
    const endereco = (input.endereco || '').trim();
    if (!endereco) {
      throw new Error('O endereço do imóvel é obrigatório');
    }

    return this.requisicaoApi<Imovel>('/imoveis', {
      method: 'POST',
      body: input,
    });
  }

  async listarAgendamentos(filtros?: FiltroAgendamentos): Promise<Agendamento[]> {
    const params = new URLSearchParams();
    if (filtros?.clienteId) params.append('clienteId', String(filtros.clienteId));
    if (filtros?.imovelId) params.append('imovelId', String(filtros.imovelId));
    if (filtros?.corretorId) params.append('corretorId', String(filtros.corretorId));
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.semData) params.append('semDataRetorno', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requisicaoApi<Agendamento[]>(`/agendamentos${query}`);
  }

  async obterVisaoGeral(corretorId?: number): Promise<VisaoGeralAtendimentos> {
    const query = corretorId ? `?corretorId=${corretorId}` : '';
    return this.requisicaoApi<VisaoGeralAtendimentos>(`/agendamentos/visao-geral${query}`);
  }

  async criarAgendamento(input: CreateAgendamentoInput): Promise<Agendamento> {
    const tipo = input.tipo || 'ATENDIMENTO';
    const titulo = (input.titulo || '').trim();

    if (!titulo) {
      throw new Error('O título do agendamento é obrigatório');
    }

    if (tipo === 'VISITA' && !input.imovelId) {
      throw new Error(
        'Para agendar uma visita (tipo VISITA), é obrigatório selecionar um imóvel cadastrado (imovelId)'
      );
    }

    const dataHoraInterpretada = interpretarDataHora(input.data, input.hora, input.dataHoraIso);

    if (tipo === 'VISITA' && !dataHoraInterpretada) {
      throw new Error(
        'Para agendar uma visita (tipo VISITA), é obrigatório informar a data e hora do compromisso'
      );
    }

    return this.requisicaoApi<Agendamento>('/agendamentos', {
      method: 'POST',
      body: input,
    });
  }

  async programarRetorno(
    agendamentoId: number,
    input: ProgramarRetornoInput
  ): Promise<Agendamento> {
    const dataHoraInterpretada = interpretarDataHora(input.data, input.hora, input.dataHoraIso);
    if (!dataHoraInterpretada) {
      throw new Error('Para programar um retorno, informe a data e hora do compromisso');
    }

    return this.requisicaoApi<Agendamento>(`/agendamentos/${agendamentoId}/programar-retorno`, {
      method: 'POST',
      body: input,
    });
  }

  async concluirAgendamento(
    agendamentoId: number,
    input?: ConcluirAgendamentoInput
  ): Promise<Agendamento> {
    return this.requisicaoApi<Agendamento>(`/agendamentos/${agendamentoId}/concluir`, {
      method: 'PATCH',
      body: {
        observacao: (input?.observacao || input?.observacaoConclusao)?.trim() || undefined,
        proximaAcao: input?.proximaAcao?.trim() || undefined,
        dataRetorno: input?.dataRetorno?.trim() || undefined,
        gerarAgendamentoRetorno:
          typeof input?.gerarAgendamentoRetorno === 'boolean'
            ? input.gerarAgendamentoRetorno
            : input?.programarRetornoAutomatico,
      },
    });
  }

  async sincronizarGoogleCalendar(
    agendamentoId: number
  ): Promise<{ googleCalendarEventId: string; googleCalendarUrl: string; agendamento: Agendamento }> {
    return this.requisicaoApi<{
      googleCalendarEventId: string;
      googleCalendarUrl: string;
      agendamento: Agendamento;
    }>(`/agendamentos/${agendamentoId}/sincronizar-google-calendar`, {
      method: 'POST',
    });
  }

  async obterAvisosProximos(horasAntecedencia = 48): Promise<ResumoAvisosProximos> {
    return this.requisicaoApi<ResumoAvisosProximos>(
      `/avisos/proximos?horasAntecedencia=${horasAntecedencia}`
    );
  }

  async dispararAvisos(horasAntecedencia = 48): Promise<ResumoAvisosProximos> {
    return this.requisicaoApi<ResumoAvisosProximos>('/avisos/disparar', {
      method: 'POST',
      body: { horasAntecedencia },
    });
  }

  async dispensarAviso(avisoId: number): Promise<void> {
    await this.requisicaoApi(`/avisos/${avisoId}/dispensar`, {
      method: 'PATCH',
    });
  }
}

export const domusApi = new DomusApiService();
