# DOMUS Backend (TypeScript / NestJS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o backend completo da aplicação DOMUS em TypeScript/NestJS (`backend/`) implementando e validando todas as regras de negócio (`RN01` a `RN16`) definidas no documento de Diagnóstico da Problemática e Plano de Intervenção (`docs/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx`).

**Architecture:** Aplicação modular em NestJS 11 com prefixo global `/api`, validação declarativa via `ValidationPipe` (`class-validator` / `class-transformer`), documentação OpenAPI em `/api/docs` (`@nestjs/swagger`) e persistência relacional via Prisma ORM (`PrismaService`) sobre SQLite local em dev/teste (com suporte direto a MySQL via `DATABASE_URL`). Os módulos de domínio refletem o recorte validado na Seção 5 do diagnóstico: `PrismaModule`, `UsuariosModule`, `AuthModule`, `ClientesModule`, `ImoveisModule`, `AgendamentosModule` (Visitas, Retornos, Atendimentos e Google Calendar) e `AvisosModule` (Disparo e gestão de alertas de agendamentos próximos, retornos atrasados e tarefas sem data).

**Tech Stack:** Node.js 24, TypeScript 5, NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/swagger`), Prisma ORM (`prisma`, `@prisma/client`), `bcryptjs`, `class-validator`, `class-transformer`, Jest + Supertest.

**Spec:** `docs/superpowers/specs/2026-10-17-domus-backend-nestjs-design.md`

## Global Constraints

- Diretório do backend: `d:/code/DOMUS/backend` (preservando `legacy/` intacto).
- Prefixo global da API: `/api`; documentação Swagger em `/api/docs`.
- Hashes de senha (`senhaHash`) nunca devem ser expostos em respostas da API (`RN01`/`RN02`).
- Agendamentos do tipo `VISITA` exigem obrigatoriamente `imovelId` e `dataHora` (`RN08`).
- Não permitir colisão de horário entre agendamentos ativos (`PENDENTE` ou `CONFIRMADO`) do mesmo corretor (`RN10`).
- O banner de avisos deve exibir a mensagem padrão do protótipo `"Você tem agendamentos proximo do dias marcados"` quando houver compromissos próximos, atrasados ou tarefas sem data (`RN13`/`RN14`).
- Testes automatizados (unitários + E2E) devem rodar em banco SQLite isolado sem depender de serviços externos.

## Review Focus

1. **Agendamento de visita sem imóvel (`tipo: 'VISITA'`, `imovelId: undefined`):** Deve rejeitar com `400 Bad Request` (`RN08`).
2. **Colisão de horário na agenda do corretor:** Dois agendamentos ativos (`PENDENTE`/`CONFIRMADO`) para o mesmo `corretorId` com intervalos `[dataHora, dataHora + duracaoMinutos)` sobrepostos devem retornar `409 Conflict` (`RN10`).
3. **Atendimento registrado com próxima ação mas sem data de retorno (`proximaAcao` preenchida, `dataHora: null` e `dataRetorno: null`):** Deve ser aceito para `ATENDIMENTO` e imediatamente sinalizado pelo `AvisosService` como `TAREFA_SEM_DATA` (`RN14` — dor da Persona Junior).
4. **Credenciais duplicadas (`login`, `email` ou `cpfDocumento`):** Tentativa de criar usuário ou cliente com identificador já existente deve retornar `409 Conflict` amigável em vez de erro `500` do Prisma (`RN01`/`RN04`).
5. **Aceitação flexível de data e hora do formulário mobile (`data: '2026-10-20'`, `hora: '14:30'` ou `data: '20/10/2026'`, `hora: '14:30'`):** O DTO/Service de agendamento deve converter corretamente os campos separados `data` e `hora` do protótipo mobile (`image3.png`) em `DateTime` válido (`RN07`).

---

### Task 1: Scaffolding NestJS, Schema Prisma e Infraestrutura Base `[Perfil: pro]`
**Dependências:** Nenhuma (Tarefa raiz).

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.env`
- Create: `backend/.env.example`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`

**Interfaces:**
- Produces: `PrismaService extends PrismaClient` exportado globalmente por `PrismaModule` com modelos `usuario`, `cliente`, `imovel`, `agendamento`, `aviso` e método utilitário `cleanDatabase()` para testes.

- [x] **Step 1: Inicializar `backend/` com dependências NestJS 11, Prisma, JWT, Swagger, Validation e Jest**
- [x] **Step 2: Definir `backend/prisma/schema.prisma` com os 5 modelos (`Usuario`, `Cliente`, `Imovel`, `Agendamento`, `Aviso`) e gerar Prisma Client + banco SQLite (`npx prisma db push`)**
- [x] **Step 3: Implementar `PrismaService` e `PrismaModule` (`@Global()`)**

---

### Task 2: Módulo de Usuários e Autenticação JWT (`RN01`, `RN02`, `RN03`) `[Perfil: pro]`
**Dependências:** Task 1 (`PrismaModule`).

**Files:**
- Create: `backend/src/usuarios/dto/create-usuario.dto.ts`
- Create: `backend/src/usuarios/dto/update-usuario.dto.ts`
- Create: `backend/src/usuarios/usuarios.service.ts`
- Create: `backend/src/usuarios/usuarios.controller.ts`
- Create: `backend/src/usuarios/usuarios.module.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/dto/alterar-senha.dto.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/auth/decorators/public.decorator.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Test: `backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`
- Produces:
  - `UsuariosService.create(dto: CreateUsuarioDto)` (valida `confirmarSenha === senha`, unicidade de `login`/`email`/`cpf`, hash `bcryptjs`, omite `senhaHash`)
  - `AuthService.login(dto: LoginDto)` (aceita `username` como `login` ou `email`, valida `password`, atualiza `ultimoLogin`, retorna `{ accessToken, usuario }`)
  - `AuthService.alterarSenha(usuarioId: number, dto: AlterarSenhaDto)`

