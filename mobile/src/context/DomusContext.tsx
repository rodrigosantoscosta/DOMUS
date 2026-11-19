import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { domusApi } from '../services/domusApi';
import {
  AbaDomus,
  Agendamento,
  Cliente,
  ConcluirAgendamentoInput,
  CreateAgendamentoInput,
  CreateClienteInput,
  CreateImovelInput,
  CreateUsuarioInput,
  Imovel,
  LoginInput,
  LoginResponse,
  ProgramarRetornoInput,
  ResumoAvisosProximos,
  Usuario,
  VisaoGeralAtendimentos,
} from '../types/domus';

export interface DomusContextData {
  usuario: Usuario | null;
  abaAtiva: AbaDomus;
  setAbaAtiva: (aba: AbaDomus) => void;
  clientes: Cliente[];
  imoveis: Imovel[];
  agendamentos: Agendamento[];
  visaoGeral: VisaoGeralAtendimentos | null;
  avisos: ResumoAvisosProximos | null;
  bannerVisivel: boolean;
  fecharBanner: () => void;
  apiOnline: boolean;
  inicializando: boolean;
  carregando: boolean;
  erro: string | null;
  login: (input: LoginInput) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  recarregarDados: () => Promise<void>;
  criarCliente: (input: CreateClienteInput) => Promise<Cliente>;
  criarImovel: (input: CreateImovelInput) => Promise<Imovel>;
  criarAgendamento: (input: CreateAgendamentoInput) => Promise<Agendamento>;
  programarRetorno: (origemId: number, input: ProgramarRetornoInput) => Promise<Agendamento>;
  concluirAgendamento: (id: number, input: ConcluirAgendamentoInput) => Promise<Agendamento>;
  sincronizarGoogleCalendar: (id: number) => Promise<{ googleCalendarUrl: string }>;
  cadastrarUsuario: (input: CreateUsuarioInput) => Promise<Usuario>;
  configurarApiUrl: (baseUrl: string) => Promise<void>;
  toast?: { texto: string; tipo: 'sucesso' | 'erro' | 'info' } | null;
  mostrarToast?: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  fecharToast?: () => void;
}

const DomusContext = createContext<DomusContextData | undefined>(undefined);

export interface DomusProviderProps {
  children: ReactNode;
  verificarSessaoInicial?: boolean;
}

