import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { AuthModule } from './auth/auth.module';
import { Public } from './auth/decorators/public.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AvisosModule } from './avisos/avisos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ImoveisModule } from './imoveis/imoveis.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@ApiTags('Status')
@Controller()
export class HealthController {
  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Verificar status da API DOMUS e módulos ativos do Diagnóstico (.docx)',
  })
  status() {
    return {
      sistema: 'DOMUS Backend API',
      versao: '1.0.0',
      status: 'online',
      escopo: 'Diagnóstico da Problemática e Plano de Intervenção (PDM e PE - 2026.2)',
      modulosAtivos: [
        'UsuariosModule (Cadastro de usuários e perfis)',
        'AuthModule (Login e autenticação JWT)',
        'ImoveisModule (Cadastro de imóveis)',
        'ClientesModule (Cadastro de clientes e imóveis de interesse)',
        'AgendamentosModule (Cadastro de agendamento, visitas, retornos, visualização de atendimentos e Google Calendar)',
        'AvisosModule (Disparar avisos de agendamentos próximos, retornos atrasados e tarefas sem data)',
      ],
    };
  }
}

@Module({
  imports: [
    PrismaModule,
    UsuariosModule,
    AuthModule,
    ClientesModule,
    ImoveisModule,
    AgendamentosModule,
    AvisosModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