- [x] **Step 1: Escrever teste unitário `auth.service.spec.ts` cobrindo cadastro de usuário (`RN01`), perfis (`RN02`), login por username/email (`RN03`) e alteração de senha**
- [x] **Step 2: Implementar `UsuariosModule` e `AuthModule` com guards JWT e sanitização de `senhaHash`**
- [x] **Step 3: Executar `npx jest src/auth/auth.service.spec.ts` e confirmar PASS**

---

### Task 3: Módulo de Clientes e Imóveis (`RN04`, `RN05`, `RN06`) `[Perfil: pro]`
**Dependências:** Task 1 (`PrismaModule`).

**Files:**
- Create: `backend/src/clientes/dto/create-cliente.dto.ts`
- Create: `backend/src/clientes/dto/update-cliente.dto.ts`
- Create: `backend/src/clientes/dto/vincular-imoveis.dto.ts`
- Create: `backend/src/clientes/clientes.service.ts`
- Create: `backend/src/clientes/clientes.controller.ts`
- Create: `backend/src/clientes/clientes.module.ts`
- Create: `backend/src/imoveis/dto/create-imovel.dto.ts`
- Create: `backend/src/imoveis/dto/update-imovel.dto.ts`
- Create: `backend/src/imoveis/imoveis.service.ts`
- Create: `backend/src/imoveis/imoveis.controller.ts`
- Create: `backend/src/imoveis/imoveis.module.ts`
- Test: `backend/src/clientes/clientes.service.spec.ts`
- Test: `backend/src/imoveis/imoveis.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`
- Produces:
  - `ClientesService.create(dto: CreateClienteDto)`, `findAll(filtros)`, `findOne(id)`, `vincularImoveisInteresse(clienteId, imovelIds)`
  - `ImoveisService.create(dto: CreateImovelDto)`, `findAll(filtros)`, `findOne(id)`

- [x] **Step 1: Escrever testes unitários `clientes.service.spec.ts` e `imoveis.service.spec.ts` cobrindo `RN04`, `RN05` e `RN06`**
- [x] **Step 2: Implementar `ImoveisModule` e `ClientesModule` com associação N:N de imóveis de interesse**
- [x] **Step 3: Executar `npx jest src/clientes src/imoveis` e confirmar PASS**

---

### Task 4: Módulo de Agendamentos, Visitas, Retornos, Visão de Atendimentos e Google Calendar (`RN07` a `RN12`, `RN16`) `[Perfil: pro]`
**Dependências:** Task 3 (`ClientesModule`, `ImoveisModule`).

