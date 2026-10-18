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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { VincularImoveisDto } from './dto/vincular-imoveis.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@Roles('CORRETOR', 'CADASTRADOR')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({
    summary:
      'Cadastrar cliente com canal principal de contato, observações e imóveis de interesse (RN04/RN05)',
  })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes com busca e filtro por canal de contato' })
  @ApiQuery({ name: 'busca', required: false })
  @ApiQuery({ name: 'canalPrincipalContato', required: false })
  findAll(
    @Query('busca') busca?: string,
    @Query('canalPrincipalContato') canalPrincipalContato?: string,
  ) {
    return this.clientesService.findAll({ busca, canalPrincipalContato });
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Detalhar cliente com imóveis de interesse e histórico de agendamentos/atendimentos',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um cliente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Post(':id/imoveis-interesse')
  @ApiOperation({
    summary: 'Associar um ou mais imóveis de interesse ao cliente (RN05)',
  })
  vincularImoveis(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VincularImoveisDto,
  ) {
    return this.clientesService.vincularImoveisInteresse(id, dto.imovelIds);
  }

  @Delete(':id/imoveis-interesse/:imovelId')
  @ApiOperation({ summary: 'Desvincular um imóvel de interesse do cliente' })
  desvincularImovel(
    @Param('id', ParseIntPipe) id: number,
    @Param('imovelId', ParseIntPipe) imovelId: number,
  ) {
    return this.clientesService.desvincularImovelInteresse(id, imovelId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um cliente' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