export const DomusProvider: React.FC<DomusProviderProps> = ({
  children,
  verificarSessaoInicial = true,
}) => {
  const montadoRef = React.useRef<boolean>(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaDomus>('Clientes');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [visaoGeral, setVisaoGeral] = useState<VisaoGeralAtendimentos | null>(null);
  const [avisos, setAvisos] = useState<ResumoAvisosProximos | null>(null);
  const [bannerVisivel, setBannerVisivel] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [inicializando, setInicializando] = useState<boolean>(verificarSessaoInicial);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<{ texto: string; tipo: 'sucesso' | 'erro' | 'info' } | null>(null);

  const recarregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const [listaClientes, listaImoveis, listaAgendamentos, visao, resumoAvisos] =
        await Promise.all([
          domusApi.listarClientes(),
          domusApi.listarImoveis(),
          domusApi.listarAgendamentos(),
          domusApi.obterVisaoGeral(),
          domusApi.obterAvisosProximos(48),
        ]);

      if (montadoRef.current) {
        setClientes(listaClientes);
        setImoveis(listaImoveis);
        setAgendamentos(listaAgendamentos);
        setVisaoGeral(visao);
        setAvisos(resumoAvisos);
        setApiOnline(true);

        if (resumoAvisos.possuiAvisos) {
          setBannerVisivel(true);
        }
      }
    } catch (err: any) {
      if (montadoRef.current) {
        setApiOnline(domusApi.estaOnline);
        setErro(err.message || 'Erro ao sincronizar dados com a API');
      }
    } finally {
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<LoginResponse> => {
      setCarregando(true);
      setErro(null);
      try {
        const res = await domusApi.login(input);
        if (montadoRef.current) {
          setUsuario(res.usuario);
          setApiOnline(true);
        }
        await recarregarDados();
        if (montadoRef.current) {
          setToast({ texto: 'Login realizado com sucesso', tipo: 'sucesso' });
        }
        return res;
      } catch (err: any) {
        if (montadoRef.current) {
          setApiOnline(domusApi.estaOnline);
          setErro(err.message || 'Falha na autenticação');
        }
        throw err;
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
        }
      }
    },
    [recarregarDados]
  );

  const logout = useCallback(async () => {
    setCarregando(true);
    try {
      await domusApi.logout();
      if (montadoRef.current) {
        setUsuario(null);
        setClientes([]);
        setImoveis([]);
        setAgendamentos([]);
        setVisaoGeral(null);
        setAvisos(null);
        setErro(null);
        setAbaAtiva('Clientes');
        setToast({ texto: 'Sessão encerrada', tipo: 'info' });
      }
    } catch (err: any) {
      if (montadoRef.current) {
        setErro(err.message || 'Falha ao deslogar');
      }
    } finally {
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, []);

  const mostrarToast = useCallback((texto: string, tipo: 'sucesso' | 'erro' | 'info' = 'info') => {
    setToast({ texto, tipo });
  }, []);

  const fecharToast = useCallback(() => {
    setToast(null);
  }, []);

  const fecharBanner = useCallback(() => {
    setBannerVisivel(false);
  }, []);

  const criarCliente = useCallback(
    async (input: CreateClienteInput): Promise<Cliente> => {
      const novo = await domusApi.criarCliente(input);
      await recarregarDados();
      return novo;
    },
    [recarregarDados]
  );

  const criarImovel = useCallback(
    async (input: CreateImovelInput): Promise<Imovel> => {
      const novo = await domusApi.criarImovel(input);
      await recarregarDados();
      return novo;
    },
    [recarregarDados]
  );

  const criarAgendamento = useCallback(
    async (input: CreateAgendamentoInput): Promise<Agendamento> => {
      const novo = await domusApi.criarAgendamento(input);
      await recarregarDados();
      return novo;
    },
    [recarregarDados]
  );

  const programarRetorno = useCallback(
    async (origemId: number, input: ProgramarRetornoInput): Promise<Agendamento> => {
      const retorno = await domusApi.programarRetorno(origemId, input);
      await recarregarDados();
      return retorno;
    },
    [recarregarDados]
  );

  const concluirAgendamento = useCallback(
    async (id: number, input: ConcluirAgendamentoInput): Promise<Agendamento> => {
      const concluido = await domusApi.concluirAgendamento(id, input);
      await recarregarDados();
      return concluido;
    },
    [recarregarDados]
  );

  const sincronizarGoogleCalendar = useCallback(
    async (id: number): Promise<{ googleCalendarUrl: string }> => {
      const sync = await domusApi.sincronizarGoogleCalendar(id);
      await recarregarDados();
      return sync;
    },
    [recarregarDados]
  );

  const cadastrarUsuario = useCallback(
    async (input: CreateUsuarioInput): Promise<Usuario> => {
      setCarregando(true);
      setErro(null);
      try {
        const novo = await domusApi.cadastrarUsuario(input);
        return novo;
      } catch (err: any) {
        if (montadoRef.current) {
          setApiOnline(domusApi.estaOnline);
          setErro(err.message || 'Erro ao cadastrar usuário');
        }
        throw err;
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
        }
      }
    },
    []
  );

  const configurarApiUrl = useCallback(
    async (baseUrl: string) => {
      setCarregando(true);
      setErro(null);
      try {
        const res = await domusApi.testarConexao(baseUrl);
        if (!res.ok) {
          if (montadoRef.current) {
            setApiOnline(domusApi.estaOnline);
          }
          throw new Error(res.mensagem);
        }
        await domusApi.configurarApiUrl(baseUrl);
        if (montadoRef.current) {
          setApiOnline(true);
        }
        if (usuario) {
          await recarregarDados();
          if (!domusApi.estaOnline) {
            throw new Error('Conectado ao servidor, mas falhou ao sincronizar os dados.');
          }
        }
      } catch (err: any) {
        if (montadoRef.current) {
          setApiOnline(domusApi.estaOnline);
          setErro(err.message || 'Erro ao configurar URL da API');
        }
        throw err;
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
        }
      }
    },
    [recarregarDados, usuario]
  );

  useEffect(() => {
    montadoRef.current = true;

    domusApi.registrarOnUnauthorized(() => {
      if (!montadoRef.current) return;
      setUsuario(null);
      setClientes([]);
      setImoveis([]);
      setAgendamentos([]);
      setVisaoGeral(null);
      setAvisos(null);
      setAbaAtiva('Clientes');
      setToast({ texto: 'Sessão expirada. Faça login novamente.', tipo: 'erro' });
    });

    async function inicializarSessao() {
      if (!verificarSessaoInicial) {
        if (montadoRef.current) {
          setInicializando(false);
        }
        return;
      }

      try {
        await domusApi.inicializar();
        const user = await domusApi.obterUsuarioLogado();

        if (!montadoRef.current) return;

        if (user) {
          setUsuario(user);
          setApiOnline(true);
          await recarregarDados();
        } else {
          const ping = await domusApi.testarConexao();
          if (montadoRef.current) {
            setApiOnline(ping.ok);
          }
        }
      } catch (err: any) {
        if (montadoRef.current) {
          setUsuario(null);
          setApiOnline(domusApi.estaOnline);
          if (!domusApi.estaOnline) {
            setErro(err.message || 'Não foi possível conectar à API');
          }
        }
      } finally {
        if (montadoRef.current) {
          setInicializando(false);
        }
      }
    }

    inicializarSessao();

    return () => {
      montadoRef.current = false;
      domusApi.registrarOnUnauthorized(undefined);
    };
  }, [verificarSessaoInicial, recarregarDados]);

  const value: DomusContextData = {
    usuario,
    abaAtiva,
    setAbaAtiva,
    clientes,
    imoveis,
    agendamentos,
    visaoGeral,
    avisos,
    bannerVisivel,
    fecharBanner,
    apiOnline,
    inicializando,
    carregando,
    erro,
    login,
    logout,
    recarregarDados,
    criarCliente,
    criarImovel,
    criarAgendamento,
    programarRetorno,
    concluirAgendamento,
    sincronizarGoogleCalendar,
    cadastrarUsuario,
    configurarApiUrl,
    toast,
    mostrarToast,
    fecharToast,
  };

  return <DomusContext.Provider value={value}>{children}</DomusContext.Provider>;
};

export const useDomus = (): DomusContextData => {
  const context = useContext(DomusContext);
  if (!context) {
    throw new Error('useDomus deve ser utilizado dentro de um DomusProvider');
  }
  return context;
};

export default DomusContext;
