import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConcluirAgendamentoDto } from './dto/concluir-agendamento.dto';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ProgramarRetornoDto } from './dto/programar-retorno.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';

@Injectable()
export class AgendamentosService {
  constructor(private readonly prisma: PrismaService) {}

  interpretarDataHora(
    data?: string | null,
    hora?: string | null,
    dataHoraIso?: string | null,
  ): Date | null {
    if (dataHoraIso && dataHoraIso.trim()) {
      const parsed = new Date(dataHoraIso.trim());
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(
          `Formato de dataHora inválido: ${dataHoraIso}`,
        );
      }
      return parsed;
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
        throw new BadRequestException(
          `Formato de data inválido: ${data}. Use YYYY-MM-DD ou DD/MM/YYYY`,
        );
      }
      return tentativa;
    }

    const matchHora = /^(\d{1,2}):(\d{2})$/.exec(horaLimpa);
    if (!matchHora) {
      throw new BadRequestException(
        `Formato de hora inválido: ${hora}. Use HH:mm`,
      );
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
      throw new BadRequestException('Data ou hora fora do intervalo válido');
    }

    const isoString = `${String(ano).padStart(4, '0')}-${String(mes).padStart(
      2,
      '0',
    )}-${String(dia).padStart(2, '0')}T${String(horas).padStart(
      2,
      '0',
    )}:${String(minutos).padStart(2, '0')}:00.000Z`;

    const resultado = new Date(isoString);
    if (isNaN(resultado.getTime())) {
      throw new BadRequestException('Data ou hora inválida');
    }
    return resultado;
  }

  interpretarDuracao(duracaoMinutos?: number, duracaoTexto?: string): number {
    if (duracaoMinutos !== undefined && duracaoMinutos > 0) {
      return duracaoMinutos;
    }
    if (!duracaoTexto || !duracaoTexto.trim()) {
      return 60;
    }
    const texto = duracaoTexto.trim().toLowerCase();
    const matchHorasMinutos = /^(\d+)\s*h(?:\s*(\d+))?/.exec(texto);
    if (matchHorasMinutos) {
      const h = Number(matchHorasMinutos[1]) * 60;
      const m = matchHorasMinutos[2] ? Number(matchHorasMinutos[2]) : 0;
      return h + m;
    }
    const apenasNumeros = parseInt(texto.replace(/\D/g, ''), 10);
    return !isNaN(apenasNumeros) && apenasNumeros >= 5 ? apenasNumeros : 60;
  }

  gerarDescricaoCurta(
    descricaoCurta?: string | null,
    descricao?: string | null,
    proximaAcao?: string | null,
    observacao?: string | null,
  ): string {
    if (descricaoCurta && descricaoCurta.trim()) {
      return descricaoCurta.trim().slice(0, 80);
    }
    const fonte =
      descricao?.trim() ||
      proximaAcao?.trim() ||
      observacao?.trim() ||
      'Atendimento registrado na DOMUS';
    return fonte.length > 80 ? `${fonte.slice(0, 77)}...` : fonte;
  }

  private formatarDataGoogle(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  }

  construirDadosGoogleCalendar(agendamento: {
    id?: number;
    titulo: string;
    descricao?: string | null;
    observacao?: string | null;
    proximaAcao?: string | null;
    canalContato?: string | null;
    dataHora: Date;
    duracaoMinutos: number;
    cliente?: { nomeCompleto: string; telefone: string } | null;
    imovel?: { endereco: string; bairro?: string | null } | null;
  }) {
    const inicio = new Date(agendamento.dataHora);
    const fim = new Date(
      inicio.getTime() + (agendamento.duracaoMinutos || 60) * 60_000,
    );

    const linhasDetalhes = [
      agendamento.descricao ? `Descrição: ${agendamento.descricao}` : null,
      agendamento.cliente
        ? `Cliente: ${agendamento.cliente.nomeCompleto} (${agendamento.cliente.telefone})`
        : null,
      agendamento.canalContato
        ? `Canal preferencial: ${agendamento.canalContato}`
        : null,
      agendamento.imovel
        ? `Imóvel: ${agendamento.imovel.endereco}${
            agendamento.imovel.bairro ? ` - ${agendamento.imovel.bairro}` : ''
          }`
        : null,
      agendamento.proximaAcao
        ? `Próxima ação: ${agendamento.proximaAcao}`
        : null,
      agendamento.observacao ? `Observações: ${agendamento.observacao}` : null,
    ].filter(Boolean);

    const detailsTexto = linhasDetalhes.join('\n');
    const locationTexto = agendamento.imovel?.endereco || '';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[DOMUS] ${agendamento.titulo}`,
      dates: `${this.formatarDataGoogle(inicio)}/${this.formatarDataGoogle(fim)}`,
      details: detailsTexto,
      ...(locationTexto ? { location: locationTexto } : {}),
    });

    const eventId = `domus-evt-${agendamento.id || Date.now()}`;
    const calendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;

    return {
      googleCalendarEventId: eventId,
      googleCalendarUrl: calendarUrl,
      eventoGoogleApi: {
        summary: `[DOMUS] ${agendamento.titulo}`,
        description: detailsTexto,
        location: locationTexto || undefined,
        start: { dateTime: inicio.toISOString() },
        end: { dateTime: fim.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      },
    };
  }

  private async validarConflitoHorarioCorretor(params: {
    corretorId?: number | null;
    dataHora?: Date | null;
    duracaoMinutos: number;
    status: string;
    ignorarAgendamentoId?: number;
  }) {
    const {
      corretorId,
      dataHora,
      duracaoMinutos,
      status,
      ignorarAgendamentoId,
    } = params;

    if (
      !corretorId ||
      !dataHora ||
      !['PENDENTE', 'CONFIRMADO'].includes(status)
    ) {
      return;
    }

    const inicioNovo = dataHora.getTime();
    const fimNovo = inicioNovo + duracaoMinutos * 60_000;

    const compromissosDoCorretor = await this.prisma.agendamento.findMany({
      where: {
        corretorId,
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        dataHora: { not: null },
        ...(ignorarAgendamentoId ? { id: { not: ignorarAgendamentoId } } : {}),
      },
    });

    for (const existente of compromissosDoCorretor) {
      if (!existente.dataHora) continue;
      const inicioExistente = existente.dataHora.getTime();
      const fimExistente =
        inicioExistente + (existente.duracaoMinutos || 60) * 60_000;

      if (inicioNovo < fimExistente && fimNovo > inicioExistente) {
        throw new ConflictException(
          `Conflito de agenda: o corretor já possui o compromisso "${existente.titulo}" agendado neste horário`,
        );
      }
    }
  }

  async create(dto: CreateAgendamentoDto) {
    const tipo = dto.tipo || 'ATENDIMENTO';
    const status = dto.status || 'PENDENTE';

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException(
        `Cliente com ID ${dto.clienteId} não encontrado`,
      );
    }

    if (tipo === 'VISITA' && !dto.imovelId) {
      throw new BadRequestException(
        'Para agendar uma visita (tipo VISITA), é obrigatório selecionar um imóvel cadastrado (imovelId)',
      );
    }

    let imovel: any = null;
    if (dto.imovelId) {
      imovel = await this.prisma.imovel.findUnique({
        where: { id: dto.imovelId },
      });
      if (!imovel) {
        throw new NotFoundException(
          `Imóvel com ID ${dto.imovelId} não encontrado`,
        );
      }
    }

    if (dto.corretorId) {
      const corretor = await this.prisma.usuario.findUnique({
        where: { id: dto.corretorId },
      });
      if (!corretor) {
        throw new NotFoundException(
          `Corretor com ID ${dto.corretorId} não encontrado`,
        );
      }
    }

    const dataHora = this.interpretarDataHora(
      dto.data,
      dto.hora,
      dto.dataHora,
    );

    if (tipo === 'VISITA' && !dataHora) {
      throw new BadRequestException(
        'Para agendar uma visita (tipo VISITA), é obrigatório informar a data e hora do compromisso',
      );
    }

    const dataRetorno = dto.dataRetorno
      ? this.interpretarDataHora(null, null, dto.dataRetorno)
      : tipo === 'RETORNO' && dataHora
        ? dataHora
        : null;

    const duracaoMinutos = this.interpretarDuracao(
      dto.duracaoMinutos,
      dto.duracao,
    );

    await this.validarConflitoHorarioCorretor({
      corretorId: dto.corretorId,
      dataHora,
      duracaoMinutos,
      status,
    });

    const canalContato = dto.canalContato || cliente.canalPrincipalContato;
    const descricaoCurta = this.gerarDescricaoCurta(
      dto.descricaoCurta,
      dto.descricao,
      dto.proximaAcao,
      dto.observacao,
    );

    const criado = await this.prisma.agendamento.create({
      data: {
        titulo: dto.titulo.trim(),
        descricao: dto.descricao?.trim() || null,
        descricaoCurta,
        tipo,
        status,
        dataHora,
        duracaoMinutos,
        observacao: dto.observacao?.trim() || null,
        canalContato,
        proximaAcao: dto.proximaAcao?.trim() || null,
        dataRetorno,
        sincronizarGoogleCalendar: dto.sincronizarGoogleCalendar ?? false,
        clienteId: dto.clienteId,
        imovelId: dto.imovelId ?? null,
        corretorId: dto.corretorId ?? null,
      },
      include: {
        cliente: true,
        imovel: true,
      },
    });

    if (criado.sincronizarGoogleCalendar && criado.dataHora) {
      const googleDados = this.construirDadosGoogleCalendar({
        id: criado.id,
        titulo: criado.titulo,
        descricao: criado.descricao,
        observacao: criado.observacao,
        proximaAcao: criado.proximaAcao,
        canalContato: criado.canalContato,
        dataHora: criado.dataHora,
        duracaoMinutos: criado.duracaoMinutos,
        cliente: criado.cliente,
        imovel: criado.imovel,
      });

      return this.prisma.agendamento.update({
        where: { id: criado.id },
        data: {
          googleCalendarEventId: googleDados.googleCalendarEventId,
          googleCalendarUrl: googleDados.googleCalendarUrl,
        },
        include: {
          cliente: true,
          imovel: true,
        },
      });
    }

    return criado;
  }

  async findAll(filtros?: {
    clienteId?: number;
    imovelId?: number;
    corretorId?: number;
    tipo?: string;
    status?: string;
    apenasPendentes?: boolean;
    semDataRetorno?: boolean;
  }) {
    return this.prisma.agendamento.findMany({
      where: {
        ...(filtros?.clienteId !== undefined
          ? { clienteId: filtros.clienteId }
          : {}),
        ...(filtros?.imovelId !== undefined
          ? { imovelId: filtros.imovelId }
          : {}),
        ...(filtros?.corretorId !== undefined
          ? { corretorId: filtros.corretorId }
          : {}),
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.status ? { status: filtros.status } : {}),
        ...(filtros?.apenasPendentes
          ? { status: { in: ['PENDENTE', 'CONFIRMADO'] } }
          : {}),
        ...(filtros?.semDataRetorno
          ? {
              dataHora: null,
              dataRetorno: null,
              status: { in: ['PENDENTE', 'CONFIRMADO'] },
            }
          : {}),
      },
      include: {
        cliente: true,
        imovel: true,
      },
      orderBy: [{ dataHora: 'asc' }, { id: 'desc' }],
    });
  }

  async obterVisaoGeral(corretorId?: number) {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        ...(corretorId !== undefined ? { corretorId } : {}),
      },
      include: {
        cliente: true,
        imovel: true,
      },
      orderBy: [{ dataHora: 'asc' }, { id: 'desc' }],
    });

    const proximosCompromissos = agendamentos.filter((a) =>
      ['PENDENTE', 'CONFIRMADO'].includes(a.status),
    );

    const tarefasSemData = proximosCompromissos.filter(
      (a) => !a.dataHora && !a.dataRetorno,
    );

    const mapaPorCliente = new Map<
      number,
      {
        cliente: any;
        totalCompromissos: number;
        pendentes: number;
        compromissos: any[];
      }
    >();

    const mapaPorImovel = new Map<
      number,
      {
        imovel: any;
        totalCompromissos: number;
        pendentes: number;
        compromissos: any[];
      }
    >();

    for (const item of agendamentos) {
      if (item.cliente) {
        const grupoCliente = mapaPorCliente.get(item.clienteId) || {
          cliente: item.cliente,
          totalCompromissos: 0,
          pendentes: 0,
          compromissos: [],
        };
        grupoCliente.totalCompromissos += 1;
        if (['PENDENTE', 'CONFIRMADO'].includes(item.status)) {
          grupoCliente.pendentes += 1;
        }
        grupoCliente.compromissos.push(item);
        mapaPorCliente.set(item.clienteId, grupoCliente);
      }

      if (item.imovel && item.imovelId) {
        const grupoImovel = mapaPorImovel.get(item.imovelId) || {
          imovel: item.imovel,
          totalCompromissos: 0,
          pendentes: 0,
          compromissos: [],
        };
        grupoImovel.totalCompromissos += 1;
        if (['PENDENTE', 'CONFIRMADO'].includes(item.status)) {
          grupoImovel.pendentes += 1;
        }
        grupoImovel.compromissos.push(item);
        mapaPorImovel.set(item.imovelId, grupoImovel);
      }
    }

    return {
      totalAtendimentos: agendamentos.length,
      totalPendentes: proximosCompromissos.length,
      totalSemData: tarefasSemData.length,
      proximosCompromissos,
      tarefasSemData,
      porCliente: Array.from(mapaPorCliente.values()),
      porImovel: Array.from(mapaPorImovel.values()),
    };
  }

  async findOne(id: number) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        imovel: true,
        agendamentoOrigem: true,
        retornosDerivados: true,
        avisos: true,
      },
    });
    if (!agendamento) {
      throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
    }
    return agendamento;
  }

  async programarRetorno(agendamentoOrigemId: number, dto: ProgramarRetornoDto) {
    const origem = await this.findOne(agendamentoOrigemId);

    const dataHora = this.interpretarDataHora(
      dto.data,
      dto.hora,
      dto.dataHora,
    );
    if (!dataHora) {
      throw new BadRequestException(
        'Para programar um retorno, informe a data e hora do compromisso',
      );
    }

    const duracaoMinutos = dto.duracaoMinutos ?? 30;

    await this.validarConflitoHorarioCorretor({
      corretorId: origem.corretorId,
      dataHora,
      duracaoMinutos,
      status: 'PENDENTE',
    });

    const canalContato =
      dto.canalContato ||
      origem.canalContato ||
      origem.cliente.canalPrincipalContato;

    const descricaoCurta = this.gerarDescricaoCurta(
      null,
      dto.descricao,
      dto.proximaAcao,
      dto.observacao,
    );

    const novoRetorno = await this.prisma.agendamento.create({
      data: {
        titulo: dto.titulo.trim(),
        descricao: dto.descricao?.trim() || null,
        descricaoCurta,
        tipo: 'RETORNO',
        status: 'PENDENTE',
        dataHora,
        duracaoMinutos,
        observacao: dto.observacao?.trim() || null,
        canalContato,
        proximaAcao: dto.proximaAcao?.trim() || null,
        dataRetorno: dataHora,
        sincronizarGoogleCalendar: dto.sincronizarGoogleCalendar ?? false,
        clienteId: origem.clienteId,
        imovelId: origem.imovelId,
        corretorId: origem.corretorId,
        agendamentoOrigemId: origem.id,
      },
      include: {
        cliente: true,
        imovel: true,
        agendamentoOrigem: true,
      },
    });

    if (novoRetorno.sincronizarGoogleCalendar && novoRetorno.dataHora) {
      const googleDados = this.construirDadosGoogleCalendar({
        id: novoRetorno.id,
        titulo: novoRetorno.titulo,
        descricao: novoRetorno.descricao,
        observacao: novoRetorno.observacao,
        proximaAcao: novoRetorno.proximaAcao,
        canalContato: novoRetorno.canalContato,
        dataHora: novoRetorno.dataHora,
        duracaoMinutos: novoRetorno.duracaoMinutos,
        cliente: novoRetorno.cliente,
        imovel: novoRetorno.imovel,
      });

      return this.prisma.agendamento.update({
        where: { id: novoRetorno.id },
        data: {
          googleCalendarEventId: googleDados.googleCalendarEventId,
          googleCalendarUrl: googleDados.googleCalendarUrl,
        },
        include: {
          cliente: true,
          imovel: true,
          agendamentoOrigem: true,
        },
      });
    }

    return novoRetorno;
  }

  async concluir(id: number, dto?: ConcluirAgendamentoDto) {
    const atual = await this.findOne(id);

    const dataRetornoInterpretada = dto?.dataRetorno
      ? this.interpretarDataHora(null, null, dto.dataRetorno)
      : atual.dataRetorno;

    const concluido = await this.prisma.agendamento.update({
      where: { id },
      data: {
        status: 'CONCLUIDO',
        ...(dto?.observacao !== undefined
          ? { observacao: dto.observacao.trim() }
          : {}),
        ...(dto?.proximaAcao !== undefined
          ? { proximaAcao: dto.proximaAcao.trim() }
          : {}),
        ...(dataRetornoInterpretada !== undefined
          ? { dataRetorno: dataRetornoInterpretada }
          : {}),
      },
      include: {
        cliente: true,
        imovel: true,
      },
    });

    await this.prisma.aviso.updateMany({
      where: { agendamentoId: id, status: 'PENDENTE' },
      data: { status: 'DISPENSADO', dispensadoEm: new Date() },
    });

    let retornoCriado: any = null;
    if (
      dto?.gerarAgendamentoRetorno &&
      (dto.proximaAcao || dataRetornoInterpretada)
    ) {
      const tituloRetorno = dto.proximaAcao
        ? `Retorno: ${dto.proximaAcao}`
        : `Retorno de ${atual.titulo}`;
      retornoCriado = await this.prisma.agendamento.create({
        data: {
          titulo: tituloRetorno,
          descricao: dto.observacao || atual.descricao,
          descricaoCurta: this.gerarDescricaoCurta(
            null,
            dto.proximaAcao,
            dto.observacao,
            tituloRetorno,
          ),
          tipo: 'RETORNO',
          status: 'PENDENTE',
          dataHora: dataRetornoInterpretada,
          duracaoMinutos: 30,
          observacao: dto.observacao || null,
          canalContato: atual.canalContato || atual.cliente.canalPrincipalContato,
          proximaAcao: dto.proximaAcao || null,
          dataRetorno: dataRetornoInterpretada,
          clienteId: atual.clienteId,
          imovelId: atual.imovelId,
          corretorId: atual.corretorId,
          agendamentoOrigemId: atual.id,
        },
        include: {
          cliente: true,
          imovel: true,
        },
      });
    }

    return {
      ...concluido,
      retornoGerado: retornoCriado,
    };
  }

  async sincronizarGoogleCalendar(id: number) {
    const agendamento = await this.findOne(id);
    if (!agendamento.dataHora) {
      throw new BadRequestException(
        'Não é possível sincronizar com o Google Calendar um atendimento sem data e hora definidas',
      );
    }

    const googleDados = this.construirDadosGoogleCalendar({
      id: agendamento.id,
      titulo: agendamento.titulo,
      descricao: agendamento.descricao,
      observacao: agendamento.observacao,
      proximaAcao: agendamento.proximaAcao,
      canalContato: agendamento.canalContato,
      dataHora: agendamento.dataHora,
      duracaoMinutos: agendamento.duracaoMinutos,
      cliente: agendamento.cliente,
      imovel: agendamento.imovel,
    });

    const atualizado = await this.prisma.agendamento.update({
      where: { id },
      data: {
        sincronizarGoogleCalendar: true,
        googleCalendarEventId: googleDados.googleCalendarEventId,
        googleCalendarUrl: googleDados.googleCalendarUrl,
      },
      include: {
        cliente: true,
        imovel: true,
      },
    });

    return {
      agendamento: atualizado,
      ...googleDados,
    };
  }

  async update(id: number, dto: UpdateAgendamentoDto) {
    const existente = await this.findOne(id);

    const novoTipo = dto.tipo || existente.tipo;
    const novoStatus = dto.status || existente.status;
    const novoImovelId =
      dto.imovelId !== undefined ? dto.imovelId : existente.imovelId;
    const novoCorretorId =
      dto.corretorId !== undefined ? dto.corretorId : existente.corretorId;

    const novaDataHora =
      dto.data !== undefined ||
      dto.hora !== undefined ||
      dto.dataHora !== undefined
        ? this.interpretarDataHora(dto.data, dto.hora, dto.dataHora)
        : existente.dataHora;

    if (novoTipo === 'VISITA' && !novoImovelId) {
      throw new BadRequestException(
        'Agendamentos do tipo VISITA exigem um imóvel associado (imovelId)',
      );
    }
    if (novoTipo === 'VISITA' && !novaDataHora) {
      throw new BadRequestException(
        'Agendamentos do tipo VISITA exigem data e hora definidas',
      );
    }

    const novaDuracao =
      dto.duracaoMinutos !== undefined || dto.duracao !== undefined
        ? this.interpretarDuracao(dto.duracaoMinutos, dto.duracao)
        : existente.duracaoMinutos;

    await this.validarConflitoHorarioCorretor({
      corretorId: novoCorretorId,
      dataHora: novaDataHora,
      duracaoMinutos: novaDuracao,
      status: novoStatus,
      ignorarAgendamentoId: id,
    });

    const novaDataRetorno =
      dto.dataRetorno !== undefined
        ? this.interpretarDataHora(null, null, dto.dataRetorno)
        : existente.dataRetorno;

    return this.prisma.agendamento.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
        ...(dto.descricao !== undefined
          ? { descricao: dto.descricao?.trim() || null }
          : {}),
        ...(dto.descricaoCurta !== undefined
          ? {
              descricaoCurta: this.gerarDescricaoCurta(
                dto.descricaoCurta,
                dto.descricao ?? existente.descricao,
                dto.proximaAcao ?? existente.proximaAcao,
                dto.observacao ?? existente.observacao,
              ),
            }
          : {}),
        tipo: novoTipo,
        status: novoStatus,
        dataHora: novaDataHora,
        duracaoMinutos: novaDuracao,
        ...(dto.observacao !== undefined
          ? { observacao: dto.observacao?.trim() || null }
          : {}),
        ...(dto.canalContato !== undefined
          ? { canalContato: dto.canalContato }
          : {}),
        ...(dto.proximaAcao !== undefined
          ? { proximaAcao: dto.proximaAcao?.trim() || null }
          : {}),
        dataRetorno: novaDataRetorno,
        ...(dto.sincronizarGoogleCalendar !== undefined
          ? { sincronizarGoogleCalendar: dto.sincronizarGoogleCalendar }
          : {}),
        ...(dto.clienteId !== undefined ? { clienteId: dto.clienteId } : {}),
        imovelId: novoImovelId,
        corretorId: novoCorretorId,
      },
      include: {
        cliente: true,
        imovel: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.agendamento.delete({ where: { id } });
    return { removido: true, id };
  }
}
