# DOMUS Mobile (React Native / Expo Go) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o aplicativo móvel `mobile/` em React Native (Expo Go / TypeScript) reproduzindo fielmente as 4 telas de protótipo de `docs/prototipos/` e o fluxo completo das Seções 4 e 5 do Diagnóstico (`RN01`–`RN16`), com integração híbrida à API NestJS (`backend/`) e fallback local pré-populado com a Persona Junior.

**Architecture:** Aplicativo Expo (TypeScript strict) estruturado em `mobile/src/` com Design System próprio (`tokens.ts` + componentes `DomusHeader`, `DomusNavBar`, `AvisoBanner`, `DomusInput`, `DomusButton`), camada de serviço híbrida (`domusApi.ts` que consome `http://<HOST>:3000/api` e faz fallback transparente para repositório local persistente com as regras `RN01`–`RN16`), contexto reativo (`DomusContext.tsx`) e 5 telas integradas (`LoginScreen`, `ClientesScreen`, `ImoveisScreen`, `AgendarScreen`, `AtendimentosScreen`).

**Tech Stack:** React Native (Expo SDK 58 / Expo Go), TypeScript 5, `@expo/vector-icons`, `@react-native-async-storage/async-storage`, Jest + `ts-jest` + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-10-20-domus-mobile-expo-design.md`

## Global Constraints

- **Compatibilidade Expo Go:** Proibido adicionar pacotes com código nativo customizado fora do runtime padrão do Expo Go.
- **Paleta e Identidade DOMUS (`docs/prototipos/`):** Header âmbar `#FFE099` com ícone de casa e marca `DOMUS`, barra de navegação `#262626`, fundo `#A6A6A6`, cards/inputs `#D9D9D9`, botões primários `#FFA347` (`Cadastrar`, `Agendar`, `Visualizar`) e banner de aviso azul-claro `#B8C8E8` com texto exato `"Você tem agendamentos proximo do dias marcados"`.
- **Regras de Negócio (`RN01`–`RN16`):** Validar obrigatoriedade de imóvel e data/hora em `VISITA` (`RN08`), bloqueio de conflito de horário do corretor (`RN10`), programação de retorno derivado (`RN09`), visão agrupada por cliente/imóvel/sem data (`RN11`), conclusão de atendimento com baixa de avisos (`RN12`), disparo e dispensa de avisos (`RN13`–`RN15`) e geração de link do Google Calendar (`RN16`).
- **Regra Zero Emojis:** Nenhum emoji unicode em código, documentação, commits ou testes; utilizar ícones vetoriais (`@expo/vector-icons`) na UI e tags em texto puro (`[OK]`, `[AVISO]`, `[CRITICO]`) em docs.

## Review Focus

1. **Agendamento de `VISITA` sem imóvel ou sem data/hora (`RN08`):** Deve rejeitar com erro claro antes de salvar tanto no modo API quanto no fallback local.
2. **Conflito de horário na agenda do corretor (`RN10`):** Dois compromissos ativos (`PENDENTE`/`CONFIRMADO`) com intervalos sobrepostos devem ser bloqueados com mensagem explicativa.
3. **Atendimento registrado sem data de retorno (`RN11` / `RN14`):** Quando o corretor registra um atendimento com `proximaAcao` mas omite `data`/`dataRetorno`, o item deve aparecer em `tarefasSemData` e gerar alerta do tipo `TAREFA_SEM_DATA`.
4. **Indisponibilidade da API REST no celular (Expo Go em outra rede):** Quando `fetch` para o backend falhar ou exceder o timeout, o app deve operar sem travar usando o repositório local com os dados da Persona Junior.
5. **Dispensa e reexibição do banner de avisos (`RN13`–`RN15`):** Fechar o banner (`×`) ou dispensar um aviso deve atualizar o estado imediatamente, e concluir o agendamento (`RN12`) deve baixar seus avisos pendentes.

---

## Mapa de Tarefas, Dependências e Roteamento de Modelos (`/code-workflow`)

