import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/main';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DOMUS Backend — Fluxo Completo E2E (.docx Seções 1 a 6 + OWASP A01/RN02)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('Deve executar toda a jornada de validação do Plano de Intervenção (Seção 4.3 e Seção 5 do .docx) e impor autenticação/autorização (OWASP A01 e RN02)', async () => {
    // 0. Healthcheck público (/api/status) e bloqueio de rotas protegidas sem JWT (OWASP A01)
    const statusRes = await request(app.getHttpServer())
      .get('/api/status')
      .expect(200);
    expect(statusRes.body.status).toBe('online');

    await request(app.getHttpServer()).get('/api/clientes').expect(401);
    await request(app.getHttpServer()).get('/api/agendamentos').expect(401);

    // 1. Cadastro de Usuário (Corretor Persona Junior)
    const userRes = await request(app.getHttpServer())
      .post('/api/usuarios')
      .send({
        nome: 'Junior Corretor',
        login: 'junior.jp',
        cpf: '123.456.789-01',
        email: 'junior@domus.com.br',
        senha: 'Password@123',
        confirmarSenha: 'Password@123',
        perfis: ['CORRETOR'],
      })
      .expect(201);

    const corretorId = userRes.body.id;
    expect(corretorId).toBeDefined();
    expect(userRes.body.senhaHash).toBeUndefined();

    // 2. Login e Autenticação JWT (Tela de Login: Username + Password)
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'junior.jp',
        password: 'Password@123',
      })
      .expect(200);

    const token = loginRes.body.accessToken;
    expect(token).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meRes.body.login).toBe('junior.jp');

    // Validação RN02 (RolesGuard): DELETE /api/usuarios/:id exige perfil CADASTRADOR (CORRETOR isolado recebe 403)
    await request(app.getHttpServer())
      .delete(`/api/usuarios/${corretorId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    // 3. Cadastro de Imóveis (Tela Cadastrar Imóvel)
    const imovelRes = await request(app.getHttpServer())
      .post('/api/imoveis')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroInscricao: 'JP-2026-999',
        tipoImovel: 'APARTAMENTO',
        finalidade: 'VENDA',
        cep: '58038-000',
        endereco: 'Av. João Maurício, 1200',
        bairro: 'Manaíra',
        numero: '1200',
        areaTotal: 125.5,
        comodos: 3,
        banheiros: 3,
        valor: 890000,
        posicoes: ['NASCENTE'],
        corretorCaptadorId: corretorId,
      })
      .expect(201);

    const imovelId = imovelRes.body.id;
    expect(imovelId).toBeDefined();

    // 4. Cadastrar um cliente e associar a ele um ou mais imóveis de interesse (Seção 4.3, item 1 + Tela Cadastro de Cliente)
    const clienteRes = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nomeCompleto: 'Roberto Almeida',
        cpf: '987.654.321-00',
        telefone: '(83) 99911-2233',
        email: 'roberto@cliente.com',
        canalPrincipalContato: 'WHATSAPP',
        observacoes: 'Procura imóvel na orla de Manaíra ou Cabo Branco',
        imoveisInteresseIds: [imovelId],
      })
      .expect(201);

    const clienteId = clienteRes.body.id;
    expect(clienteRes.body.imoveisInteresse).toHaveLength(1);
    expect(clienteRes.body.imoveisInteresse[0].id).toBe(imovelId);

    // 5. Agendar uma visita a um imóvel já cadastrado, vinculando-o ao cliente (Seção 4.3, item 2 + Tela Agendar Compromisso)
    const dataAmanha = new Date(Date.now() + 20 * 3600_000);
    const dataFormatada = dataAmanha.toISOString().slice(0, 10); // YYYY-MM-DD

    const visitaRes = await request(app.getHttpServer())
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Visita ao Apto Manaíra com Roberto',
        descricao: 'Apresentar apartamento e vista da varanda',
        tipo: 'VISITA',
        data: dataFormatada,
        hora: '14:00',
        duracao: '60 min',
        observacao: 'Confirmar portaria 30 min antes',
        clienteId,
        imovelId,
        corretorId,
      })
      .expect(201);

    const visitaId = visitaRes.body.id;
    expect(visitaRes.body.tipo).toBe('VISITA');
    expect(visitaRes.body.canalContato).toBe('WHATSAPP');

    // 6. Programar um retorno associado a essa visita (Seção 4.3, item 3)
    const dataDepoisAmanha = new Date(Date.now() + 40 * 3600_000)
      .toISOString()
      .slice(0, 10);

    const retornoRes = await request(app.getHttpServer())
      .post(`/api/agendamentos/${visitaId}/programar-retorno`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Retorno pós-visita: enviar proposta formal',
        descricao: 'Entrar em contato via WhatsApp com condições de pagamento',
        data: dataDepoisAmanha,
        hora: '10:30',
        duracaoMinutos: 30,
        observacao: 'Cliente pediu retorno pela manhã',
        proximaAcao: 'Enviar planilha de parcelamento',
        sincronizarGoogleCalendar: true,
      })
      .expect(201);

    expect(retornoRes.body.tipo).toBe('RETORNO');
    expect(retornoRes.body.agendamentoOrigemId).toBe(visitaId);
    expect(retornoRes.body.googleCalendarUrl).toContain('calendar.google.com');

    // 7. Visualizar os próximos compromissos na página inicial, organizados por cliente e por imóvel (Seção 4.3, item 4 + Tela Seus Atendimentos)
    const visaoGeralRes = await request(app.getHttpServer())
      .get('/api/agendamentos/visao-geral')
      .set('Authorization', `Bearer ${token}`)
      .query({ corretorId })
      .expect(200);

    expect(visaoGeralRes.body.totalAtendimentos).toBe(2);
    expect(visaoGeralRes.body.porCliente).toHaveLength(1);
    expect(visaoGeralRes.body.porCliente[0].cliente.id).toBe(clienteId);
    expect(visaoGeralRes.body.porImovel).toHaveLength(1);
    expect(visaoGeralRes.body.porImovel[0].imovel.id).toBe(imovelId);

    // 8. Disparar avisos de agendamentos próximos (Seção 5 + Tela 4 de Notificação)
    const disparoRes = await request(app.getHttpServer())
      .post('/api/avisos/disparar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        horasAntecedencia: 48,
        corretorId,
      })
      .expect(201);

    expect(disparoRes.body.possuiAvisos).toBe(true);
    expect(disparoRes.body.mensagemBanner).toBe(
      'Você tem agendamentos proximo do dias marcados',
    );
    expect(disparoRes.body.totalDisparados).toBe(2);

    // 9. Dispensar um aviso (botão X do banner) e concluir a visita
    const primeiroAvisoId = disparoRes.body.avisos[0].id;
    const dispensaRes = await request(app.getHttpServer())
      .patch(`/api/avisos/${primeiroAvisoId}/dispensar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(dispensaRes.body.status).toBe('DISPENSADO');

    const concluirRes = await request(app.getHttpServer())
      .patch(`/api/agendamentos/${visitaId}/concluir`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        observacao: 'Visita realizada, cliente solicitou proposta escrita',
      })
      .expect(200);
    expect(concluirRes.body.status).toBe('CONCLUIDO');
  });
});
