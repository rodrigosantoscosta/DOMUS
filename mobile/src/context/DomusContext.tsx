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
  modoOffline: boolean;
  carregando: boolean;
  erro: string | null;
  login: (input: LoginInput) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  recarregarDados: () => Promise<void>;
  resetarDemo: () => Promise<void>;
  criarCliente: (input: CreateClienteInput) => Promise<Cliente>;
  criarImovel: (input: CreateImovelInput) => Promise<Imovel>;
  criarAgendamento: (input: CreateAgendamentoInput) => Promise<Agendamento>;
  programarRetorno: (origemId: number, input: ProgramarRetornoInput) => Promise<Agendamento>;
  concluirAgendamento: (id: number, input: ConcluirAgendamentoInput) => Promise<Agendamento>;
  sincronizarGoogleCalendar: (id: number) => Promise<{ googleCalendarUrl: string }>;
  cadastrarUsuario: (input: CreateUsuarioInput) => Promise<Usuario>;
  configurarModo: (opcoes: { baseUrl?: string; forcarOffline?: boolean }) => Promise<void>;
  toast?: { texto: string; tipo: 'sucesso' | 'erro' | 'info' } | null;
  mostrarToast?: (texto: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  fecharToast?: () => void;
}

const DomusContext = createContext<DomusContextData | undefined>(undefined);

export interface DomusProviderProps {
  children: ReactNode;
  autoLoginDemo?: boolean;
}

export const DomusProvider: React.FC<DomusProviderProps> = ({
  children,
  autoLoginDemo = true,
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
  const [modoOffline, setModoOffline] = useState<boolean>(true);
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
        setModoOffline(domusApi.obterModoOffline());

        if (resumoAvisos.possuiAvisos) {
          setBannerVisivel(true);
        }
      }
    } catch (err: any) {
      if (montadoRef.current) {
        setErro(err.message || 'Erro ao sincronizar dados');
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
        setUsuario(res.usuario);
        setModoOffline(res.modoOffline);
        await recarregarDados();
        return res;
      } catch (err: any) {
        setErro(err.message || 'Falha na autenticação');
        throw err;
      } finally {
        setCarregando(false);
      }
    },
    [recarregarDados]
  );

  const logout = useCallback(async () => {
    setCarregando(true);
    try {
      await domusApi.logout();
      setUsuario(null);
      setAbaAtiva('Clientes');
    } catch (err: any) {
      setErro(err.message || 'Falha ao deslogar');
    } finally {
      setCarregando(false);
    }
  }, []);

  const resetarDemo = useCallback(async () => {
    setCarregando(true);
    try {
      await domusApi.resetarDadosDemo();
      await recarregarDados();
      const userLogado = await domusApi.obterUsuarioLogado();
      setUsuario(userLogado);
      setBannerVisivel(true);
    } catch (err: any) {
      setErro(err.message || 'Erro ao resetar demonstração');
    } finally {
      setCarregando(false);
    }
  }, [recarregarDados]);

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
        setErro(err.message || 'Erro ao cadastrar usuário');
        throw err;
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  const configurarModo = useCallback(
    async (opcoes: { baseUrl?: string; forcarOffline?: boolean }) => {
      setCarregando(true);
      setErro(null);
      try {
        await domusApi.configurarModo(opcoes);
        setModoOffline(domusApi.obterModoOffline());
        await recarregarDados();
      } catch (err: any) {
        setErro(err.message || 'Erro ao configurar modo de conexão');
        throw err;
      } finally {
        setCarregando(false);
      }
    },
    [recarregarDados]
  );

  useEffect(() => {
    montadoRef.current = true;

    async function inicializar() {
      try {
        let user = await domusApi.obterUsuarioLogado();
        if (!user && autoLoginDemo) {
          const res = await domusApi.login({
            loginOuEmail: 'junior.corretor',
            senha: 'Domus@2026',
          });
          user = res.usuario;
        }
        if (montadoRef.current && (user || autoLoginDemo)) {
          setUsuario(user);
          await recarregarDados();
        }
      } catch {
        // Fallback para estado limpo
      }
    }

    inicializar();

    return () => {
      montadoRef.current = false;
    };
  }, [autoLoginDemo, recarregarDados]);

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
    modoOffline,
    carregando,
    erro,
    login,
    logout,
    recarregarDados,
    resetarDemo,
    criarCliente,
    criarImovel,
    criarAgendamento,
    programarRetorno,
    concluirAgendamento,
    sincronizarGoogleCalendar,
    cadastrarUsuario,
    configurarModo,
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
