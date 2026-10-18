import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthService } from './auth.service';

describe('AuthService & UsuariosService (RN01, RN02, RN03)', () => {
  let authService: AuthService;
  let usuariosService: UsuariosService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        UsuariosModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usuariosService = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RN01/RN02: deve cadastrar usuário com hash de senha, omitir senhaHash e atribuir perfil padrão CORRETOR', async () => {
    const usuario = await usuariosService.create({
      nome: 'Junior Corretor',
      login: 'Junior.Corretor',
      cpf: '123.456.789-01',
      email: 'Junior@Domus.com.br',
      senha: 'Password123',
      confirmarSenha: 'Password123',
    });

    expect(usuario.id).toBeDefined();
    expect(usuario.login).toBe('junior.corretor');
    expect(usuario.email).toBe('junior@domus.com.br');
    expect(usuario.cpf).toBe('12345678901');
    expect(usuario.perfis).toEqual(['CORRETOR']);
    expect((usuario as any).senhaHash).toBeUndefined();
  });

  it('RN01: deve rejeitar cadastro quando confirmarSenha diverge de senha ou login/email/cpf duplicado', async () => {
    await expect(
      usuariosService.create({
        nome: 'Pedro',
        login: 'pedro',
        email: 'pedro@domus.com',
        senha: 'Password123',
        confirmarSenha: 'OutraSenha',
      }),
    ).rejects.toThrow(BadRequestException);

    await usuariosService.create({
      nome: 'Pedro',
      login: 'pedro',
      cpf: '11122233344',
      email: 'pedro@domus.com',
      senha: 'Password123',
    });

    await expect(
      usuariosService.create({
        nome: 'Outro Pedro',
        login: 'pedro',
        email: 'outro@domus.com',
        senha: 'Password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('RN03: deve autenticar por username (login ou email), atualizar ultimoLogin e permitir alterar senha', async () => {
    const criado = await usuariosService.create({
      nome: 'Junior',
      login: 'junior',
      email: 'junior@domus.com',
      senha: 'SenhaInicial123',
      perfis: ['CORRETOR', 'CADASTRADOR'],
    });

    const loginPorUsername = await authService.login({
      username: 'junior',
      password: 'SenhaInicial123',
    });
    expect(loginPorUsername.accessToken).toBeDefined();
    expect(loginPorUsername.usuario.ultimoLogin).not.toBeNull();
    expect(loginPorUsername.usuario.perfis).toEqual(['CORRETOR', 'CADASTRADOR']);

    const loginPorEmail = await authService.login({
      email: 'junior@domus.com',
      senha: 'SenhaInicial123',
    });
    expect(loginPorEmail.accessToken).toBeDefined();

    await expect(
      authService.login({
        username: 'junior',
        password: 'SenhaErrada',
      }),
    ).rejects.toThrow(UnauthorizedException);

    await authService.alterarSenha(criado.id, {
      senhaAtual: 'SenhaInicial123',
      novaSenha: 'NovaSenhaForte456',
      confirmarNovaSenha: 'NovaSenhaForte456',
    });

    const loginComNovaSenha = await authService.login({
      username: 'junior',
      password: 'NovaSenhaForte456',
    });
    expect(loginComNovaSenha.accessToken).toBeDefined();
  });
});
