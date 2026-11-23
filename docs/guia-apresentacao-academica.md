# Guia de Execucao e Apresentacao Academica (UNIESP - DOMUS)

Este guia documenta o passo a passo completo para executar a aplicacao **DOMUS**, demonstrar a integracao em tempo real entre o aplicativo movel no smartphone e a API backend NestJS com persistencia no banco de dados SQLite, e projetar as tabelas no telao durante a avaliacao da disciplina.

---

## 1. Visao Geral da Arquitetura de Apresentacao

```text
[Projetor / Telao da Sala de Aula]
  - Terminal do Servidor (NestJS na porta 3000)
  - Prisma Studio no Navegador (http://localhost:5555) mostrando as tabelas em tempo real
  - Documentacao Swagger (http://localhost:3000/api/docs)

      ^
      | (Conexao HTTP REST / JWT)
      v

[Smartphone do Apresentador (Expo Go)]
  - LoginScreen com Autenticacao JWT Real e Cabecalho Unificado (DOMUS + Corretor + Sair)
  - Cadastro de Cliente no app movel
  - Gravacao imediata no banco de dados SQLite (dev.db)
```

---

## 2. Passo 1: Inicializar o Backend e o Banco de Dados

Voce tem duas formas de rodar o backend. Ambas utilizam exatamente a mesma base de dados SQLite (`backend/prisma/dev.db`) com as migrations versionadas:

### Opcao A: Via Docker Compose (Recomendado se o Docker Desktop estiver aberto)
```bash
# Na raiz do projeto:
docker compose up -d

# Para acompanhar os logs:
docker compose logs -f backend
```

### Opcao B: Execucao Direta no Node.js (Sem necessidade de Docker aberto)
```bash
# 1. Entrar na pasta backend:
cd backend

# 2. Garantir que as migrations estao aplicadas e o seed carregado:
npx prisma migrate deploy
npm run prisma:seed

# 3. Iniciar o servidor backend:
npm run start:dev
```
- A API estara respondendo em `http://localhost:3000/api`.
- O Swagger interativo estara disponivel em `http://localhost:3000/api/docs`.

---

## 3. Passo 2: Abrir o Prisma Studio para Projecao Visual no Telao

Para provar visualmente ao professor que o cadastro nao e apenas um mockup e realmente persiste no banco de dados relacional:

```bash
cd backend
npm run prisma:studio
```
- O navegador abrira automaticamente em `http://localhost:5555`.
- Deixe essa tela aberta e projetada no telao. Clique na tabela **Cliente**.
- Toda vez que cadastrar um cliente no celular, basta dar F5 ou recarregar a visualizacao para mostrar a nova linha inserida com ID, CPF, telefone e timestamp.

---

## 4. Passo 3: Conectar o Celular (Expo Go) ao Backend

O aplicativo mobile detecta automaticamente o IP da maquina servidora no Expo Go via `expo-constants` (ou utiliza a variavel `EXPO_PUBLIC_API_URL` definida em `mobile/.env`). Escolha uma das tres formas de conectar:

### Cenario 1: Conexao via Cabo USB com ADB (A mais rapida e imune a quedas de Wi-Fi)
1. Conecte o celular ao computador via cabo USB (com Depuracao USB ativada no celular).
2. No terminal do computador, execute:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```
3. Caso utilize `mobile/.env`, aponte para `EXPO_PUBLIC_API_URL=http://localhost:3000/api`.
4. Abra o app no celular e autentique-se na `LoginScreen` (ex.: seed `junior.corretor` / `Domus@2026`).

### Cenario 2: Conexao via Wi-Fi ou Roteador de Dados Moveis (Hotspot do Celular)
1. Conecte o computador ao Wi-Fi compartilhado pelo celular (ponto de acesso 4G/5G) ou ambos na mesma rede Wi-Fi.
2. Inicie o servidor na rede local (`npm run dev:lan`) e o Metro Bundler (`npm run dev:mobile`).
3. Pelo Expo Go, o IP local da maquina (ex.: `http://192.168.43.50:3000/api`) e detectado automaticamente via `expo-constants`.
4. Na `LoginScreen`, autentique-se com seu usuario ou crie uma nova conta de corretor na aba **Criar Conta**.

### Cenario 3: Conexao via Expo Tunnel
1. Se a rede bloquear portas locais, inicie o Expo com a flag de tunel:
   ```bash
   cd mobile
   npx expo start --tunnel
   ```
2. Escaneie o QR Code no Expo Go pelo aplicativo.

---

## 5. Roteiro Sugerido de Apresentacao para o Professor

1. **Apresentar a Arquitetura:**
   - Explicar a separacao cliente-servidor (Mobile React Native com Expo SDK 58 e Backend NestJS 11 com Prisma ORM e SQLite).
   - Mostrar no terminal as migrations versionadas em `backend/prisma/migrations/`.
2. **Mostrar a Autenticacao JWT Viva no Celular:**
   - Exibir a `LoginScreen` no aplicativo DOMUS e realizar login real (`POST /api/auth/login`) ou criar uma nova conta de corretor (`POST /api/usuarios`).
   - Mostrar o cabecalho institucional unificado com o nome do corretor autenticado e o botao **Sair**.
3. **Executar o Cadastro em Tempo Real:**
   - Preencher o formulario de **Cadastro de Cliente** com dados de teste (ex: "Cliente Avaliacao UNIESP", CPF, telefone WhatsApp).
   - Tocar em **Cadastrar**.
   - Mostrar a mensagem de sucesso inline e o novo cliente aparecendo na listagem inferior.
4. **Comprovar a Persistencia no Banco de Dados:**
   - Alternar para a aba do **Prisma Studio** no computador (`http://localhost:5555`) ou Swagger (`http://localhost:3000/api/docs`).
   - Mostrar para a banca o registro persistido na tabela `Cliente` do banco SQLite.
5. **Demonstrar a Resiliencia e Preservacao de Branch:**
   - Em caso de perda de conexao com a API durante a sincronizacao, o aplicativo exibe um banner inline nao-bloqueante com o botao **Tentar novamente** sem travar a interface; caso seja necessario demonstrar sem servidor backend disponivel, a versao com Modo Demo Local offline encontra-se preservada na branch `feat/modo-demo-local`.