| Ordem | Tarefa | Perfil de Modelo (`/code-workflow`) | Dependências | Entregável Testável |
| :--- | :--- | :--- | :--- | :--- |
| **Task 1** | Scaffolding Expo SDK 58 (`mobile/`), configuração TypeScript/Jest, tokens da paleta DOMUS (`#FFE099`, `#262626`, `#A6A6A6`, `#D9D9D9`, `#FFA347`, `#B8C8E8`) e contratos TypeScript (`domus.ts`) | `[Perfil: flash]` | Nenhuma |
| **Task 2** | Motor de Dados Híbrido (`domusApi.ts` + `seedData.ts`) com Regras `RN01`–`RN16` | `[Perfil: pro]` (Arquitetura / Regras de Negócio / Auth) | Depende da **Task 1** | Serviço HTTP + Fallback Local com cobertura unitária Jest das regras `RN01`–`RN16` |
| **Task 3** | Componentes Base do Protótipo (`DomusHeader`, `DomusNavBar`, `AvisoBanner`, `DomusInput`, `DomusButton`) + `DomusContext` | `[Perfil: flash]` (UI Base Delimitada) | Depende das **Tasks 1 e 2** | Componentes visuais fiéis a `docs/prototipos/` e provedor de estado global |
| **Task 4** | Telas de Entrada e Cadastros (`LoginScreen`, `ClientesScreen` [Tela 01], `ImoveisScreen`) | `[Perfil: pro]` (Fluxos de Formulário e Vínculo N:N `RN01`–`RN07`) | Depende da **Task 3** | Login com Persona Junior, Cadastro de Cliente com Canal/Imóveis de Interesse e Cadastro de Imóveis |
| **Task 5** | Telas Core do Diagnóstico (`AgendarScreen` [Tela 02] e `AtendimentosScreen` [Telas 03 e 04]) + `App.tsx` | `[Perfil: pro]` (Fluxo Central de Intervenção `RN08`–`RN16`) | Depende da **Task 4** | Agendamento de Visita/Retorno, Lista `Seus Atendimentos` por Cliente/Imóvel/Sem Data, Modal `Visualizar`, Google Calendar e Banner de Avisos |
| **Task 6** | Suíte Completa de Testes de Integração UI, Typecheck, Lint e Guia Expo Go | `[Perfil: flash]` (Verificação + Documentação) | Depende da **Task 5** | `npm test`, `npm run typecheck` e instruções de execução no Expo Go + Backend |

---

### Task 1: Scaffolding do Projeto Expo SDK 58 (`mobile/`), Tokens de Tema DOMUS e Contratos TypeScript

- **Perfil `/code-workflow`:** `[Perfil: flash]` (`Model: "flash"`)
- **Depende de:** Nenhuma (primeira tarefa; deve ser executada após criação/verificação do worktree no Step 1).

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/jest.config.js`
- Create: `mobile/src/theme/tokens.ts`
- Create: `mobile/src/types/domus.ts`
- Test: `mobile/src/__tests__/themeAndTypes.spec.ts`

**Interfaces:**
- Consumes: Contratos REST de `backend/src/` e paleta extraída de `docs/prototipos/01..04.png`.
- Produces:
  - `DOMUS_COLORS`, `DOMUS_SPACING`, `DOMUS_RADIUS`, `MENSAGEM_BANNER_AVISOS` em `mobile/src/theme/tokens.ts`
  - Interfaces `Usuario`, `Cliente`, `CreateClienteInput`, `Imovel`, `CreateImovelInput`, `Agendamento`, `CreateAgendamentoInput`, `ProgramarRetornoInput`, `ConcluirAgendamentoInput`, `VisaoGeralAtendimentos`, `AvisoItem`, `ResumoAvisosProximos`, `AbaDomus` em `mobile/src/types/domus.ts`

- [ ] **Step 1: Inicializar `mobile/` com `package.json`, `app.json`, `tsconfig.json` e `jest.config.js` e escrever o teste `mobile/src/__tests__/themeAndTypes.spec.ts`**

```typescript
import { DOMUS_COLORS, MENSAGEM_BANNER_AVISOS } from '../theme/tokens';

