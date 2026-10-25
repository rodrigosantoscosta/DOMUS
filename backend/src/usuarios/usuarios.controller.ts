import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Cadastrar novo usuário (Corretor ou Cadastrador)' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Roles('CORRETOR', 'CADASTRADOR')
  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários cadastrados' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Roles('CORRETOR', 'CADASTRADOR')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Roles('CADASTRADOR')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um usuário' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Roles('CADASTRADOR')
  @Delete(':id')
  @ApiOperation({ summary: 'Remover um usuário (restrito ao perfil CADASTRADOR)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
