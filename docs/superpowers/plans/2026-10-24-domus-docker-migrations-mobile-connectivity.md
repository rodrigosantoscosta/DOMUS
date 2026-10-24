# DOMUS: Dockerizacao, Migrations e Conectividade Mobile para Apresentacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar a arquitetura backend com Prisma Migrations versionadas, Dockerizacao com SQLite persistente, e conectividade resiliente no app mobile Expo para apresentacao academica ao vivo (com suporte a conexao USB, roteamento de dados moveis/Wi-Fi e modo demo offline).

**Architecture:** O backend NestJS e o banco SQLite sao empacotados em um container Docker orquestrado via `docker-compose.yml`, com volume dedicado para o banco de dados e script de inicializacao que executa `prisma migrate deploy` e seed automaticamente. O app mobile Expo recebe resolucao dinamica de host para dispositivos fisicos e um modal interativo de configuracao de conexao acessivel diretamente pela badge do cabecalho, permitindo alternar e testar a comunicacao com a API e o banco de dados em tempo real no celular durante a avaliacao da disciplina.

**Tech Stack:** TypeScript, NestJS 11, Prisma ORM (SQLite com Migrations), Docker, Docker Compose, React Native, Expo SDK 58, Expo Constants.

**Spec:** `docs/superpowers/specs/2026-10-17-domus-backend-nestjs-design.md` e `docs/MODELO DIAGNOSTICO DA PROBLEMATICA E PLANO DE INTERVENCAO.docx`.

## Global Constraints

- Proibido o uso de emojis unicode em qualquer arquivo, documentacao, plano, commit ou tela (Regra Zero Emojis).
- O banco de dados para desenvolvimento e apresentacao e SQLite com persistencia em volume (`dev.db`), mantendo inicializacao zero-config e compatibilidade com execucao com ou sem Docker.
- O app mobile deve funcionar de forma estavel em tres cenarios de apresentacao: Cabo USB (ADB reverse), Wi-Fi/Roteador de dados moveis (LAN IP) e Modo Demo Local (offline resiliente).
- As migracoes de banco de dados devem ser versionadas em `backend/prisma/migrations/` e auditaveis via Git.
- Todos os feedbacks de conexao no mobile devem ser inline e nao-bloqueantes, sem uso de `window.alert()` ou dialogs nativos.

## Review Focus

1. Conexao do celular fisico via Expo Go tentando acessar `localhost:3000` em vez do IP da maquina host: o app deve detectar dinamicamente o IP do computador ou permitir configuracao rapida sem travar em tela branca.
2. Inicializacao do container Docker sem o arquivo de banco ou migracoes aplicadas: o container deve executar `prisma migrate deploy` e `prisma:seed` na subida antes de iniciar o processo HTTP.
3. Chaveamento entre Modo Demo Local e API Online: a badge do cabecalho (`DomusHeader`) deve refletir dinamicamente o status real da API, mudando para ponto verde ("API Online") quando conectado.
4. Persistencia dos dados apos reinicio do Docker: o volume montado em `docker-compose.yml` deve preservar o arquivo `dev.db` entre recriacoes de container.
5. Compatibilidade hibrida: o desenvolvedor deve conseguir rodar localmente tanto com `docker compose up` quanto sem Docker (`npm run start:dev`) utilizando a mesma base de migracoes.

---

### Task 1: Prisma Migrations e Scripts de Banco no Backend

**Files:**
- Create: `backend/prisma/migrations/*` (gerado via CLI)
- Modify: `backend/package.json`
- Modify: `backend/.env.example`
- Test: `backend/test/` (execucao da suite de testes Jest)

**Steps:**
- [ ] 1. Configurar scripts adicionais de migracao e administracao no `backend/package.json`: `"prisma:migrate:dev": "prisma migrate dev"`, `"prisma:migrate:deploy": "prisma migrate deploy"`, `"prisma:studio": "prisma studio"`.
- [ ] 2. Executar `npx prisma migrate dev --name init` dentro de `backend/` para criar a migracao SQL baseline inicial em `backend/prisma/migrations/`.
- [ ] 3. Validar a execucao do seed oficial da Persona Junior via `npm run prisma:seed`.
- [ ] 4. Executar os testes automatizados do backend (`npm test`) para garantir que o banco gerado pelas migrations atende 100% dos testes unitarios das regras de negocio.
- [ ] 5. Commitar com mensagem convencional: `feat(backend): initialize prisma migrations and database scripts`.

---