describe('DOMUS Theme Tokens', () => {
  it('deve exportar a paleta fiel aos prototipos do documento docx e a mensagem padrao de aviso', () => {
    expect(DOMUS_COLORS.headerBg).toBe('#FFE099');
    expect(DOMUS_COLORS.navBarBg).toBe('#262626');
    expect(DOMUS_COLORS.canvasBg).toBe('#A6A6A6');
    expect(DOMUS_COLORS.surfaceInput).toBe('#D9D9D9');
    expect(DOMUS_COLORS.primaryOrange).toBe('#FFA347');
    expect(DOMUS_COLORS.alertBannerBg).toBe('#B8C8E8');
    expect(MENSAGEM_BANNER_AVISOS).toBe('Você tem agendamentos proximo do dias marcados');
  });
});
```

- [ ] **Step 2: Rodar o teste inicial para verificar que falha antes da implementação**

Run: `cd mobile && npm test -- src/__tests__/themeAndTypes.spec.ts`
Expected: FAIL (`Cannot find module '../theme/tokens'`)

- [ ] **Step 3: Implementar `mobile/src/theme/tokens.ts` e `mobile/src/types/domus.ts`**

Definir todas as cores extraídas dos 4 protótipos (`#FFE099`, `#262626`, `#A6A6A6`, `#D9D9D9`, `#FFA347`, `#B8C8E8`), espaçamentos e todas as interfaces TypeScript espelhando os payloads do backend NestJS.

- [ ] **Step 4: Rodar o teste e o typecheck para confirmar aprovação**

Run: `cd mobile && npm test -- src/__tests__/themeAndTypes.spec.ts && npm run typecheck`
Expected: PASS e `tsc --noEmit` com código de saída `0`.

- [ ] **Step 5: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): bootstrap expo project with domus theme tokens and types"
```

---

### Task 2: Motor de Dados Híbrido (`seedData.ts`, `storage.ts`, `domusApi.ts`) com Regras `RN01`–`RN16`

- **Perfil `/code-workflow`:** `[Perfil: pro]` (`Model: "pro"`)
- **Depende de:** Task 1 (`mobile/src/types/domus.ts` e `mobile/src/theme/tokens.ts`)

**Files:**
- Create: `mobile/src/services/seedData.ts`
- Create: `mobile/src/services/storage.ts`
- Create: `mobile/src/services/domusApi.ts`
- Test: `mobile/src/__tests__/domusApi.spec.ts`

**Interfaces:**
- Consumes: Tipos de `mobile/src/types/domus.ts` e constante `MENSAGEM_BANNER_AVISOS` de `mobile/src/theme/tokens.ts`.
- Produces:
  - `criarEstadoSeedJunior(): DomusLocalState` em `mobile/src/services/seedData.ts`
  - `DomusApiService` e instância singleton `domusApi` em `mobile/src/services/domusApi.ts` com os métodos assíncronos:
    - `configurarModo({ baseUrl, forcarOffline }): Promise<void>`
    - `login(credenciais: { loginOuEmail: string; senha: string }): Promise<{ accessToken: string; usuario: Usuario; modoOffline: boolean }>`
    - `cadastrarUsuario(input: CreateUsuarioInput): Promise<Usuario>`
    - `listarClientes(filtros?: { busca?: string; canalPrincipalContato?: CanalContato }): Promise<Cliente[]>`
    - `criarCliente(input: CreateClienteInput): Promise<Cliente>`
    - `vincularImoveisInteresse(clienteId: number, imovelIds: number[]): Promise<Cliente>`
    - `listarImoveis(): Promise<Imovel[]>`
    - `criarImovel(input: CreateImovelInput): Promise<Imovel>`
    - `listarAgendamentos(filtros?: FiltroAgendamentos): Promise<Agendamento[]>`
    - `obterVisaoGeral(): Promise<VisaoGeralAtendimentos>`
    - `criarAgendamento(input: CreateAgendamentoInput): Promise<Agendamento>`
    - `programarRetorno(agendamentoId: number, input: ProgramarRetornoInput): Promise<Agendamento>`
    - `concluirAgendamento(agendamentoId: number, input?: ConcluirAgendamentoInput): Promise<Agendamento>`
    - `sincronizarGoogleCalendar(agendamentoId: number): Promise<{ googleCalendarEventId: string; googleCalendarUrl: string; agendamento: Agendamento }>`
    - `obterAvisosProximos(horasAntecedencia?: number): Promise<ResumoAvisosProximos>`
    - `dispararAvisos(horasAntecedencia?: number): Promise<ResumoAvisosProximos>`
    - `dispensarAviso(avisoId: number): Promise<void>`
    - `resetarDadosDemo(): Promise<void>`

- [ ] **Step 1: Escrever a suíte de testes `mobile/src/__tests__/domusApi.spec.ts` cobrindo as regras `RN01`–`RN16` e os 5 itens do Review Focus**

```typescript
import { DomusApiService } from '../services/domusApi';

