# DOMUS Backend (TypeScript / NestJS / Prisma)

API RESTful da plataforma **DOMUS**, desenvolvida em **TypeScript**, **NestJS 11** e **Prisma ORM** de acordo com o **Diagnóstico da Problemática e Plano de Intervenção (PDM e PE — UNIESP 2026.2)**.

## Escopo e Módulos Implementados

Conforme a Seção 5 (*Ajustes na Proposta Inicial*) e Seção 4 (*Plano de Intervenção*) de `docs/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx`, o backend implementa:

1. **Cadastro de Usuários (`UsuariosModule`)** — `POST /api/usuarios`, `GET /api/usuarios`, `GET /api/usuarios/:id`, `PATCH /api/usuarios/:id`, `DELETE /api/usuarios/:id`
   - Suporte a `nome`, `login`, `cpf`, `email`, `senha`, `confirmarSenha` e perfis `CORRETOR` e `CADASTRADOR`.
2. **Login e Autenticação (`AuthModule`)** — `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/alterar-senha`
   - Autenticação via `username` (`login` ou `email`) + `password` (`senha`), retorno de token JWT, registro de `ultimoLogin` e troca de senha com validação de senha atual.
3. **Cadastro de Clientes (`ClientesModule`)** — `POST /api/clientes`, `GET /api/clientes`, `GET /api/clientes/:id`, `PATCH /api/clientes/:id`, `POST /api/clientes/:id/imoveis-interesse`, `DELETE /api/clientes/:id/imoveis-interesse/:imovelId`
   - Contempla `nomeCompleto`, `cpf`/`cpfDocumento` (CPF ou CNPJ), `telefone`, `email`, `canalPrincipalContato` (`WHATSAPP`, `TELEFONE`, `REDE_SOCIAL`, `EMAIL`, `PRESENCIAL`), `observacoes` sobre perfil/interesses e vínculo N:N com **imóveis de interesse**.
4. **Cadastro de Imóveis (`ImoveisModule`)** — `POST /api/imoveis`, `GET /api/imoveis`, `GET /api/imoveis/:id`, `PATCH /api/imoveis/:id`, `DELETE /api/imoveis/:id`
   - Contempla `numeroInscricao`, `tipoImovel`, `finalidade` (`VENDA`, `ALUGUEL`, `AMBOS`), `cep`, `endereco`, `bairro`, `numero`, `areaTotal`, `comodos`, `banheiros`, `valor`, `posicoes` solares e vínculo com proprietário/corretor.
5. **Cadastro de Agendamento e Visualização de Atendimentos (`AgendamentosModule`)** — `POST /api/agendamentos`, `GET /api/agendamentos`, `GET /api/agendamentos/visao-geral`, `GET /api/agendamentos/:id`, `POST /api/agendamentos/:id/programar-retorno`, `PATCH /api/agendamentos/:id/concluir`, `POST /api/agendamentos/:id/sincronizar-google-calendar`
   - Suporte a **Agendar Visita** (`VISITA`), **Programar Retorno** (`RETORNO`) e **Atendimento** (`ATENDIMENTO`), prevenção de conflito de horário do corretor, visualização agrupada **por cliente** e **por imóvel**, controle de pendências sem data e geração de payload/link para **Google Calendar**.
6. **Disparar Avisos de Agendamentos Próximos (`AvisosModule`)** — `GET /api/avisos/proximos`, `POST /api/avisos/disparar`, `GET /api/avisos`, `PATCH /api/avisos/:id/dispensar`
   - Detecta e dispara avisos para compromissos próximos dos dias marcados (*"Você tem agendamentos proximo do dias marcados"*), retornos atrasados e atendimentos com próxima ação sem data definida.

## Como Executar

```powershell
# 1. Instalar dependências
npm install

# 2. Sincronizar schema Prisma (SQLite local zero-config)
npx prisma db push

# 3. Popular dados iniciais (Estudo de Caso: Persona Junior)
npm run prisma:seed

# 4. Iniciar servidor em modo desenvolvimento
npm run start:dev
```

- **API Base URL:** `http://localhost:3000/api`
- **Documentação Interativa (Swagger):** `http://localhost:3000/api/docs`

## Testes e Qualidade

```powershell
# Testes unitários e de regras de negócio (RN01 a RN16)
npm test

# Testes de ponta a ponta (E2E)
npm run test:e2e

# Linter e Build
npm run lint
npm run build
```