**Files:**
- Create: `backend/src/agendamentos/dto/create-agendamento.dto.ts`
- Create: `backend/src/agendamentos/dto/update-agendamento.dto.ts`
- Create: `backend/src/agendamentos/dto/concluir-agendamento.dto.ts`
- Create: `backend/src/agendamentos/dto/programar-retorno.dto.ts`
- Create: `backend/src/agendamentos/agendamentos.service.ts`
- Create: `backend/src/agendamentos/agendamentos.controller.ts`
- Create: `backend/src/agendamentos/agendamentos.module.ts`
- Test: `backend/src/agendamentos/agendamentos.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`
- Produces:
  - `AgendamentosService.create(dto: CreateAgendamentoDto)` (parse de `data`+`hora` ou `dataHora`, validação `RN08` de imóvel obrigatório para `VISITA`, herança de `canalContato`, validação `RN10` de conflito de horário do corretor, geração automática de `descricaoCurta` e metadados Google Calendar se `sincronizarGoogleCalendar=true`)
  - `AgendamentosService.programarRetorno(agendamentoOrigemId: number, dto: ProgramarRetornoDto)` (`RN09`)
  - `AgendamentosService.obterVisaoGeral(corretorId?: number)` (compromissos agrupados por cliente e por imóvel + pendências — `RN11`)
  - `AgendamentosService.concluir(id: number, dto: ConcluirAgendamentoDto)` (`RN12`)
  - `AgendamentosService.sincronizarGoogleCalendar(id: number)` (`RN16`)

- [x] **Step 1: Escrever testes unitários `agendamentos.service.spec.ts` para `RN07`, `RN08`, `RN09`, `RN10`, `RN11`, `RN12` e `RN16`**
- [x] **Step 2: Implementar `AgendamentosService` e `AgendamentosController`**
- [x] **Step 3: Executar `npx jest src/agendamentos` e confirmar PASS**

---

### Task 5: Módulo de Avisos de Agendamentos Próximos e Pendências (`RN13`, `RN14`, `RN15`) `[Perfil: pro]`
**Dependências:** Task 4 (`AgendamentosModule`).

**Files:**
- Create: `backend/src/avisos/avisos.service.ts`
- Create: `backend/src/avisos/avisos.controller.ts`
- Create: `backend/src/avisos/avisos.module.ts`
- Test: `backend/src/avisos/avisos.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`
- Produces:
  - `AvisosService.consultarAvisosProximos(opcoes?: { horasAntecedencia?: number; corretorId?: number; agora?: Date })`
  - `AvisosService.dispararAvisosProximos(opcoes?: { horasAntecedencia?: number; corretorId?: number; agora?: Date })`
  - `AvisosService.dispensarAviso(id: number)`

- [x] **Step 1: Escrever testes unitários `avisos.service.spec.ts` validando `COMPROMISSO_PROXIMO`, `RETORNO_ATRASADO`, `TAREFA_SEM_DATA`, idempotência de disparo e dispensa (`RN13`–`RN15`)**
- [x] **Step 2: Implementar `AvisosService` e `AvisosController`**
- [x] **Step 3: Executar `npx jest src/avisos` e confirmar PASS**

---

### Task 6: AppModule, Bootstrap (`main.ts`), Swagger, Seed de Demonstração e Testes E2E (`Supertest`) `[Perfil: pro]`
**Dependências:** Tasks 1–5.

**Files:**
- Create: `backend/src/app.module.ts`
- Create: `backend/src/main.ts`
- Create: `backend/prisma/seed.ts`
- Create: `backend/test/jest-e2e.json`
- Create: `backend/test/app.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaModule`, `UsuariosModule`, `AuthModule`, `ClientesModule`, `ImoveisModule`, `AgendamentosModule`, `AvisosModule`
- Produces: Aplicação HTTP NestJS completa e suíte E2E validando o fluxo completo do corretor (Persona Junior) ponta a ponta.

- [x] **Step 1: Configurar `AppModule`, `main.ts` (CORS, `ValidationPipe`, Swagger `/api/docs`) e `prisma/seed.ts` (com dados da Persona Junior)**
- [x] **Step 2: Implementar `test/app.e2e-spec.ts` exercitando toda a jornada do `.docx` (Seção 4.3: Cadastrar corretor -> Login -> Cadastrar imóvel -> Cadastrar cliente e associar imóvel de interesse -> Agendar visita vinculada ao cliente e imóvel -> Programar retorno -> Visualizar compromissos organizados por cliente e por imóvel -> Disparar e dispensar avisos de agendamentos próximos)**
- [x] **Step 3: Executar `npm test`, `npm run test:e2e`, `npm run lint` e `npm run build` em `backend/`**
