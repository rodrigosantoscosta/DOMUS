import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentosModule } from '../agendamentos/agendamentos.module';
import { AgendamentosService } from '../agendamentos/agendamentos.service';
import { ClientesModule } from '../clientes/clientes.module';
import { ClientesService } from '../clientes/clientes.service';
import { ImoveisModule } from '../imoveis/imoveis.module';
import { ImoveisService } from '../imoveis/imoveis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import {
  AvisosService,
  MENSAGEM_BANNER_PADRAO,
} from './avisos.service';

describe('AvisosService (RN13, RN14, RN15)', () => {
  let avisosService: AvisosService;
  let agendamentosService: AgendamentosService;
  let clientesService: ClientesService;
  let imoveisService: ImoveisService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ClientesModule, ImoveisModule, AgendamentosModule],
      providers: [AvisosService],
    }).compile();

    avisosService = module.get<AvisosService>(AvisosService);
    agendamentosService = module.get<AgendamentosService>(AgendamentosService);
    clientesService = module.get<ClientesService>(ClientesService);
    imoveisService = module.get<ImoveisService>(ImoveisService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RN13/RN14/RN15: deve identificar e disparar avisos para compromissos próximos, retornos atrasados e tarefas sem data, permitindo dispensá-los', async () => {
    const agoraRef = new Date('2026-10-20T12:00:00.000Z');

    const cliente = await clientesService.create({
      nomeCompleto: 'Fernanda Lima',
      cpf: '77788899900',
      telefone: '83996665544',
      canalPrincipalContato: 'WHATSAPP',
    });

    const imovel = await imoveisService.create({
      endereco: 'Rua Bancários, 400',
      bairro: 'Bancários',
    });

    // 1. Compromisso próximo (daqui a 4 horas)
    await agendamentosService.create({
      titulo: 'Visita Apto Bancários',
      tipo: 'VISITA',
      dataHora: '2026-10-20T16:00:00.000Z',
      clienteId: cliente.id,
      imovelId: imovel.id,
    });

    // 2. Retorno atrasado (ontem)
    await agendamentosService.create({
      titulo: 'Dar retorno sobre contraproposta',
      tipo: 'RETORNO',
      dataHora: '2026-10-19T10:00:00.000Z',
      clienteId: cliente.id,
    });

    // 3. Atendimento com próxima ação sem data (dor da Persona Junior)
    await agendamentosService.create({
      titulo: 'Atendimento via WhatsApp',
      tipo: 'ATENDIMENTO',
      proximaAcao: 'Confirmar documentação do FGTS',
      clienteId: cliente.id,
    });

    const disparado = await avisosService.dispararAvisosProximos({
      agora: agoraRef,
      horasAntecedencia: 24,
    });

    expect(disparado.possuiAvisos).toBe(true);
    expect(disparado.mensagemBanner).toBe(MENSAGEM_BANNER_PADRAO);
    expect(disparado.totalDisparados).toBe(3);
    expect(disparado.totalProximos).toBe(1);
    expect(disparado.totalAtrasados).toBe(1);
    expect(disparado.totalSemData).toBe(1);

    // Dispensar o aviso de compromisso próximo
    const avisoProximo = disparado.avisos.find(
      (a) => a.tipoAviso === 'COMPROMISSO_PROXIMO',
    );
    expect(avisoProximo).toBeDefined();

    const dispensado = await avisosService.dispensarAviso(avisoProximo.id);
    expect(dispensado.status).toBe('DISPENSADO');

    // Nova consulta não deve repetir o aviso dispensado
    const novaConsulta = await avisosService.consultarAvisosProximos({
      agora: agoraRef,
      horasAntecedencia: 24,
    });
    expect(novaConsulta.totalProximos).toBe(0);
    expect(novaConsulta.totalAlertas).toBe(2);
  });
});
