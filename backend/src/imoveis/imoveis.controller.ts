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
import { CreateImovelDto } from './dto/create-imovel.dto';
import { UpdateImovelDto } from './dto/update-imovel.dto';
import { ImoveisService } from './imoveis.service';

@ApiTags('Imóveis')
@ApiBearerAuth()
@Roles('CORRETOR', 'CADASTRADOR')
@Controller('imoveis')
export class ImoveisController {
  constructor(private readonly imoveisService: ImoveisService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo imóvel (RN06)' })
  create(@Body() createImovelDto: CreateImovelDto) {
    return this.imoveisService.create(createImovelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar imóveis com filtros opcionais' })
  @ApiQuery({ name: 'finalidade', required: false })
  @ApiQuery({ name: 'tipoImovel', required: false })
  @ApiQuery({ name: 'bairro', required: false })
  @ApiQuery({ name: 'statusImovel', required: false })
  @ApiQuery({ name: 'proprietarioId', required: false, type: Number })
  findAll(
    @Query('finalidade') finalidade?: string,
    @Query('tipoImovel') tipoImovel?: string,
    @Query('bairro') bairro?: string,
    @Query('statusImovel') statusImovel?: string,
    @Query('proprietarioId') proprietarioId?: string,
  ) {
    return this.imoveisService.findAll({
      finalidade,
      tipoImovel,
      bairro,
      statusImovel,
      proprietarioId: proprietarioId ? Number(proprietarioId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhes do imóvel, proprietário, interessados e visitas',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imoveisService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um imóvel' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateImovelDto: UpdateImovelDto,
  ) {
    return this.imoveisService.update(id, updateImovelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um imóvel' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imoveisService.remove(id);
  }
}
