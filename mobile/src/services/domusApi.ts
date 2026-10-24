import { MENSAGEM_BANNER_AVISOS } from '../theme/tokens';
import {
  Agendamento,
  AvisoItem,
  CanalContato,
  Cliente,
  ConcluirAgendamentoInput,
  CreateAgendamentoInput,
  CreateClienteInput,
  CreateImovelInput,
  CreateUsuarioInput,
  DomusLocalState,
  FiltroAgendamentos,
  FiltroClientes,
  Imovel,
  ProgramarRetornoInput,
  ResumoAvisosProximos,
  TipoAviso,
  Usuario,
  VisaoGeralAtendimentos,
} from '../types/domus';
import { criarEstadoSeedJunior } from './seedData';
import { domusStorage } from './storage';

const STORAGE_KEY_STATE = '@domus:local_state';
const STORAGE_KEY_TOKEN = '@domus:access_token';
const HTTP_TIMEOUT_MS = 2500;

export function interpretarDataHora(
  data?: string | null,
  hora?: string | null,
  dataHoraIso?: string | null
): Date | null {
  if (dataHoraIso && dataHoraIso.trim()) {
    const d = new Date(dataHoraIso.trim());
    if (isNaN(d.getTime())) {
      throw new Error(`Formato de dataHora inválido: ${dataHoraIso}`);
    }
    return d;
  }

  if (!data || !data.trim()) {
    return null;
  }

  const dataLimpa = data.trim();
  const horaLimpa = hora && hora.trim() ? hora.trim() : '09:00';

  let ano: number;
  let mes: number;
  let dia: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) {
    const partes = dataLimpa.split('-').map(Number);
    [ano, mes, dia] = partes;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataLimpa)) {
    const partes = dataLimpa.split('/').map(Number);
    [dia, mes, ano] = partes;
  } else {
    const tentativa = new Date(dataLimpa);
    if (isNaN(tentativa.getTime())) {
      throw new Error(`Formato de data inválido: ${data}. Use YYYY-MM-DD ou DD/MM/YYYY`);
    }
    return tentativa;
  }

  const matchHora = /^(\d{1,2}):(\d{2})$/.exec(horaLimpa);
  if (!matchHora) {
    throw new Error(`Formato de hora inválido: ${hora}. Use HH:mm`);
  }

  const horas = Number(matchHora[1]);
  const minutos = Number(matchHora[2]);

  if (
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31 ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    throw new Error('Data ou hora fora do intervalo válido');
  }

  const isoString = `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(
    dia
  ).padStart(2, '0')}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00.000Z`;

  const resultado = new Date(isoString);
  if (isNaN(resultado.getTime())) {
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

export class DomusApiService {
  private apiBaseUrl: string;
  private forcarOffline: boolean;
  private memoriaSenhas = new Map<string, string>();

  constructor(config?: { baseUrl?: string; forcarOffline?: boolean }) {
    this.apiBaseUrl = config?.baseUrl || 'http://localhost:3000/api';
    this.forcarOffline = config?.forcarOffline ?? false;
    this.memoriaSenhas.set('junior.corretor', 'Domus@2026');
    this.memoriaSenhas.set('junior@domus.com.br', 'Domus@2026');
  }

  public get isOffline(): boolean {
    return this.forcarOffline;
  }

  public get baseUrl(): string {
    return this.apiBaseUrl;
  }

  async configurarModo(opcoes: { baseUrl?: string; forcarOffline?: boolean }): Promise<void> {
    if (opcoes.baseUrl !== undefined) {
      this.apiBaseUrl = opcoes.baseUrl;
    }
    if (opcoes.forcarOffline !== undefined) {
      this.forcarOffline = opcoes.forcarOffline;
    }
    const estado = await this.carregarEstado();
    estado.apiBaseUrl = this.apiBaseUrl;
    estado.modoOfflineForcado = this.forcarOffline;
    await this.salvarEstado(estado);
  }

  private async carregarEstado(): Promise<DomusLocalState> {
    const estadoSalvo = await domusStorage.getItem<DomusLocalState>(STORAGE_KEY_STATE);
    if (!estadoSalvo || !estadoSalvo.usuarios || estadoSalvo.usuarios.length === 0) {
      const inicial = criarEstadoSeedJunior();
      inicial.apiBaseUrl = this.apiBaseUrl;
      inicial.modoOfflineForcado = this.forcarOffline;
      await domusStorage.setItem(STORAGE_KEY_STATE, inicial);
      return inicial;
    }
    return estadoSalvo;
  }

  private async salvarEstado(estado: DomusLocalState): Promise<void> {
    await domusStorage.setItem(STORAGE_KEY_STATE, estado);
  }

  private async requisicaoApi<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const token = await domusStorage.getItem<string>(STORAGE_KEY_TOKEN);
      const url = `${this.apiBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Erro HTTP ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private async executarHibrido<T>(
    chamadaApi: () => Promise<T>,
    fallbackLocal: (estado: DomusLocalState) => Promise<T>
  ): Promise<T> {
    if (this.forcarOffline) {
      const estado = await this.carregarEstado();
      return fallbackLocal(estado);
    }

    try {
      return await chamadaApi();
    } catch {
      const estado = await this.carregarEstado();
      return fallbackLocal(estado);
    }
  }

  async login(credenciais: {
    loginOuEmail: string;
    senha: string;
  }): Promise<{ accessToken: string; usuario: Usuario; modoOffline: boolean }> {
    const identificador = (credenciais.loginOuEmail || '').trim();
    const senha = credenciais.senha || '';

    if (!identificador || !senha) {
      throw new Error('Informe o usuário (login/email) e a senha');
    }

    return this.executarHibrido<{ accessToken: string; usuario: Usuario; modoOffline: boolean }>(
      async () => {
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
        await domusStorage.setItem(STORAGE_KEY_TOKEN, res.accessToken);
        return {
          ...res,
          modoOffline: false,
        };
      },
      async (estado) => {
        const idLower = identificador.toLowerCase();
        const usuario = estado.usuarios.find(
          (u) =>
            u.login.toLowerCase() === idLower ||
            u.email.toLowerCase() === idLower ||
            (u.cpf && u.cpf.replace(/\D/g, '') === identificador.replace(/\D/g, ''))
        );

        if (!usuario || !usuario.ativo) {
          throw new Error('Credenciais inválidas ou usuário inativo');
        }

        const senhaCadastrada =
          this.memoriaSenhas.get(usuario.login.toLowerCase()) ||
          this.memoriaSenhas.get(usuario.email.toLowerCase());

        if (senhaCadastrada && senhaCadastrada !== senha) {
          throw new Error('Credenciais inválidas ou usuário inativo');
        }

        usuario.ultimoLogin = new Date().toISOString();
        estado.usuarioLogadoId = usuario.id;
        await this.salvarEstado(estado);

        const tokenMock = `domus-mock-token-user-${usuario.id}-${Date.now()}`;
        await domusStorage.setItem(STORAGE_KEY_TOKEN, tokenMock);

        return {
          accessToken: tokenMock,
          usuario,
          modoOffline: true,
        };
      }
    );
  }

  obterModoOffline(): boolean {
    return this.forcarOffline;
  }

  async logout(): Promise<void> {
    await domusStorage.removeItem(STORAGE_KEY_TOKEN);
    const estado = await this.carregarEstado();
    estado.usuarioLogadoId = null;
    await this.salvarEstado(estado);
  }

  async obterUsuarioLogado(): Promise<Usuario | null> {
    const estado = await this.carregarEstado();
    if (!estado.usuarioLogadoId) {
      return null;
    }
    const user = estado.usuarios.find((u) => u.id === estado.usuarioLogadoId);
    return user || null;
  }

  async cadastrarUsuario(input: CreateUsuarioInput): Promise<Usuario> {
    const nome = (input.nome || '').trim();
    const login = (input.login || '').trim().toLowerCase();
    const email = (input.email || '').trim().toLowerCase();
    const senha = input.senha || '';

    if (!nome || !login || !email || !senha) {
      throw new Error('Nome, login, e-mail e senha são obrigatórios');
    }

    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Usuario>('/usuarios', {
          method: 'POST',
          body: input,
        });
      },
      async (estado) => {
        const loginOuEmailExiste = estado.usuarios.some(
          (u) => u.login.toLowerCase() === login || u.email.toLowerCase() === email
        );
        if (loginOuEmailExiste) {
          throw new Error('Já existe um usuário cadastrado com este login ou e-mail');
        }

        const idNovo =
          estado.usuarios.length > 0 ? Math.max(...estado.usuarios.map((u) => u.id)) + 1 : 1;

        const perfisArray = Array.isArray(input.perfis)
          ? input.perfis
          : typeof input.perfis === 'string'
          ? input.perfis.split(',').map((p) => p.trim())
          : ['CORRETOR'];

        const novoUsuario: Usuario = {
          id: idNovo,
          nome,
          login,
          email,
          cpf: input.cpf ? input.cpf.replace(/\D/g, '') : null,
          perfis: perfisArray,
          ativo: true,
          ultimoLogin: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };

        this.memoriaSenhas.set(login, senha);
        this.memoriaSenhas.set(email, senha);

        estado.usuarios.push(novoUsuario);
        await this.salvarEstado(estado);
        return novoUsuario;
      }
    );
  }

  async listarClientes(filtros?: FiltroClientes): Promise<Cliente[]> {
    return this.executarHibrido(
      async () => {
        const params = new URLSearchParams();
        if (filtros?.busca) params.append('busca', filtros.busca);
        if (filtros?.canalPrincipalContato)
          params.append('canalPrincipalContato', filtros.canalPrincipalContato);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.requisicaoApi<Cliente[]>(`/clientes${query}`);
      },
      async (estado) => {
        let lista = [...estado.clientes];
        if (filtros?.busca && filtros.busca.trim()) {
          const termo = filtros.busca.trim().toLowerCase();
          lista = lista.filter(
            (c) =>
              c.nomeCompleto.toLowerCase().includes(termo) ||
              c.cpfDocumento.includes(termo) ||
              (c.email && c.email.toLowerCase().includes(termo)) ||
              c.telefone.includes(termo)
          );
        }
        if (filtros?.canalPrincipalContato) {
          lista = lista.filter((c) => c.canalPrincipalContato === filtros.canalPrincipalContato);
        }
        return lista;
      }
    );
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

    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Cliente>('/clientes', {
          method: 'POST',
          body: input,
        });
      },
      async (estado) => {
        const existente = estado.clientes.find((c) => c.cpfDocumento === docLimpo);
        if (existente) {
          throw new Error(`Já existe um cliente cadastrado com o documento ${docLimpo}`);
        }

        const idsImoveis = input.imoveisInteresseIds || input.imovelInteresseIds || [];
        const imoveisEncontrados: Imovel[] = [];
        for (const imovelId of idsImoveis) {
          const im = estado.imoveis.find((i) => i.id === imovelId);
          if (!im) {
            throw new Error(`Imóvel de interesse com ID ${imovelId} não encontrado`);
          }
          imoveisEncontrados.push(im);
        }

        const idNovo =
          estado.clientes.length > 0 ? Math.max(...estado.clientes.map((c) => c.id)) + 1 : 1;

        const novoCliente: Cliente = {
          id: idNovo,
          nomeCompleto: nome,
          cpfDocumento: docLimpo,
          tipoDocumento: input.tipoDocumento || (docLimpo.length === 14 ? 'CNPJ' : 'CPF'),
          telefone: (input.telefone || '').trim(),
          celular: input.celular ? input.celular.trim() : input.telefone ? input.telefone.trim() : null,
          email: input.email ? input.email.trim().toLowerCase() : null,
          canalPrincipalContato: input.canalPrincipalContato || 'WHATSAPP',
          observacoes: input.observacoes ? input.observacoes.trim() : null,
          imoveisInteresse: imoveisEncontrados,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };

        estado.clientes.push(novoCliente);
        await this.salvarEstado(estado);
        return novoCliente;
      }
    );
  }

  async vincularImoveisInteresse(clienteId: number, imovelIds: number[]): Promise<Cliente> {
    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Cliente>(`/clientes/${clienteId}/imoveis-interesse`, {
          method: 'POST',
          body: { imovelIds },
        });
      },
      async (estado) => {
        const cliente = estado.clientes.find((c) => c.id === clienteId);
        if (!cliente) {
          throw new Error(`Cliente com ID ${clienteId} não encontrado`);
        }

        const imoveisAtuais = cliente.imoveisInteresse ? [...cliente.imoveisInteresse] : [];
        for (const id of imovelIds) {
          const imovel = estado.imoveis.find((i) => i.id === id);
          if (!imovel) {
            throw new Error(`Imóvel com ID ${id} não encontrado`);
          }
          if (!imoveisAtuais.some((item) => item.id === id)) {
            imoveisAtuais.push(imovel);
          }
        }

        cliente.imoveisInteresse = imoveisAtuais;
        cliente.atualizadoEm = new Date().toISOString();
        await this.salvarEstado(estado);
        return cliente;
      }
    );
  }

  async listarImoveis(filtros?: {
    finalidade?: string;
    tipoImovel?: string;
    statusImovel?: string;
    bairro?: string;
  }): Promise<Imovel[]> {
    return this.executarHibrido(
      async () => {
        const params = new URLSearchParams();
        if (filtros?.finalidade) params.append('finalidade', filtros.finalidade);
        if (filtros?.tipoImovel) params.append('tipoImovel', filtros.tipoImovel);
        if (filtros?.statusImovel) params.append('statusImovel', filtros.statusImovel);
        if (filtros?.bairro) params.append('bairro', filtros.bairro);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.requisicaoApi<Imovel[]>(`/imoveis${query}`);
      },
      async (estado) => {
        let lista = [...estado.imoveis];
        if (filtros?.finalidade) {
          lista = lista.filter((i) => i.finalidade === filtros.finalidade);
        }
        if (filtros?.tipoImovel) {
          lista = lista.filter((i) => i.tipoImovel === filtros.tipoImovel);
        }
        if (filtros?.statusImovel) {
          lista = lista.filter((i) => i.statusImovel === filtros.statusImovel);
        }
        if (filtros?.bairro) {
          const bairroTermo = filtros.bairro.toLowerCase();
          lista = lista.filter((i) => i.bairro && i.bairro.toLowerCase().includes(bairroTermo));
        }
        return lista;
      }
    );
  }

  async criarImovel(input: CreateImovelInput): Promise<Imovel> {
    const endereco = (input.endereco || '').trim();
    if (!endereco) {
      throw new Error('O endereço do imóvel é obrigatório');
    }

    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Imovel>('/imoveis', {
          method: 'POST',
          body: input,
        });
      },
      async (estado) => {
        const inscricao = input.numeroInscricao ? input.numeroInscricao.trim() : null;
        if (inscricao) {
          const duplicado = estado.imoveis.find((i) => i.numeroInscricao === inscricao);
          if (duplicado) {
            throw new Error(
              `Já existe um imóvel cadastrado com o número de inscrição ${inscricao}`
            );
          }
        }

        const idNovo =
          estado.imoveis.length > 0 ? Math.max(...estado.imoveis.map((i) => i.id)) + 1 : 1;

        const posicoesVal = Array.isArray(input.posicoes)
          ? input.posicoes
          : typeof input.posicoes === 'string'
          ? input.posicoes.split(',').map((p) => p.trim())
          : null;

        const novoImovel: Imovel = {
          id: idNovo,
          numeroInscricao: inscricao,
          tipoImovel: input.tipoImovel || 'APARTAMENTO',
          finalidade: input.finalidade || 'VENDA',
          cep: input.cep ? input.cep.trim() : null,
          endereco,
          bairro: input.bairro ? input.bairro.trim() : null,
          numero: input.numero ? input.numero.trim() : null,
          complemento: input.complemento ? input.complemento.trim() : null,
          areaTotal: input.areaTotal ?? null,
          comodos: input.comodos ?? 1,
          banheiros: input.banheiros ?? 1,
          valor: input.valor ?? 0,
          posicoes: posicoesVal,
          statusImovel: input.statusImovel || 'DISPONIVEL',
          proprietarioId: input.proprietarioId ?? null,
          corretorCaptadorId: input.corretorCaptadorId ?? 1,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };

        estado.imoveis.push(novoImovel);
        await this.salvarEstado(estado);
        return novoImovel;
      }
    );
  }

  async listarAgendamentos(filtros?: FiltroAgendamentos): Promise<Agendamento[]> {
    return this.executarHibrido(
      async () => {
        const params = new URLSearchParams();
        if (filtros?.clienteId) params.append('clienteId', String(filtros.clienteId));
        if (filtros?.imovelId) params.append('imovelId', String(filtros.imovelId));
        if (filtros?.corretorId) params.append('corretorId', String(filtros.corretorId));
        if (filtros?.tipo) params.append('tipo', filtros.tipo);
        if (filtros?.status) params.append('status', filtros.status);
        if (filtros?.semData) params.append('semDataRetorno', 'true');
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.requisicaoApi<Agendamento[]>(`/agendamentos${query}`);
      },
      async (estado) => {
        let lista = [...estado.agendamentos];
        if (filtros?.clienteId !== undefined) {
          lista = lista.filter((a) => a.clienteId === filtros.clienteId);
        }
        if (filtros?.imovelId !== undefined) {
          lista = lista.filter((a) => a.imovelId === filtros.imovelId);
        }
        if (filtros?.corretorId !== undefined) {
          lista = lista.filter((a) => a.corretorId === filtros.corretorId);
        }
        if (filtros?.tipo) {
          lista = lista.filter((a) => a.tipo === filtros.tipo);
        }
        if (filtros?.status) {
          lista = lista.filter((a) => a.status === filtros.status);
        }
        if (filtros?.semData) {
          lista = lista.filter(
            (a) =>
              !a.dataHora &&
              !a.dataRetorno &&
              (a.status === 'PENDENTE' || a.status === 'CONFIRMADO')
          );
        }
        return lista.sort((a, b) => {
          if (!a.dataHora && !b.dataHora) return 0;
          if (!a.dataHora) return 1;
          if (!b.dataHora) return -1;
          return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
        });
      }
    );
  }

  async obterVisaoGeral(corretorId?: number): Promise<VisaoGeralAtendimentos> {
    return this.executarHibrido(
      async () => {
        const query = corretorId ? `?corretorId=${corretorId}` : '';
        return this.requisicaoApi<VisaoGeralAtendimentos>(`/agendamentos/visao-geral${query}`);
      },
      async (estado) => {
        const agendamentosCorretor = estado.agendamentos.filter((a) =>
          corretorId !== undefined ? a.corretorId === corretorId : true
        );

        const proximosCompromissos = agendamentosCorretor.filter(
          (a) =>
            (a.status === 'PENDENTE' || a.status === 'CONFIRMADO') &&
            Boolean(a.dataHora || a.dataRetorno)
        );

        const tarefasSemData = agendamentosCorretor.filter(
          (a) =>
            (a.status === 'PENDENTE' || a.status === 'CONFIRMADO') &&
            !a.dataHora &&
            !a.dataRetorno
        );

        const mapaPorCliente = new Map<number, { cliente: Cliente; compromissos: Agendamento[] }>();
        const mapaPorImovel = new Map<number, { imovel: Imovel; compromissos: Agendamento[] }>();

        for (const item of agendamentosCorretor) {
          const cliente = estado.clientes.find((c) => c.id === item.clienteId);
          if (cliente) {
            const entry = mapaPorCliente.get(cliente.id) || {
              cliente,
              compromissos: [],
            };
            entry.compromissos.push(item);
            mapaPorCliente.set(cliente.id, entry);
          }

          if (item.imovelId) {
            const imovel = estado.imoveis.find((i) => i.id === item.imovelId);
            if (imovel) {
              const entry = mapaPorImovel.get(imovel.id) || {
                imovel,
                compromissos: [],
              };
              entry.compromissos.push(item);
              mapaPorImovel.set(imovel.id, entry);
            }
          }
        }

        const porCliente = Array.from(mapaPorCliente.values()).map((entry) => ({
          cliente: entry.cliente,
          totalCompromissos: entry.compromissos.length,
          pendentes: entry.compromissos.filter(
            (c) => c.status === 'PENDENTE' || c.status === 'CONFIRMADO'
          ).length,
          compromissos: entry.compromissos,
        }));

        const porImovel = Array.from(mapaPorImovel.values()).map((entry) => ({
          imovel: entry.imovel,
          totalCompromissos: entry.compromissos.length,
          pendentes: entry.compromissos.filter(
            (c) => c.status === 'PENDENTE' || c.status === 'CONFIRMADO'
          ).length,
          compromissos: entry.compromissos,
        }));

        return {
          totalAtendimentos: agendamentosCorretor.length,
          totalPendentes: proximosCompromissos.length + tarefasSemData.length,
          totalSemData: tarefasSemData.length,
          proximosCompromissos,
          tarefasSemData,
          porCliente,
          porImovel,
        };
      }
    );
  }

  private validarConflitoHorario(
    existentes: Agendamento[],
    novo: {
      corretorId?: number | null;
      dataHora: Date;
      duracaoMinutos: number;
      ignorarId?: number;
    }
  ): void {
    const inicioNovo = novo.dataHora.getTime();
    const fimNovo = inicioNovo + novo.duracaoMinutos * 60_000;

    for (const ag of existentes) {
      if (novo.ignorarId && ag.id === novo.ignorarId) continue;
      if (ag.corretorId !== novo.corretorId) continue;
      if (ag.status !== 'PENDENTE' && ag.status !== 'CONFIRMADO') continue;
      if (!ag.dataHora) continue;

      const inicioAg = new Date(ag.dataHora).getTime();
      const fimAg = inicioAg + (ag.duracaoMinutos || 60) * 60_000;

      if (inicioNovo < fimAg && fimNovo > inicioAg) {
        throw new Error(
          `Conflito de agenda: o corretor já possui o compromisso "${ag.titulo}" agendado neste horário`
        );
      }
    }
  }

  private gerarDadosGoogleCalendar(params: {
    id: number;
    titulo: string;
    descricao?: string | null;
    dataHora: Date;
    duracaoMinutos: number;
    clienteNome?: string;
    imovelEndereco?: string;
  }): { googleCalendarEventId: string; googleCalendarUrl: string } {
    const inicio = params.dataHora;
    const fim = new Date(inicio.getTime() + params.duracaoMinutos * 60_000);
    const eventId = `domus-evt-${params.id}`;

    const detalhes = [
      params.descricao ? `Descrição: ${params.descricao}` : null,
      params.clienteNome ? `Cliente: ${params.clienteNome}` : null,
      params.imovelEndereco ? `Imóvel: ${params.imovelEndereco}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const searchParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[DOMUS] ${params.titulo}`,
      dates: `${formatarDataGoogle(inicio)}/${formatarDataGoogle(fim)}`,
      details: detalhes,
      ...(params.imovelEndereco ? { location: params.imovelEndereco } : {}),
    });

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
    return { googleCalendarEventId: eventId, googleCalendarUrl };
  }

  async criarAgendamento(input: CreateAgendamentoInput): Promise<Agendamento> {
    const tipo = input.tipo || 'ATENDIMENTO';
    const status = input.status || 'PENDENTE';
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

    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Agendamento>('/agendamentos', {
          method: 'POST',
          body: input,
        });
      },
      async (estado) => {
        const cliente = estado.clientes.find((c) => c.id === input.clienteId);
        if (!cliente) {
          throw new Error(`Cliente com ID ${input.clienteId} não encontrado`);
        }

        const imovel = input.imovelId
          ? estado.imoveis.find((i) => i.id === input.imovelId) || null
          : null;

        const corretorId = input.corretorId || estado.usuarioLogadoId || 1;
        const duracaoMinutos = input.duracaoMinutos && input.duracaoMinutos > 0 ? input.duracaoMinutos : 60;

        if (dataHoraInterpretada && (status === 'PENDENTE' || status === 'CONFIRMADO')) {
          this.validarConflitoHorario(estado.agendamentos, {
            corretorId,
            dataHora: dataHoraInterpretada,
            duracaoMinutos,
          });
        }

        const idNovo =
          estado.agendamentos.length > 0
            ? Math.max(...estado.agendamentos.map((a) => a.id)) + 1
            : 1;

        const dataHoraIso = dataHoraInterpretada ? dataHoraInterpretada.toISOString() : null;
        const dataRetornoIso = input.dataRetorno
          ? interpretarDataHora(null, null, input.dataRetorno)?.toISOString() || null
          : tipo === 'RETORNO'
          ? dataHoraIso
          : null;

        let googleCalendarEventId: string | null = null;
        let googleCalendarUrl: string | null = null;

        if (input.sincronizarGoogleCalendar && dataHoraInterpretada) {
          const syncDados = this.gerarDadosGoogleCalendar({
            id: idNovo,
            titulo,
            descricao: input.descricao || input.proximaAcao,
            dataHora: dataHoraInterpretada,
            duracaoMinutos,
            clienteNome: cliente.nomeCompleto,
            imovelEndereco: imovel?.endereco,
          });
          googleCalendarEventId = syncDados.googleCalendarEventId;
          googleCalendarUrl = syncDados.googleCalendarUrl;
        }

        const novo: Agendamento = {
          id: idNovo,
          titulo,
          descricao: input.descricao ? input.descricao.trim() : null,
          descricaoCurta: input.descricaoCurta ? input.descricaoCurta.trim() : titulo.slice(0, 80),
          tipo,
          status,
          dataHora: dataHoraIso,
          duracaoMinutos,
          observacao: input.observacao ? input.observacao.trim() : null,
          canalContato: input.canalContato || cliente.canalPrincipalContato,
          proximaAcao: input.proximaAcao ? input.proximaAcao.trim() : null,
          dataRetorno: dataRetornoIso,
          sincronizarGoogleCalendar: Boolean(input.sincronizarGoogleCalendar),
          googleCalendarEventId,
          googleCalendarUrl,
          clienteId: cliente.id,
          imovelId: imovel ? imovel.id : null,
          corretorId,
          agendamentoOrigemId: input.agendamentoOrigemId ?? null,
          cliente: { ...cliente, imoveisInteresse: undefined },
          imovel: imovel ? { ...imovel } : null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };

        estado.agendamentos.push(novo);
        await this.salvarEstado(estado);
        return novo;
      }
    );
  }

  async programarRetorno(
    agendamentoId: number,
    input: ProgramarRetornoInput
  ): Promise<Agendamento> {
    const dataHoraInterpretada = interpretarDataHora(input.data, input.hora, input.dataHoraIso);
    if (!dataHoraInterpretada) {
      throw new Error('Para programar um retorno, informe a data e hora do compromisso');
    }

    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Agendamento>(`/agendamentos/${agendamentoId}/retorno`, {
          method: 'POST',
          body: input,
        });
      },
      async (estado) => {
        const origem = estado.agendamentos.find((a) => a.id === agendamentoId);
        if (!origem) {
          throw new Error(`Agendamento de origem com ID ${agendamentoId} não encontrado`);
        }

        const duracaoMinutos = input.duracaoMinutos ?? 30;
        this.validarConflitoHorario(estado.agendamentos, {
          corretorId: origem.corretorId,
          dataHora: dataHoraInterpretada,
          duracaoMinutos,
        });

        const idNovo =
          estado.agendamentos.length > 0
            ? Math.max(...estado.agendamentos.map((a) => a.id)) + 1
            : 1;

        const titulo = (input.titulo || `Retorno de ${origem.titulo}`).trim();
        const dataHoraIso = dataHoraInterpretada.toISOString();

        let googleCalendarEventId: string | null = null;
        let googleCalendarUrl: string | null = null;

        if (input.sincronizarGoogleCalendar) {
          const syncDados = this.gerarDadosGoogleCalendar({
            id: idNovo,
            titulo,
            descricao: input.observacao || origem.proximaAcao,
            dataHora: dataHoraInterpretada,
            duracaoMinutos,
            clienteNome: origem.cliente?.nomeCompleto,
            imovelEndereco: origem.imovel?.endereco,
          });
          googleCalendarEventId = syncDados.googleCalendarEventId;
          googleCalendarUrl = syncDados.googleCalendarUrl;
        }

        const novoRetorno: Agendamento = {
          id: idNovo,
          titulo,
          descricao: input.observacao || origem.descricao,
          descricaoCurta: titulo.slice(0, 80),
          tipo: 'RETORNO',
          status: 'PENDENTE',
          dataHora: dataHoraIso,
          duracaoMinutos,
          observacao: input.observacao || null,
          canalContato: input.canalContato || origem.canalContato,
          proximaAcao: origem.proximaAcao,
          dataRetorno: dataHoraIso,
          sincronizarGoogleCalendar: Boolean(input.sincronizarGoogleCalendar),
          googleCalendarEventId,
          googleCalendarUrl,
          clienteId: origem.clienteId,
          imovelId: origem.imovelId,
          corretorId: origem.corretorId,
          agendamentoOrigemId: origem.id,
          cliente: origem.cliente,
          imovel: origem.imovel,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };

        estado.agendamentos.push(novoRetorno);
        await this.salvarEstado(estado);
        return novoRetorno;
      }
    );
  }

  async concluirAgendamento(
    agendamentoId: number,
    input?: ConcluirAgendamentoInput
  ): Promise<Agendamento> {
    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<Agendamento>(`/agendamentos/${agendamentoId}/concluir`, {
          method: 'PATCH',
          body: input || {},
        });
      },
      async (estado) => {
        const agendamento = estado.agendamentos.find((a) => a.id === agendamentoId);
        if (!agendamento) {
          throw new Error(`Agendamento com ID ${agendamentoId} não encontrado`);
        }

        agendamento.status = 'CONCLUIDO';
        if (input?.observacaoConclusao) {
          agendamento.observacao = [agendamento.observacao, input.observacaoConclusao.trim()]
            .filter(Boolean)
            .join(' | ');
        }
        agendamento.atualizadoEm = new Date().toISOString();

        // Baixa avisos pendentes vinculados ao agendamento
        estado.avisos = estado.avisos.map((av) =>
          av.agendamentoId === agendamentoId
            ? { ...av, status: 'DISPENSADO' as const, dispensadoEm: new Date().toISOString() }
            : av
        );

        await this.salvarEstado(estado);
        return agendamento;
      }
    );
  }

  async sincronizarGoogleCalendar(
    agendamentoId: number
  ): Promise<{ googleCalendarEventId: string; googleCalendarUrl: string; agendamento: Agendamento }> {
    return this.executarHibrido(
      async () => {
        const res = await this.requisicaoApi<{
          googleCalendarEventId: string;
          googleCalendarUrl: string;
          agendamento: Agendamento;
        }>(`/agendamentos/${agendamentoId}/sincronizar-google-calendar`, {
          method: 'POST',
        });
        return res;
      },
      async (estado) => {
        const agendamento = estado.agendamentos.find((a) => a.id === agendamentoId);
        if (!agendamento) {
          throw new Error(`Agendamento com ID ${agendamentoId} não encontrado`);
        }

        if (!agendamento.dataHora) {
          throw new Error(
            'Não é possível sincronizar com o Google Calendar um atendimento sem data e hora definidas'
          );
        }

        const dataHora = new Date(agendamento.dataHora);
        const syncDados = this.gerarDadosGoogleCalendar({
          id: agendamento.id,
          titulo: agendamento.titulo,
          descricao: agendamento.descricao || agendamento.proximaAcao,
          dataHora,
          duracaoMinutos: agendamento.duracaoMinutos || 60,
          clienteNome: agendamento.cliente?.nomeCompleto,
          imovelEndereco: agendamento.imovel?.endereco,
        });

        agendamento.sincronizarGoogleCalendar = true;
        agendamento.googleCalendarEventId = syncDados.googleCalendarEventId;
        agendamento.googleCalendarUrl = syncDados.googleCalendarUrl;
        agendamento.atualizadoEm = new Date().toISOString();

        await this.salvarEstado(estado);
        return {
          googleCalendarEventId: syncDados.googleCalendarEventId,
          googleCalendarUrl: syncDados.googleCalendarUrl,
          agendamento,
        };
      }
    );
  }

  async obterAvisosProximos(horasAntecedencia = 48): Promise<ResumoAvisosProximos> {
    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<ResumoAvisosProximos>(
          `/avisos/proximos?horasAntecedencia=${horasAntecedencia}`
        );
      },
      async (estado) => {
        const agora = Date.now();
        const limiteFuturo = agora + horasAntecedencia * 3600_000;

        const dispensadosChaves = new Set(
          estado.avisos
            .filter((a) => a.status === 'DISPENSADO' && a.agendamentoId)
            .map((a) => `${a.agendamentoId}:${a.tipoAviso}`)
        );

        const dispensadosIds = new Set(
          estado.avisos
            .filter((a) => a.status === 'DISPENSADO' && a.id !== undefined)
            .map((a) => a.id)
        );

        const proximos: AvisoItem[] = [];
        const atrasados: AvisoItem[] = [];
        const semData: AvisoItem[] = [];

        const ativos = estado.agendamentos.filter(
          (a) => a.status === 'PENDENTE' || a.status === 'CONFIRMADO'
        );

        for (let i = 0; i < ativos.length; i++) {
          const ag = ativos[i];
          const dataRef = ag.dataHora || ag.dataRetorno || null;

          if (!dataRef) {
            const chave = `${ag.id}:TAREFA_SEM_DATA`;
            if (!dispensadosChaves.has(chave)) {
              const avisoId = 3000 + ag.id;
              if (!dispensadosIds.has(avisoId)) {
                semData.push({
                  id: avisoId,
                  tipoAviso: 'TAREFA_SEM_DATA',
                  titulo: `Retorno/ação sem data: ${ag.titulo}`,
                  mensagem: ag.proximaAcao
                    ? `O atendimento de ${ag.cliente?.nomeCompleto || 'cliente'} possui a próxima ação "${ag.proximaAcao}" sem data de retorno definida.`
                    : `O atendimento "${ag.titulo}" está pendente sem data definida.`,
                  status: 'PENDENTE',
                  agendamentoId: ag.id,
                  agendamento: ag,
                });
              }
            }
            continue;
          }

          const instante = new Date(dataRef).getTime();

          if (instante < agora) {
            const chave = `${ag.id}:RETORNO_ATRASADO`;
            if (!dispensadosChaves.has(chave)) {
              const avisoId = 2000 + ag.id;
              if (!dispensadosIds.has(avisoId)) {
                atrasados.push({
                  id: avisoId,
                  tipoAviso: 'RETORNO_ATRASADO',
                  titulo: `Compromisso/retorno em atraso: ${ag.titulo}`,
                  mensagem: `O compromisso "${ag.titulo}" com ${ag.cliente?.nomeCompleto || 'cliente'} estava previsto para ${new Date(dataRef).toISOString()} e continua pendente.`,
                  status: 'PENDENTE',
                  agendamentoId: ag.id,
                  agendamento: ag,
                });
              }
            }
          } else if (instante <= limiteFuturo) {
            const chave = `${ag.id}:COMPROMISSO_PROXIMO`;
            if (!dispensadosChaves.has(chave)) {
              const avisoId = 1000 + ag.id;
              if (!dispensadosIds.has(avisoId)) {
                proximos.push({
                  id: avisoId,
                  tipoAviso: 'COMPROMISSO_PROXIMO',
                  titulo: `Compromisso próximo: ${ag.titulo}`,
                  mensagem: `${MENSAGEM_BANNER_AVISOS} — "${ag.titulo}" com ${ag.cliente?.nomeCompleto || 'cliente'} via ${ag.canalContato || 'WHATSAPP'}.`,
                  status: 'PENDENTE',
                  agendamentoId: ag.id,
                  agendamento: ag,
                });
              }
            }
          }
        }

        const todosAlertas = [...proximos, ...atrasados, ...semData];
        const possuiAvisos = todosAlertas.length > 0;

        return {
          possuiAvisos,
          mensagemBanner: possuiAvisos ? MENSAGEM_BANNER_AVISOS : null,
          horasAntecedencia,
          totalAlertas: todosAlertas.length,
          totalProximos: proximos.length,
          totalAtrasados: atrasados.length,
          totalSemData: semData.length,
          proximos,
          atrasados,
          semData,
          alertas: todosAlertas,
        };
      }
    );
  }

  async dispararAvisos(horasAntecedencia = 48): Promise<ResumoAvisosProximos> {
    return this.executarHibrido(
      async () => {
        return this.requisicaoApi<ResumoAvisosProximos>(
          `/avisos/disparar?horasAntecedencia=${horasAntecedencia}`,
          { method: 'POST' }
        );
      },
      async (estado) => {
        const resumo = await this.obterAvisosProximos(horasAntecedencia);
        for (const item of resumo.alertas) {
          const existente = estado.avisos.find((a) => a.id === item.id);
          if (!existente) {
            estado.avisos.push({ ...item });
          }
        }
        await this.salvarEstado(estado);
        return resumo;
      }
    );
  }

  async dispensarAviso(avisoId: number): Promise<void> {
    return this.executarHibrido(
      async () => {
        await this.requisicaoApi(`/avisos/${avisoId}/dispensar`, {
          method: 'PATCH',
        });
      },
      async (estado) => {
        const aviso = estado.avisos.find((a) => a.id === avisoId);
        if (aviso) {
          aviso.status = 'DISPENSADO';
          aviso.dispensadoEm = new Date().toISOString();
        } else {
          estado.avisos.push({
            id: avisoId,
            tipoAviso: 'COMPROMISSO_PROXIMO',
            titulo: 'Aviso dispensado',
            mensagem: '',
            status: 'DISPENSADO',
            dispensadoEm: new Date().toISOString(),
          });
        }
        await this.salvarEstado(estado);
      }
    );
  }

  async resetarDadosDemo(): Promise<void> {
    const estadoSeed = criarEstadoSeedJunior();
    estadoSeed.apiBaseUrl = this.apiBaseUrl;
    estadoSeed.modoOfflineForcado = this.forcarOffline;
    await domusStorage.setItem(STORAGE_KEY_STATE, estadoSeed);
  }
}

export const domusApi = new DomusApiService();