describe('DomusApiService (Hibrido API + Fallback Local RN01-RN16)', () => {
  let api: DomusApiService;

  beforeEach(async () => {
    api = new DomusApiService({ forcarOffline: true });
    await api.resetarDadosDemo();
  });

  it('RN01-RN03: autentica a Persona Junior (junior.corretor / Domus@2026)', async () => {
    const res = await api.login({ loginOuEmail: 'junior.corretor', senha: 'Domus@2026' });
    expect(res.usuario.login).toBe('junior.corretor');
    expect(res.usuario.perfis).toContain('CORRETOR');
  });

  it('RN04-RN06: cadastra cliente com canal principal de contato e vincula imoveis de interesse', async () => {
    const imoveis = await api.listarImoveis();
    const cliente = await api.criarCliente({
      nomeCompleto: 'Maria Clara Silva',
      cpfDocumento: '12345678901',
      telefone: '(83) 98877-6655',
      email: 'maria@email.com',
      canalPrincipalContato: 'WHATSAPP',
      observacoes: 'Busca apartamento proximo a praia',
      imoveisInteresseIds: [imoveis[0].id],
    });
    expect(cliente.canalPrincipalContato).toBe('WHATSAPP');
    expect(cliente.imoveisInteresse).toHaveLength(1);
  });

  it('RN08: rejeita agendamento de VISITA sem imovel vinculado ou sem data/hora', async () => {
    const clientes = await api.listarClientes();
    await expect(
      api.criarAgendamento({
        titulo: 'Visita sem imovel',
        tipo: 'VISITA',
        clienteId: clientes[0].id,
        data: '2026-10-25',
        hora: '10:00',
      })
    ).rejects.toThrow(/imóvel/i);
  });

  it('RN10: bloqueia conflito de horario para o mesmo corretor', async () => {
    const clientes = await api.listarClientes();
    const imoveis = await api.listarImoveis();
    await api.criarAgendamento({
      titulo: 'Visita 1',
      tipo: 'VISITA',
      clienteId: clientes[0].id,
      imovelId: imoveis[0].id,
      data: '2026-10-28',
      hora: '14:00',
      duracaoMinutos: 60,
    });
    await expect(
      api.criarAgendamento({
        titulo: 'Visita conflitante',
        tipo: 'VISITA',
        clienteId: clientes[0].id,
        imovelId: imoveis[0].id,
        data: '2026-10-28',
        hora: '14:30',
        duracaoMinutos: 60,
      })
    ).rejects.toThrow(/conflito/i);
  });

  it('RN09, RN11, RN13-RN16: programa retorno, agrupa por cliente/imovel/sem data, dispara avisos e gera link Google Calendar', async () => {
    const agendamentos = await api.listarAgendamentos();
    const origem = agendamentos[0];
    const retorno = await api.programarRetorno(origem.id, {
      titulo: 'Retorno sobre proposta Apto Manaira',
      data: '2026-10-29',
      hora: '16:00',
      duracaoMinutos: 30,
      proximaAcao: 'Ligar no WhatsApp para confirmar contraproposta',
    });
    expect(retorno.tipo).toBe('RETORNO');
    expect(retorno.agendamentoOrigemId).toBe(origem.id);

    const visao = await api.obterVisaoGeral();
    expect(visao.porCliente.length).toBeGreaterThan(0);
    expect(visao.porImovel.length).toBeGreaterThan(0);

    const avisos = await api.obterAvisosProximos(48);
    expect(avisos.possuiAvisos).toBe(true);
    expect(avisos.mensagemBanner).toBe('Você tem agendamentos proximo do dias marcados');

    const sync = await api.sincronizarGoogleCalendar(origem.id);
    expect(sync.googleCalendarUrl).toContain('calendar.google.com');
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham antes da implementação**

Run: `cd mobile && npm test -- src/__tests__/domusApi.spec.ts`
Expected: FAIL (`Cannot find module '../services/domusApi'`)

- [ ] **Step 3: Implementar `seedData.ts`, `storage.ts` e `domusApi.ts`**

Implementar o seed fiel à Persona Junior (incluindo 1 visita próxima nas próximas 24h, 1 retorno em atraso e 1 tarefa sem data de retorno para demonstrar todos os indicadores do Diagnóstico), abstração de persistência e cliente HTTP com timeout de `2500ms` e fallback automático para o motor local com todas as validações `RN01`–`RN16`.

- [ ] **Step 4: Executar a suíte de testes unitários da camada de dados**

Run: `cd mobile && npm test -- src/__tests__/domusApi.spec.ts`
Expected: PASS em todos os cenários `RN01`–`RN16`.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/services/ mobile/src/__tests__/domusApi.spec.ts
git commit -m "feat(mobile): implement hybrid api and local fallback service with RN01-RN16"
```

---

### Task 3: Componentes Visuais do Protótipo (`DomusHeader`, `DomusNavBar`, `AvisoBanner`, `DomusInput`, `DomusButton`) e `DomusContext`

- **Perfil `/code-workflow`:** `[Perfil: flash]` (`Model: "flash"`)
- **Depende de:** Task 1 e Task 2

**Files:**
- Create: `mobile/src/components/DomusHeader.tsx`
- Create: `mobile/src/components/DomusNavBar.tsx`
- Create: `mobile/src/components/AvisoBanner.tsx`
- Create: `mobile/src/components/DomusInput.tsx`
- Create: `mobile/src/components/DomusButton.tsx`
- Create: `mobile/src/context/DomusContext.tsx`
- Test: `mobile/src/__tests__/components.spec.tsx`

**Interfaces:**
- Consumes: `DOMUS_COLORS` (`tokens.ts`), `domusApi` (`domusApi.ts`) e tipos de `domus.ts`.
- Produces:
  - `DomusHeader`: Topo âmbar `#FFE099` com ícone de casa + título `DOMUS` + badge de conexão (`API Online` / `Modo Demo Local`) e botão de sair/resetar demo.
  - `DomusNavBar`: Barra `#262626` com abas `Agendar`, `Imoveis`, `Atendimentos` e `Clientes` (fiel ao menu superior dos 4 wireframes).
  - `AvisoBanner`: Banner azul `#B8C8E8` com ícone de sino, texto `"Você tem agendamentos proximo do dias marcados"`, resumo de contadores (`Próximos`, `Atrasados`, `Sem data`) e botão `×` (`testID="btn-fechar-aviso"`).
  - `DomusInput` e `DomusButton`: Controles padronizados com fundo `#D9D9D9` e botão laranja `#FFA347`.
  - `DomusProvider` e hook `useDomus()` em `DomusContext.tsx`.

- [ ] **Step 1: Escrever o teste `mobile/src/__tests__/components.spec.tsx`**

Validar renderização da marca `DOMUS`, abas `Agendar`, `Imoveis`, `Atendimentos`, `Clientes` e comportamento do `AvisoBanner` (exibição da frase `"Você tem agendamentos proximo do dias marcados"` e clique no botão `×`).

- [ ] **Step 2: Rodar o teste para verificar falha inicial**

Run: `cd mobile && npm test -- src/__tests__/components.spec.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar os 5 componentes em `mobile/src/components/` e o `DomusContext.tsx`**

Garantir acessibilidade (`accessibilityRole`, `testID`) e fidelidade visual às imagens `01` a `04` de `docs/prototipos/`.

- [ ] **Step 4: Rodar os testes de componentes**

Run: `cd mobile && npm test -- src/__tests__/components.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/ mobile/src/context/ mobile/src/__tests__/components.spec.tsx
git commit -m "feat(mobile): add domus prototype header, navbar, alert banner and state context"
```

---

### Task 4: Telas de Autenticação, Cadastro de Clientes (`01-cadastro-cliente.png`) e Imóveis (`RN01`–`RN07`)

- **Perfil `/code-workflow`:** `[Perfil: pro]` (`Model: "pro"`)
- **Depende de:** Task 3

**Files:**
- Create: `mobile/src/screens/LoginScreen.tsx`
- Create: `mobile/src/screens/ClientesScreen.tsx`
- Create: `mobile/src/screens/ImoveisScreen.tsx`
- Test: `mobile/src/__tests__/cadastrosScreens.spec.tsx`

**Interfaces:**
- Consumes: `useDomus()`, `DomusInput`, `DomusButton`, `DOMUS_COLORS`.
- Produces:
  - `LoginScreen`: Login com `login`/`email` e `senha`, botão rápido `"Entrar como Junior (Corretor Demo)"`, alternância para cadastro de novo usuário (`RN01`–`RN03`) e configuração opcional da URL da API (`http://<IP>:3000/api`).
  - `ClientesScreen`: Reproduz `docs/prototipos/01-cadastro-cliente.png` (`Cadastro de Cliente`, campos `nome Completo`, `CPF`, `Telefone`, `E-mail`, seletor de `Canal Principal de Contato`, `Observações`, chips de seleção de `Imóveis de Interesse`, botão laranja `Cadastrar`) + listagem abaixo dos clientes já cadastrados com atalho `"Agendar Visita/Retorno"`.
  - `ImoveisScreen`: Formulário enxuto de cadastro de imóvel (`Endereço`, `Bairro`, `Tipo`, `Finalidade`, `Valor`, `Inscrição`) e lista dos imóveis disponíveis para vincular a clientes e visitas (`RN07`).

- [ ] **Step 1: Escrever `mobile/src/__tests__/cadastrosScreens.spec.tsx`**

Testar o formulário `Cadastro de Cliente` (`nome Completo`, `CPF`, `Telefone`, `E-mail`, `Canal Principal de Contato`, botão `Cadastrar`) e o cadastro de Imóvel.

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `cd mobile && npm test -- src/__tests__/cadastrosScreens.spec.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar `LoginScreen.tsx`, `ClientesScreen.tsx` e `ImoveisScreen.tsx`**

Preservar os rótulos e a ordem visual de `01-cadastro-cliente.png` (`nome Completo`, `CPF`, `Telefone`, `E-mail`, botão `Cadastrar`) adicionando seletores táteis para Canal de Contato (`WHATSAPP`, `TELEFONE`, `INSTAGRAM/REDE_SOCIAL`, `EMAIL`, `PRESENCIAL`) e vínculo de imóveis de interesse.

- [ ] **Step 4: Rodar os testes de telas de cadastro**

Run: `cd mobile && npm test -- src/__tests__/cadastrosScreens.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/LoginScreen.tsx mobile/src/screens/ClientesScreen.tsx mobile/src/screens/ImoveisScreen.tsx mobile/src/__tests__/cadastrosScreens.spec.tsx
git commit -m "feat(mobile): implement login, client registration and property screens"
```

---

### Task 5: Telas Core de Intervenção (`AgendarScreen` [`02`] e `AtendimentosScreen` [`03` e `04`]) e `App.tsx` (`RN08`–`RN16`)

- **Perfil `/code-workflow`:** `[Perfil: pro]` (`Model: "pro"`)
- **Depende de:** Task 4

**Files:**
- Create: `mobile/src/screens/AgendarScreen.tsx`
- Create: `mobile/src/screens/AtendimentosScreen.tsx`
- Create: `mobile/App.tsx`
- Test: `mobile/src/__tests__/fluxoAtendimentos.spec.tsx`

**Interfaces:**
- Consumes: `useDomus()`, `DomusHeader`, `DomusNavBar`, `AvisoBanner`, `DomusInput`, `DomusButton`, `LoginScreen`, `ClientesScreen`, `ImoveisScreen`.
- Produces:
  - `AgendarScreen` ([02-agendar-compromisso.png](file:///d:/code/DOMUS/docs/prototipos/02-agendar-compromisso.png)): Título `Criar seu Agendamento`, seletores de `Tipo` (`VISITA`, `RETORNO`, `ATENDIMENTO`), `Cliente` e `Imóvel` (obrigatório em `VISITA`), campos `Titulo`, `Descrição`, `Data` e `Hora:` lado a lado, `Duração`, `Observação`, `Próxima Ação`, opção `Sincronizar com Google Calendar` e botão laranja `Agendar`.
  - `AtendimentosScreen` ([03-visualizacao-atendimentos.png](file:///d:/code/DOMUS/docs/prototipos/03-visualizacao-atendimentos.png) e [04-aviso-agendamentos-proximos.png](file:///d:/code/DOMUS/docs/prototipos/04-aviso-agendamentos-proximos.png)):
    - Topo com `AvisoBanner` (`"Você tem agendamentos proximo do dias marcados"`) e botão de atualizar/disparar avisos;
    - Filtros de visão da Seção 4.3: `Todos`, `Por Cliente`, `Por Imóvel` e `Sem Data / Atrasados`;
    - Cards cinza-claros com `Titulo do Agendamento`, `Descrição Curta` (cliente, data/hora, canal e imóvel) e checkbox à direita;
    - Botão laranja `Visualizar` na base que abre o modal de detalhes do atendimento selecionado com ações diretas: **Programar Retorno (`RN09`)**, **Concluir Atendimento (`RN12`)** e **Sincronizar Google Calendar (`RN16`)**.
  - `App.tsx`: Shell principal integrando `DomusProvider`, `DomusHeader`, `DomusNavBar` e navegação fluida entre as telas.

- [ ] **Step 1: Escrever `mobile/src/__tests__/fluxoAtendimentos.spec.tsx`**

Testar o fluxo completo da validação com o corretor (Seção 4.3 do `.docx`):
1. Visualizar o banner `"Você tem agendamentos proximo do dias marcados"` na tela `"Seus Atendimentos"`;
2. Selecionar um atendimento via checkbox e acionar o botão `"Visualizar"`;
3. Programar um retorno vinculado ao atendimento (`RN09`);
4. Alternar a visualização por Cliente e por Imóvel (`RN11`).

- [ ] **Step 2: Rodar o teste para confirmar que falha antes da implementação**

Run: `cd mobile && npm test -- src/__tests__/fluxoAtendimentos.spec.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar `AgendarScreen.tsx`, `AtendimentosScreen.tsx` e `App.tsx`**

Seguir fielmente o layout de `02-agendar-compromisso.png`, `03-visualizacao-atendimentos.png` e `04-aviso-agendamentos-proximos.png`, conectando todas as ações ao `DomusContext`.

- [ ] **Step 4: Rodar a suíte de testes de fluxo**

Run: `cd mobile && npm test -- src/__tests__/fluxoAtendimentos.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/AgendarScreen.tsx mobile/src/screens/AtendimentosScreen.tsx mobile/App.tsx mobile/src/__tests__/fluxoAtendimentos.spec.tsx
git commit -m "feat(mobile): implement scheduling and appointments screens with alerts and google calendar sync"
```

---

### Task 6: Verificação Completa (Testes, Typecheck, Lint) e Documentação de Execução no Expo Go

- **Perfil `/code-workflow`:** `[Perfil: flash]` (`Model: "flash"`)
- **Depende de:** Tasks 1 a 5

**Files:**
- Create: `mobile/README.md`
- Modify: `README.md` (raiz do repositório, adicionando seção do App Mobile Expo Go e catálogo de protótipos extraídos em `docs/prototipos/`)

**Interfaces:**
- Consumes: Projeto `mobile/` completo e `docs/prototipos/`.
- Produces: Documentação passo a passo para abrir o protótipo no **Expo Go** (Android/iOS) tanto em modo conectado ao `backend/` quanto em modo Demo Offline.

- [ ] **Step 1: Executar toda a suíte de testes automatizados e verificação de tipos**

Run: `cd mobile && npm test && npm run typecheck`
Expected: 100% dos testes passando e zero erros de TypeScript.

- [ ] **Step 2: Documentar guia de uso no Expo Go em `mobile/README.md` e atualizar `README.md`**

Incluir comandos `npx expo start`, como conectar à API local via IP da LAN (`http://<SEU_IP_LOCAL>:3000/api`) ou usar o botão `"Entrar como Junior (Modo Demo)"` diretamente no celular via QR Code do Expo Go.

- [ ] **Step 3: Verificar integridade do backend existente (`backend/`)**

Run: `cd backend && npm test -- --runInBand`
Expected: PASS (confirmando que nenhuma funcionalidade do backend foi quebrada).

- [ ] **Step 4: Commit**

```bash
git add mobile/README.md README.md docs/prototipos/ docs/superpowers/
git commit -m "docs(mobile): add expo go usage guide and extracted prototype screens"
```