### Task 2: Dockerizacao do Backend com Volume Persistente e Auto-Migrate

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/docker-entrypoint.sh`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `README.md`
- Modify: `backend/README.md`

**Steps:**
- [ ] 1. Criar `.dockerignore` na raiz e em `backend/` excluindo `node_modules`, `dist`, `.expo`, coverage e arquivos de log.
- [ ] 2. Criar `backend/Dockerfile` multi-stage com imagem Node 22 Alpine, copiando arquivos necessarios, gerando o Prisma Client e compilando o NestJS (`npm run build`).
- [ ] 3. Criar `backend/docker-entrypoint.sh` com permissao de execucao que roda `npx prisma migrate deploy` e `npm run prisma:seed` antes de iniciar `node dist/main`.
- [ ] 4. Criar `docker-compose.yml` na raiz do projeto com o servico `backend`:
  - Mapeamento de porta `3000:3000` (expondo para a rede local do computador);
  - Volume persistente montado para o diretorio do banco de dados SQLite (`backend/prisma`);
  - Healthcheck HTTP na rota `/api/avisos/proximos` ou endpoint de status;
  - Variaveis de ambiente: `PORT=3000`, `DATABASE_URL=file:./dev.db`, `JWT_SECRET=...`.
- [ ] 5. Validar a sintaxe do Compose com `docker compose config`.
- [ ] 6. Commitar com mensagem convencional: `feat(backend): add dockerfile and compose with persistent sqlite volume`.

---

### Task 3: Conectividade Inteligente e Modal de Conexao no Mobile

**Files:**
- Modify: `mobile/package.json` (adicionar `expo-constants`)
- Modify: `mobile/src/services/domusApi.ts`
- Modify: `mobile/src/components/DomusHeader.tsx`
- Create: `mobile/src/components/ConnectionModal.tsx`
- Modify: `mobile/App.tsx`
- Modify: `mobile/src/__tests__/components.spec.tsx`

**Steps:**
- [ ] 1. Instalar `expo-constants` em `mobile/` (`npm install --prefix mobile expo-constants@~18.0.0`) para obter o IP do host Metro automaticamente em dispositivos fisicos (`Constants.expoConfig?.hostUri`).
- [ ] 2. Atualizar `mobile/src/services/domusApi.ts` para resolver dinamicamente o IP da maquina quando executando em dispositivo movel, mantendo `localhost:3000` na Web ou ADB USB, e permitindo sobrescrita persistida via configuracao em runtime.
- [ ] 3. Criar `mobile/src/components/ConnectionModal.tsx`:
  - Modal amigavel e touch-friendly aberto ao tocar na badge de status do cabecalho;
  - Exibe status atual (Online com IP ou Demo Local);
  - Campo de entrada com a URL da API (permite digitar IP de Wi-Fi ou rota de dados moveis);
  - Botao "Testar Conexao": faz ping com timeout rapido e exibe feedback inline (verde/vermelho);
  - Botao "Conectar e Salvar";
  - Botao "Alternar para Modo Demo Local";
  - Botao fechar.
- [ ] 4. Atualizar `mobile/src/components/DomusHeader.tsx` tornando a badge de status (`statusBadge`) clicavel via `TouchableOpacity` para disparar `onPressStatus`.
- [ ] 5. Atualizar `mobile/App.tsx` para sincronizar o estado dinamico de `modoOffline` do `DomusContext` e integrar a exibicao do `ConnectionModal`.
- [ ] 6. Atualizar a suite de testes `mobile/src/__tests__/components.spec.tsx` para cobrir o modal e as interacoes da badge.
- [ ] 7. Executar `npm test --prefix mobile` e `npm run typecheck --prefix mobile`.
- [ ] 8. Commitar com mensagem convencional: `feat(mobile): add dynamic host detection and interactive connection modal`.

---

### Task 4: Guia de Apresentacao Academica, Sincronizacao do Backup e Verificacao Final

**Files:**
- Create: `docs/guia-apresentacao-academica.md`
- Modify: `README.md`
- Modify: `mobile/README.md`
- Sync: `D:\code\DOMUS-COMPLETO\` (manter arquivos atualizados no backup)

**Steps:**
- [ ] 1. Criar o documento `docs/guia-apresentacao-academica.md` com o passo a passo completo para a apresentacao da disciplina UNIESP:
  - Cenario A: Conexao via Cabo USB com `adb reverse tcp:3000 tcp:3000` (zero dependencia de Wi-Fi);
  - Cenario B: Conexao via Roteador do Celular (Hotspot 4G/5G com IP local do PC);
  - Cenario C: Conexao via Expo Tunnel (`npx expo start --tunnel`);
  - Como abrir o **Prisma Studio** (`npm run prisma:studio`) no projetor da sala para provar visualmente que o dado cadastrado no celular foi gravado no banco;
  - Procedimento de fallback para o Modo Demo Local caso a internet falhe na sala de aula.
- [ ] 2. Atualizar o `README.md` principal e `mobile/README.md` referenciando os comandos de Docker Compose e de apresentacao.
- [ ] 3. Sincronizar as melhorias relevantes para o diretorio `D:\code\DOMUS-COMPLETO`.
- [ ] 4. Executar toda a bateria de testes do mobile e do backend (`npm test`).
- [ ] 5. Commitar com mensagem convencional: `docs: add academic presentation runbook and update architecture guide`.
