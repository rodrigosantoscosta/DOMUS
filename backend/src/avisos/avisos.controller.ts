import {
  Body,
  Controller,
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
import { AvisosService } from './avisos.service';
import { DispararAvisosDto } from './dto/disparar-avisos.dto';

@ApiTags('Avisos de Agendamentos Próximos')
@ApiBearerAuth()
@Roles('CORRETOR', 'CADASTRADOR')
@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Get('proximos')
  @ApiOperation({
    summary:
      'Consultar avisos de agendamentos próximos dos dias marcados, retornos atrasados e tarefas sem data (RN13/RN14)',
  })
  @ApiQuery({ name: 'horasAntecedencia', required: false, type: Number })
  @ApiQuery({ name: 'corretorId', required: false, type: Number })
  consultarProximos(
    @Query('horasAntecedencia') horasAntecedencia?: string,
    @Query('corretorId') corretorId?: string,
  ) {
    return this.avisosService.consultarAvisosProximos({
      horasAntecedencia: horasAntecedencia
        ? Number(horasAntecedencia)
        : undefined,
      corretorId: corretorId ? Number(corretorId) : undefined,
    });
  }

  @Post('disparar')
  @ApiOperation({
    summary:
      'Disparar e registrar avisos de agendamentos próximos, atrasados e pendentes sem data (Seção 5 e Tela 4 do .docx — RN13/RN14)',
  })
  disparar(@Body() dto?: DispararAvisosDto) {
    return this.avisosService.dispararAvisosProximos({
      horasAntecedencia: dto?.horasAntecedencia,
      corretorId: dto?.corretorId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar avisos disparados e seu status' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'usuarioId', required: false, type: Number })
  listar(
    @Query('status') status?: string,
    @Query('usuarioId') usuarioId?: string,
  ) {
    return this.avisosService.listarAvisos({
      status,
      usuarioId: usuarioId ? Number(usuarioId) : undefined,
    });
  }

  @Patch(':id/dispensar')
  @ApiOperation({
    summary:
      'Dispensar/fechar aviso de agendamento próximo (botão X do banner na Tela 4 — RN15)',
  })
  dispensar(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.dispensarAviso(id);
  }
}
