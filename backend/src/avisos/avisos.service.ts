import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const MENSAGEM_BANNER_PADRAO =
  'Você tem agendamentos proximo do dias marcados';

export interface OpcoesVerificacaoAvisos {
  horasAntecedencia?: number;
  corretorId?: number;
  agora?: Date;
}

@Injectable()
export class AvisosService {
  constructor(private readonly prisma: PrismaService) {}

  private classificarAgendamentosParaAviso(
    agendamentos: any[],
    dispensadosSet: Set<string>,
    agora: Date,
    horasAntecedencia: number,
  ) {
    const limiteFuturo = new Date(
      agora.getTime() + horasAntecedencia * 3600_000,
    );

    const proximos: any[] = [];
    const atrasados: any[] = [];
    const semData: any[] = [];

    for (const ag of agendamentos) {
      const dataRef: Date | null = ag.dataHora || ag.dataRetorno || null;

      if (!dataRef) {
        const chave = `${ag.id}:TAREFA_SEM_DATA`;
        if (!dispensadosSet.has(chave)) {
          semData.push({
            tipoAviso: 'TAREFA_SEM_DATA',
            titulo: `Retorno/ação sem data: ${ag.titulo}`,
            mensagem: ag.proximaAcao
              ? `O atendimento de ${ag.cliente?.nomeCompleto || 'cliente'} possui a próxima ação "${ag.proximaAcao}" sem data de retorno definida.`
              : `O atendimento "${ag.titulo}" de ${ag.cliente?.nomeCompleto || 'cliente'} está pendente sem data definida.`,
            agendamento: ag,
          });
        }
        continue;
      }

      const instante = new Date(dataRef).getTime();
      if (instante < agora.getTime()) {
        const chave = `${ag.id}:RETORNO_ATRASADO`;
        if (!dispensadosSet.has(chave)) {
          atrasados.push({
            tipoAviso: 'RETORNO_ATRASADO',
            titulo: `Compromisso/retorno em atraso: ${ag.titulo}`,
            mensagem: `O compromisso "${ag.titulo}" com ${ag.cliente?.nomeCompleto || 'cliente'} estava previsto para ${new Date(dataRef).toISOString()} e continua pendente.`,
            agendamento: ag,
          });
        }
      } else if (instante <= limiteFuturo.getTime()) {
        const chave = `${ag.id}:COMPROMISSO_PROXIMO`;
        if (!dispensadosSet.has(chave)) {
          proximos.push({
            tipoAviso: 'COMPROMISSO_PROXIMO',
            titulo: `Compromisso próximo: ${ag.titulo}`,
            mensagem: `${MENSAGEM_BANNER_PADRAO} — "${ag.titulo}" com ${ag.cliente?.nomeCompleto || 'cliente'} via ${ag.canalContato || ag.cliente?.canalPrincipalContato || 'WHATSAPP'}.`,
            agendamento: ag,
          });
        }
      }
    }

    return { proximos, atrasados, semData };
  }

  async consultarAvisosProximos(opcoes?: OpcoesVerificacaoAvisos) {
    const horasAntecedencia =
      opcoes?.horasAntecedencia && opcoes.horasAntecedencia > 0
        ? opcoes.horasAntecedencia
        : 48;
    const agora = opcoes?.agora ? new Date(opcoes.agora) : new Date();

    const agendamentosAtivos = await this.prisma.agendamento.findMany({
      where: {
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        ...(opcoes?.corretorId !== undefined
          ? { corretorId: opcoes.corretorId }
          : {}),
      },
      include: {
        cliente: true,
        imovel: true,
      },
      orderBy: [{ dataHora: 'asc' }, { id: 'desc' }],
    });

    const avisosDispensados = await this.prisma.aviso.findMany({
      where: { status: 'DISPENSADO' },
      select: { agendamentoId: true, tipoAviso: true },
    });

    const dispensadosSet = new Set(
      avisosDispensados.map((a) => `${a.agendamentoId}:${a.tipoAviso}`),
    );

    const { proximos, atrasados, semData } =
      this.classificarAgendamentosParaAviso(
        agendamentosAtivos,
        dispensadosSet,
        agora,
        horasAntecedencia,
      );

    const todosAlertas = [...proximos, ...atrasados, ...semData];
    const possuiAvisos = todosAlertas.length > 0;

    return {
      possuiAvisos,
      mensagemBanner: possuiAvisos ? MENSAGEM_BANNER_PADRAO : null,
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

  async dispararAvisosProximos(opcoes?: OpcoesVerificacaoAvisos) {
    const consulta = await this.consultarAvisosProximos(opcoes);
    const avisosPersistidos: any[] = [];

    for (const item of consulta.alertas) {
      const ag = item.agendamento;
      const existente = await this.prisma.aviso.findUnique({
        where: {
          agendamentoId_tipoAviso: {
            agendamentoId: ag.id,
            tipoAviso: item.tipoAviso,
          },
        },
      });

      if (existente && existente.status === 'DISPENSADO') {
        continue;
      }

      const salvo = await this.prisma.aviso.upsert({
        where: {
          agendamentoId_tipoAviso: {
            agendamentoId: ag.id,
            tipoAviso: item.tipoAviso,
          },
        },
        create: {
          tipoAviso: item.tipoAviso,
          titulo: item.titulo,
          mensagem: item.mensagem,
          status: 'PENDENTE',
          agendamentoId: ag.id,
          usuarioId: ag.corretorId ?? null,
        },
        update: {
          titulo: item.titulo,
          mensagem: item.mensagem,
        },
        include: {
          agendamento: {
            include: {
              cliente: true,
              imovel: true,
            },
          },
        },
      });

      avisosPersistidos.push(salvo);
    }

    return {
      possuiAvisos: avisosPersistidos.length > 0,
      mensagemBanner:
        avisosPersistidos.length > 0 ? MENSAGEM_BANNER_PADRAO : null,
      totalDisparados: avisosPersistidos.length,
      totalProximos: consulta.totalProximos,
      totalAtrasados: consulta.totalAtrasados,
      totalSemData: consulta.totalSemData,
      avisos: avisosPersistidos,
    };
  }

  async listarAvisos(filtros?: { status?: string; usuarioId?: number }) {
    return this.prisma.aviso.findMany({
      where: {
        ...(filtros?.status ? { status: filtros.status } : {}),
        ...(filtros?.usuarioId !== undefined
          ? { usuarioId: filtros.usuarioId }
          : {}),
      },
      include: {
        agendamento: {
          include: {
            cliente: true,
            imovel: true,
          },
        },
      },
      orderBy: { disparadoEm: 'desc' },
    });
  }

  async dispensarAviso(id: number) {
    const aviso = await this.prisma.aviso.findUnique({ where: { id } });
    if (!aviso) {
      throw new NotFoundException(`Aviso com ID ${id} não encontrado`);
    }

    return this.prisma.aviso.update({
      where: { id },
      data: {
        status: 'DISPENSADO',
        dispensadoEm: new Date(),
      },
      include: {
        agendamento: {
          include: { cliente: true, imovel: true },
        },
      },
    });
  }
}
