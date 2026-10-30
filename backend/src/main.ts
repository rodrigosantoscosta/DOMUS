import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DOMUS API — Gestão de Rotina Comercial do Corretor de Imóveis')
    .setDescription(
      'API RESTful em TypeScript/NestJS baseada no Diagnóstico da Problemática e Plano de Intervenção (UNIESP 2026.2): Usuários, Autenticação, Clientes, Imóveis, Agendamentos (Visitas e Retornos), Visualização de Atendimentos e Disparo de Avisos de Agendamentos Próximos.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`DOMUS Backend rodando em: http://localhost:${port}/api`);
  console.log(`Swagger Docs disponível em: http://localhost:${port}/api/docs`);
  try {
    const prisma = app.get(PrismaService);
    const usuariosCount = await prisma.usuario.count();
    if (usuariosCount === 0) {
      console.warn('[DOMUS Backend] AVISO: Banco de dados SQLite sem usuários. Execute "npm run prisma:seed" para popular a Persona Junior.');
    }
  } catch {
    // ignorar caso prisma nao esteja conectado
  }
}

if (require.main === module) {
  void bootstrap();
}
