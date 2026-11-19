import { DomusApiService } from '../services/domusApi';
import { domusStorage } from '../services/storage';

describe('DomusApiService (Comunicacao REST Pura sem Modo Demo)', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await domusStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('realiza login real na API, salva JWT e retorna sem flag de modoOffline', async () => {
    const mockUsuario = {
      id: 1,
      nome: 'Corretor Teste',
      login: 'corretor.teste',
      email: 'corretor@domus.com.br',
      perfis: ['CORRETOR'],
      ativo: true,
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({
        accessToken: 'jwt-real-header.payload.sig',
        usuario: mockUsuario,
      }),
    });
    global.fetch = fetchMock as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });
    const res = await api.login({
      loginOuEmail: '  corretor.teste  ',
      senha: 'MinhaSenha@123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          login: 'corretor.teste',
          senha: 'MinhaSenha@123',
        }),
      })
    );
    expect(res).toEqual({
      accessToken: 'jwt-real-header.payload.sig',
      usuario: mockUsuario,
    });
    expect('modoOffline' in res).toBe(false);
    expect(api.estaOnline).toBe(true);
    expect(await domusStorage.getItem('@domus:access_token')).toBe(
      'jwt-real-header.payload.sig'
    );
  });

  it('falha explicitamente no login quando a API esta inacessivel sem gerar token mock', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed')) as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });

    await expect(
      api.login({ loginOuEmail: 'corretor.teste', senha: 'MinhaSenha@123' })
    ).rejects.toThrow('Não foi possível conectar à API DOMUS');

    expect(api.estaOnline).toBe(false);
    expect(await domusStorage.getItem('@domus:access_token')).toBeNull();
  });

  it('falha no login com erro 401 sem limpar estado de conexao online nem acionar fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({
        message: 'Credenciais inválidas ou usuário inativo',
      }),
    }) as any;

    const onUnauthorized = jest.fn();
    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });
    api.registrarOnUnauthorized(onUnauthorized);

    await expect(
      api.login({ loginOuEmail: 'corretor.teste', senha: 'errada' })
    ).rejects.toThrow('Credenciais inválidas ou usuário inativo');

    expect(api.estaOnline).toBe(true);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('obterUsuarioLogado retorna null sem token, descarta token mock legado e consulta /auth/me com JWT real', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });

    // Sem token
    expect(await api.obterUsuarioLogado()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // Token mock legado
    await domusStorage.setItem('@domus:access_token', 'domus-mock-token-user-1-123');
    expect(await api.obterUsuarioLogado()).toBeNull();
    expect(await domusStorage.getItem('@domus:access_token')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // Token JWT real
    const usuarioReal = {
      id: 2,
      nome: 'Maria Corretora',
      login: 'maria.corretora',
      email: 'maria@domus.com.br',
      perfis: ['CORRETOR'],
      ativo: true,
    };
    await domusStorage.setItem('@domus:access_token', 'jwt-valido-xyz');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(usuarioReal),
    });

    const user = await api.obterUsuarioLogado();
    expect(user).toEqual(usuarioReal);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-valido-xyz',
        }),
      })
    );
  });

  it('dispara callback onUnauthorized e remove token ao receber 401 em rota protegida', async () => {
    await domusStorage.setItem('@domus:access_token', 'jwt-expirado');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({
        message: 'Token de autenticação inválido ou expirado',
      }),
    }) as any;

    const onUnauthorized = jest.fn();
    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });
    api.registrarOnUnauthorized(onUnauthorized);

    await expect(api.listarClientes()).rejects.toThrow(
      'Token de autenticação inválido ou expirado'
    );

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(await domusStorage.getItem('@domus:access_token')).toBeNull();
  });

  it('cadastrarUsuario envia payload whitelisted sem Bearer token e com perfil CORRETOR por padrao', async () => {
    await domusStorage.setItem('@domus:access_token', 'token-preexistente');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: jest.fn().mockResolvedValue({
        id: 5,
        nome: 'Ana Corretora',
        login: 'ana.corretora',
        email: 'ana@domus.com.br',
        perfis: ['CORRETOR'],
        ativo: true,
      }),
    });
    global.fetch = fetchMock as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });
    await api.cadastrarUsuario({
      nome: 'Ana Corretora',
      login: 'ANA.CORRETORA',
      email: 'ANA@DOMUS.COM.BR',
      cpf: '123.456.789-01',
      senha: 'Password@123',
      confirmarSenha: 'Password@123',
    });

    const [url, reqInit] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/usuarios');
    expect(reqInit.method).toBe('POST');
    expect(reqInit.headers.Authorization).toBeUndefined();
    expect(JSON.parse(reqInit.body)).toEqual({
      nome: 'Ana Corretora',
      login: 'ana.corretora',
      email: 'ana@domus.com.br',
      cpf: '12345678901',
      senha: 'Password@123',
      confirmarSenha: 'Password@123',
      perfis: ['CORRETOR'],
    });
  });

  it('inicializar restaura URL salva, remove @domus:local_state legado e descarta token mock', async () => {
    await domusStorage.setItem('@domus:api_base_url', 'http://192.168.0.10:3000');
    await domusStorage.setItem('@domus:local_state', { clientes: [] });
    await domusStorage.setItem('@domus:access_token', 'domus-mock-token-legado');

    const api = new DomusApiService();
    await api.inicializar();

    expect(api.baseUrl).toBe('http://192.168.0.10:3000/api');
    expect(await domusStorage.getItem('@domus:local_state')).toBeNull();
    expect(await domusStorage.getItem('@domus:access_token')).toBeNull();

    await api.configurarApiUrl('http://10.0.0.5:3000');
    expect(api.baseUrl).toBe('http://10.0.0.5:3000/api');
    expect(await domusStorage.getItem('@domus:api_base_url')).toBe(
      'http://10.0.0.5:3000/api'
    );
  });

  it('testarConexao trata respostas 200/401 como API online e falhas de rede como offline', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 401 })
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));
    global.fetch = fetchMock as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });

    const resOk = await api.testarConexao();
    expect(resOk.ok).toBe(true);
    expect(resOk.status).toBe(401);
    expect(api.estaOnline).toBe(true);

    const resErro = await api.testarConexao();
    expect(resErro.ok).toBe(false);
    expect(resErro.mensagem).toContain('ECONNREFUSED');
    expect(api.estaOnline).toBe(false);
  });

  it('rejeita resposta invalida do login sem gravar token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({}),
    }) as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });

    await expect(
      api.login({ loginOuEmail: 'corretor.teste', senha: 'MinhaSenha@123' })
    ).rejects.toThrow('Resposta inválida do servidor de autenticação.');

    expect(await domusStorage.getItem('@domus:access_token')).toBeNull();
  });

  it('propaga erros de validacao do backend em array sem recorrer a fallback local', async () => {
    await domusStorage.setItem('@domus:access_token', 'jwt-valido');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({
        message: ['O telefone é obrigatório', 'CPF inválido'],
      }),
    }) as any;

    const api = new DomusApiService({ baseUrl: 'http://localhost:3000/api' });

    await expect(
      api.criarCliente({
        nomeCompleto: 'Maria Teste',
        cpfDocumento: '11122233344',
        telefone: '',
      })
    ).rejects.toThrow('O telefone é obrigatório; CPF inválido');
  });
});
