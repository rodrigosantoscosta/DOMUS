import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { AgendamentosService } from './agendamentos.service';
import { ConcluirAgendamentoDto } from './dto/concluir-agendamento.dto';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ProgramarRetornoDto } from './dto/programar-retorno.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';

@ApiTags('Agendamentos e Atendimentos')
@ApiBearerAuth()
@Roles('CORRETOR', 'CADASTRADOR')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @Post()
  @ApiOperation({
    summary:
      'Cadastrar agendamento (Agendar Visita, Programar Retorno ou Registrar Atendimento — RN07/RN08/RN10)',
  })
  create(@Body() createAgendamentoDto: CreateAgendamentoDto) {
    return this.agendamentosService.create(createAgendamentoDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar atendimentos e agendamentos com filtros por cliente, imóvel, tipo e pendências (RN11)',
  })
  @ApiQuery({ name: 'clienteId', required: false, type: Number })
  @ApiQuery({ name: 'imovelId', required: false, type: Number })
  @ApiQuery({ name: 'corretorId', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'apenasPendentes', required: false, type: Boolean })
  @ApiQuery({ name: 'semDataRetorno', required: false, type: Boolean })
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('imovelId') imovelId?: string,
    @Query('corretorId') corretorId?: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('apenasPendentes') apenasPendentes?: string,
    @Query('semDataRetorno') semDataRetorno?: string,
  ) {
    return this.agendamentosService.findAll({
      clienteId: clienteId ? Number(clienteId) : undefined,
      imovelId: imovelId ? Number(imovelId) : undefined,
      corretorId: corretorId ? Number(corretorId) : undefined,
      tipo,
      status,
      apenasPendentes: apenasPendentes === 'true',
      semDataRetorno: semDataRetorno === 'true',
    });
  }

  @Get('visao-geral')
  @ApiOperation({
    summary:
      'Visualizar próximos compromissos organizados por cliente e por imóvel + tarefas sem data (Seção 4.3 do .docx — RN11)',
  })
  @ApiQuery({ name: 'corretorId', required: false, type: Number })
  obterVisaoGeral(@Query('corretorId') corretorId?: string) {
    return this.agendamentosService.obterVisaoGeral(
      corretorId ? Number(corretorId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Visualizar detalhes completos de um agendamento/atendimento (botão Visualizar da Tela 3)',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agendamentosService.findOne(id);
  }

  @Post(':id/programar-retorno')
  @ApiOperation({
    summary:
      'Programar um retorno associado a uma visita ou atendimento existente (Seção 4.1 e 4.3 do .docx — RN09)',
  })
  programarRetorno(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProgramarRetornoDto,
  ) {
    return this.agendamentosService.programarRetorno(id, dto);
  }

  @Patch(':id/concluir')
  @ApiOperation({
    summary:
      'Marcar agendamento/atendimento como concluído e registrar próxima ação (RN12)',
  })
  concluir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirAgendamentoDto,
  ) {
    return this.agendamentosService.concluir(id, dto);
  }

  @Post(':id/sincronizar-google-calendar')
  @ApiOperation({
    summary:
      'Gerar evento e URL de sincronização opcional com o Google Calendar (Seção 4.1 do .docx — RN16)',
  })
  sincronizarGoogleCalendar(@Param('id', ParseIntPipe) id: number) {
    return this.agendamentosService.sincronizarGoogleCalendar(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um agendamento' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgendamentoDto: UpdateAgendamentoDto,
  ) {
    return this.agendamentosService.update(id, updateAgendamentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um agendamento' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agendamentosService.remove(id);
  }
}
