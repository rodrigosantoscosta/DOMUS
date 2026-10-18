# DOMUS

Plataforma digital para organizacao e acompanhamento da rotina de corretores de imoveis, com foco em mobilidade, gestao de contatos, visitas e programacao de retornos comerciais.

---

## Sobre o Projeto

O DOMUS nasce da necessidade de superar as limitacoes de planilhas manuais na rotina de corretores autonomos. A partir de um estudo de caso com a Persona Junior (corretor atuante em Joao Pessoa - PB), identificou-se que o esquecimento de prazos e o atraso no retorno a clientes sao os principais fatores de desgaste no relacionamento comercial.

A proposta e fornecer uma ferramenta simples, direta e acessivel via dispositivo movel para centralizar o historico do cliente, os imoveis vinculados e o status de cada atendimento com avisos automaticos de compromissos proximos.

---

## Contexto Academico

- **Instituicao:** Centro Universitario UNIESP
- **Curso:** Sistemas para Internet (5o Periodo - 2026.2)
- **Unidade Curricular:** Programacao para Dispositivos Moveis e Projeto Extensionista IV (Empreendedorismo e Inovacao)
- **Professor Orientador:** Alekiss Manco de Melo
- **Equipe:**
  - Alexander Augusto de Figueiredo Baxendale
  - Pedro Neto Amancio
  - Rodrigo Santos Costa

---

## Principais Recursos

- **Gestao de Clientes:** Cadastro basico, canal principal de contato (WhatsApp, Telefone, Presencial) e vinculo com imoveis de interesse.
- **Catalogo de Imoveis:** Registro de caracteristicas fisicas (comodos, area, posicao solar) e comerciais (valores, venda e locacao).
- **Agendamento Inteligente:** Marcacao de visitas a imoveis, reunioes de atendimento e retornos obrigatorios, com validacao para evitar conflitos de horario na agenda do corretor.
- **Central de Avisos:** Alertas ativos para compromissos proximos da data marcada, retornos atrasados e pendencias sem data definida.
- **Integracao de Calendario:** Geracao de eventos compativeis com o Google Calendar.
- **Controle de Acesso:** Autenticacao segura via JWT com perfis de Corretor e Cadastrador.

---

## Arquitetura e Tecnologias

O sistema e estruturado em uma arquitetura desacoplada cliente-servidor:

- **Mobile (Frontend):** Desenvolvido em **React Native**, priorizando o uso em smartphones por corretores em deslocamento e visitas a campo.
- **Backend (API):** Desenvolvido em **Node.js** com **TypeScript** e **NestJS**, seguindo principios de arquitetura modular, injecao de dependencias e validacao estrita por DTOs.
- **Banco de Dados e Persistencia:** **Prisma ORM**, configurado para ambiente de desenvolvimento rapido com SQLite (zero-config) e compativel com MySQL para producao.
- **Testes e Qualidade:** Cobertura de testes unitarios e ponta a ponta (E2E) com **Jest** e **Supertest**, alem de linter com **ESLint**.

---

## Estrutura do Repositorio

```text
DOMUS/
├── backend/        # API RESTful (NestJS, TypeScript, Prisma ORM)
│   ├── prisma/     # Schema do banco de dados e script de seed
│   ├── src/        # Codigo-fonte (modulos de negocio, auth e controladores)
│   ├── test/       # Testes unitarios e testes E2E
│   └── README.md   # Documentacao tecnica detalhada da API
├── docs/           # Documentacao do projeto extensionista
│   ├── entrevistas/# Transcricoes e validacoes do estudo de caso
│   ├── modelos/    # Diagnostico institucional e jornada do usuario
│   └── superpowers/# Especificacoes tecnicas e planos de implementacao
├── legacy/         # Prototipos anteriores e versoes exploratorias
└── README.md       # Visao geral do projeto DOMUS (este arquivo)
```

---

## Execucao do Backend

Para rodar a API localmente:

```powershell
# 1. Entrar na pasta do backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Gerar o banco SQLite e aplicar o schema
npx prisma db push

# 4. Popular dados iniciais de teste (Persona Junior)
npm run prisma:seed

# 5. Iniciar o servidor de desenvolvimento
npm run start:dev
```

- **Acesso da API:** `http://localhost:3000/api`
- **Documentacao Interativa Swagger:** `http://localhost:3000/api/docs`

### Execucao dos Testes

```powershell
cd backend

# Testes unitarios das regras de negocio
npm test

# Testes de ponta a ponta (E2E)
npm run test:e2e

# Verificacao de tipos e linter
npm run lint
npm run build
```

---

## Decisoes Tecnicas e Alternativas Avaliadas

### Avaliacao do PocketBase

Durante a fase de desenho do backend, foi considerada a utilizacao do **PocketBase** (BaaS em Go com SQLite embutido) visando agilidade inicial.

**Vantagens identificadas:**
- Setup instantaneo com binario unico e SQLite embutido.
- Painel de administracao e autenticacao prontos para uso.
- Suporte nativo a Server-Sent Events (SSE) para envio de alertas em tempo real.

**Motivos para adocao do NestJS:**
- **Regras de Negocio Condicionais:** O DOMUS possui restricoes como a obrigatoriedade de imovel apenas em visitas e deteccao de choques de horario de corretores, que no PocketBase exigiriam scripts adicionais em `pb_hooks`.
- **Visoes Agrupadas:** O painel exige agregacao simultanea por cliente e por imovel, necessitando de views SQL manuais no PocketBase.
- **Alinhamento Curricular:** Por se tratar de um projeto academico de Sistemas para Internet, o NestJS proporciona maior visibilidade sobre camadas de servico, tipagem estatica, injecao de dependencias e execucao formal de testes automatizados.

Dessa forma, optou-se pelo NestJS para garantir controle pleno sobre a logica de negocio, extensibilidade futura e conformidade com as boas praticas de engenharia de software.

---

## Referencias

- Diagnostico da Problematica e Plano de Intervencao: `docs/MODELO DIAGNOSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx`
- Especificacao Funcional do Backend: `docs/superpowers/specs/2026-10-17-domus-backend-nestjs-design.md`
- Guia Tecnico da API: `backend/README.md`
