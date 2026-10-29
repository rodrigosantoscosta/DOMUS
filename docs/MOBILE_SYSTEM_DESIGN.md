# Arquitetura e System Design do Módulo Mobile — DOMUS

Este documento consolida a arquitetura completa do módulo móvel (`mobile/`) do projeto DOMUS, detalhando todas as decisões técnicas tomadas no system design móvel, a substituição de padrões genéricos por componentes nativos de alta fidelidade, as primitivas de feedback não-bloqueante, o gerenciamento de gestos a 60/120 FPS e o funcionamento da camada híbrida de conectividade.

---

## 1. Escopo e Requisitos Técnicos do Módulo Mobile

O módulo móvel (`mobile/`) foi construído para atender aos requisitos de campo da Persona Junior (corretor autônomo), operando sob restrições técnicas específicas:

- **Disponibilidade e Resiliência (Offline-First):** Operação contínua sob ausência total ou intermitência de conectividade de rede, utilizando armazenamento local (`AsyncStorage` com fallback in-memory) e sincronização bidirecional idempotente com a API NestJS.
- **Ergonomia e Acessibilidade (Apple HIG):** Áreas mínimas de toque de 44x44pt para manipulação monomanual em movimento, contraste tipográfico estrito (Slate sobre fundo claro), e posicionamento de elementos de navegação primária na base inferior da interface.
- **Taxa de Quadros Determinística (Two-Runtime Rule):** Separação estrita entre a thread de renderização da UI (60/120 FPS via worklets do `react-native-reanimated`) e a thread do JavaScript, eliminando engasgos (jank) e bloqueios de frame durante gestos de arraste e transições.
- **Segurança Fail-Closed:** Comunicação autenticada via JWT RFC 7519, rejeição estrita de tokens malformados ou simulados no backend (`JwtAuthGuard`), e auto-recuperação transparente de sessão.

---

## 2. Mapa Arquitetural do Mobile

```mermaid
flowchart TD
    subgraph UI_LAYER["Camada de Interface (Apple HIG & Safe Areas)"]
        APP["App.tsx (SafeAreaProvider + Root Gesture Handler)"]
        HEADER["DomusHeader (Status Badge, Reset Demo, Logout)"]
        NAV["DomusNavBar (Bottom Tab Bar Fixa na Base)"]
        SCREENS["Telas Ativas (Clientes, Imoveis, Agendar, Atendimentos, Login)"]
        TOAST["DomusToast (Feedback Flutuante na UI Thread)"]
        SHEET["ConnectionModal & Detalhes (Bottom Sheets Deslizantes)"]
    end

    subgraph RUNTIME_LAYER["Camada de Execução Nativa (Two-Runtime Rule)"]
        UI_THREAD["UI Thread (Reanimated Worklets + Gesture Handler a 60/120 FPS)"]
        JS_THREAD["JavaScript Thread (React State, Business Logic RN01-RN16)"]
    end

    subgraph STATE_LAYER["Camada de Estado e Conectividade"]
        CTX["DomusContext (Estado Global, Toasts, Abas, Sincronização)"]
        API["DomusApiService (domusApi.ts - Camada Híbrida)"]
        STORAGE["domusStorage (AsyncStorage / Memória Local)"]
    end

    subgraph BACKEND_LAYER["Serviços Externos"]
        NEST["Backend NestJS (http://localhost:3000/api)"]
        SQLITE["Banco SQLite + Migrações Prisma (dev.db)"]
    end

    APP --> HEADER
    APP --> SCREENS
    APP --> NAV
    APP --> TOAST
    APP --> SHEET

    SHEET -.->|Worklets de Arrasto| UI_THREAD
    TOAST -.->|Worklets de Transição| UI_THREAD
    SCREENS -->|Eventos de Toque| JS_THREAD

    SCREENS --> CTX
    CTX --> API
    API -->|Se Offline / Sem Rede| STORAGE
    API -->|Se Conectado (JWT)| NEST
    NEST --> SQLITE
```

---

## 3. Decisões Estruturais de System Design e Padrões de Interface

Antes da intervenção, a interface apresentava componentes genéricos desprovidos de convenções móveis e vícios de layouts web adaptados para telas móveis. Abaixo estão as 4 decisões de engenharia que reestruturaram a aplicação:

### Decisão 1: Eliminação de Alertas e Modais Bloqueantes
- **Problema Anterior:** Uso de popups nativos (`alert()`, `window.confirm()`) e modais de tela inteira opacos que paravam a navegação do corretor para mensagens triviais.
- **Solução Implementada:**
  1. **Feedback Flutuante Não-Bloqueante ([`DomusToast.tsx`](../mobile/src/components/DomusToast.tsx)):** Notificações contextuais leves que surgem no topo da tela com auto-dismiss (3 segundos via `.unref?.()`) e gesto de arrastar para cima para dispensar.
  2. **Botões com 3 Estados Integrados ([`DomusButton.tsx`](../mobile/src/components/DomusButton.tsx)):** Em vez de abrir um spinner de tela cheia, o próprio botão transiciona entre `idle` -> `loading` (spinner embutido + label "Salvando...") -> `success` (ícone de checkmark inline) com escala tátil `0.98`.
  3. **Confirmações Inline em Dois Toques ([`InlineConfirmButton.tsx`](../mobile/src/components/InlineConfirmButton.tsx)):** Exclusões e ações destrutivas (como o reset de demonstração) exigem dois toques consecutivos no próprio botão (com timer de 3.5 segundos para reversão), eliminando janelas modais invasivas.

### Decisão 2: Anatomia Apple HIG e Ergonomia Tátil
- **Problema Anterior:** Cabeçalho mostarda denso (`#FFE099`), fundo cinza cimento escuro (`#A6A6A6`), botões minúsculos (< 30pt) e barra de navegação no topo colidindo com status bars.
- **Solução Implementada:**
  1. **Paleta [`DOMUS_THEME`](../mobile/src/theme/tokens.ts):** Background iOS Grouped (`#F2F2F7`), cartões em branco puro (`#FFFFFF`) com bordas perimetrais uniformes de 1px (`#E2E8F0`), sombras em camadas discretas ([`DOMUS_SHADOWS`](../mobile/src/theme/tokens.ts)), tipografia Slate (`#0F172A`) e cor primária terracota vibrante (`#EA580C`) para contraste visual superior.
  2. **Touch Targets de 44pt:** Todo elemento clicável (chips, botões de alternância, badges, botões de fechar) possui altura mínima `>= 44pt` (`minHeight: 44`, `hitSlop: 6` a `8`), garantindo ergonomia para toque com o polegar.
  3. **Bottom Tab Bar Nativamente Posicionada ([`DomusNavBar.tsx`](../mobile/src/components/DomusNavBar.tsx)):** A barra de navegação foi fixada na base inferior de [`App.tsx`](../mobile/App.tsx), com indicador superior ativo em pílula, altura de `54pt` e feedback háptico sutil (`triggerSelectionHaptic`).

### Decisão 3: Transições Físicas na UI Thread (Two-Runtime Rule)
- **Problema Anterior:** Modais estáticos com abertura em corte seco ou animações travadas rodando na thread do JavaScript.
- **Solução Implementada:**
  - Aplicação estrita da **Two-Runtime Rule** em [`ConnectionModal.tsx`](../mobile/src/components/ConnectionModal.tsx) e na folha de detalhes de [`AtendimentosScreen.tsx`](../mobile/src/screens/AtendimentosScreen.tsx).
  - Utilização de `Gesture.Pan()` memoizado com `useMemo`.
  - Execução de worklets explícitos (`'worklet'`) nos manipuladores de gesto, controlando valores compartilhados (`useSharedValue`) e estilos animados (`useAnimatedStyle`).
  - Efeito elástico superior via `rubberband()` e desaceleração inercial via `projectVelocity()`, finalizando com molas amortecidas (`withSpring(..., { overshootClamping: true })`) e respeito às preferências de acessibilidade (`useReducedMotion`).
  - **Zero chamadas a `setState` durante o arrasto**, mantendo 60/120 FPS cravados.

### Decisão 4: Virtualização e Renderização Fluida (Padrão Callstack)
- **Problema Anterior:** Listas construídas com `ScrollView` + `.map()`, criando nós DOM/Native excessivos e provocando engasgos ao listar dezenas de imóveis ou clientes.
- **Solução Implementada:**
  - Adoção de `@shopify/flash-list` em todas as telas com listagens ([`ClientesScreen`](../mobile/src/screens/ClientesScreen.tsx), [`ImoveisScreen`](../mobile/src/screens/ImoveisScreen.tsx) e [`AtendimentosScreen`](../mobile/src/screens/AtendimentosScreen.tsx)).
  - Definição precisa de `estimatedItemSize` (148pt para clientes, 140pt para imóveis e atendimentos).
  - Extração de componentes de linha (`ClienteCardItem`, `ImovelCardItem`, `AtendimentoCardItem`) para fora do escopo funcional das telas, envelopados com `React.memo` para evitar reconciliações desnecessárias durante a digitação de filtros.

---

## 4. Camada de Dados e Arquitetura Híbrida (Offline-First)

O coração da persistência do DOMUS reside no serviço [`domusApi.ts`](../mobile/src/services/domusApi.ts) e no provedor [`DomusContext.tsx`](../mobile/src/context/DomusContext.tsx).

### Como funciona o chaveamento híbrido (`executarHibrido`):
```text
Requisição Disparada (ex: listarClientes)
               │
      Está forçado offline?
         ├─── SIM ───────────► Carrega estado local (AsyncStorage / Seed)
         └─── NÃO
               │
        Tenta chamar API NestJS (HTTP timeout: 2500ms)
               │
       Teve sucesso (200)?
         ├─── SIM ───────────► Retorna dados reais da API e marca: apiOnlineReal = true
         └─── NÃO (401 / Erro de Rede)
               │
     Auto-recuperação de Token JWT:
       - O token era mock (domus-mock-token-...)?
       - Chama /api/auth/login com credenciais Persona Junior
       - Se restabelecido: retenta chamada na API
       - Se servidor desligado / sem rede: fallback seguro para dados locais (apiOnlineReal = false)
```

### A Badge de Status no Cabeçalho
No [`DomusHeader.tsx`](../mobile/src/components/DomusHeader.tsx), a badge exibe visualmente o estado da conexão:
- **Pílula Âmbar (`Modo Demo Local`):** Ativada quando o app opera em memória local com dados simulados da Persona Junior ([`seedData.ts`](../mobile/src/services/seedData.ts)).
- **Pílula Verde (`API Online`):** Ativada quando há comunicação ativa com a API NestJS na porta `3000`, gravando diretamente no banco SQLite (`dev.db`).
- **Interatividade:** Tocar na badge abre imediatamente o Bottom Sheet [`ConnectionModal.tsx`](../mobile/src/components/ConnectionModal.tsx), permitindo testar a conectividade em tempo real, alternar a URL base da rede ou comutar manualmente para o modo offline.

---

## 5. Anatomia das Telas do DOMUS

### 1. `LoginScreen.tsx` (RN01, RN02, RN03)
- **Objetivo:** Autenticação e cadastro de novos operadores com separação de papéis.
- **Recursos:** Alternância entre Login e Cadastro; seletores em pílula de perfil (`CORRETOR` ou `CADASTRADOR`); card de acesso rápido com 1 toque para a Persona Junior (`junior.corretor` / `Domus@2026`); gaveta retrátil para configuração manual de IP/porta da API.

### 2. `ClientesScreen.tsx` (RN04, RN05, RN06)
- **Objetivo:** Gestão de clientes e captação de interesses imobiliários.
- **Recursos:** Formulário com validação de CPF/CNPJ; seleção tátil de canais de contato (`WhatsApp`, `Ligação`, `E-mail`, `Instagram`); vinculação direta de imóveis de interesse; barra de pesquisa em tempo real; `FlashList` virtualizada com avatares de iniciais coloridos e atalho rápido "Agendar".

### 3. `ImoveisScreen.tsx` (RN07)
- **Objetivo:** Cadastro e catálogo de imóveis captados.
- **Recursos:** Seletores em pílula para `Tipo de Imóvel` (`Apartamento`, `Casa`, `Comercial`, `Terreno`) e `Finalidade` (`Venda`, `Aluguel`); campos com máscaras monetárias; botões inline com 3 estados; listagem de imóveis com badge de status e atalho "Agendar Visita".

### 4. `AgendarScreen.tsx` (RN08, RN10, RN16)
- **Objetivo:** Agendamento de compromissos com prevenção de conflitos.
- **Recursos:** Validação estrita das regras de negócio (imóvel obrigatório em visitas segundo a `RN08`; cliente obrigatório segundo a `RN10`); seleção de data e hora; toggle tátil (`>= 48pt`) para sincronização com o Google Calendar (`RN16`).

### 5. `AtendimentosScreen.tsx` (RN09, RN11, RN12, RN14, RN15)
- **Objetivo:** Painel de controle operacional e lembretes do corretor.
- **Recursos:** Componente [`AvisoBanner.tsx`](../mobile/src/components/AvisoBanner.tsx) no topo com a mensagem oficial da problemática acadêmica (`"Você tem agendamentos próximo do dias marcados"`); métricas rápidas em cartões; filtros segmentados em pílulas (`Todos`, `Por Cliente`, `Por Imóvel`, `Sem Data`); Bottom Sheet deslizante por gestos para **Programar Retorno (RN09)**, **Concluir Atendimento (RN12)** com baixa de avisos e **Sincronizar com Google Agenda (RN16)**.

### 6. Shell Principal (`App.tsx`)
- **Objetivo:** Orquestrador visual de layout, provedor de contexto e áreas seguras.
- **Recursos:** Envolve a aplicação com `GestureHandlerRootView` e `SafeAreaProvider`; posiciona o `DomusHeader` no topo e o `DomusNavBar` na base; gerencia a troca fluida entre as abas; hospeda os componentes flutuantes globais (`DomusToast` e `ConnectionModal`).

---

## 6. Desafios Técnicos de Engenharia e Soluções

Durante o desenvolvimento da arquitetura móvel, foram superados desafios técnicos específicos que merecem destaque para manutenção futura do código:

| Desafio / Erro Encontrado | Causa Raiz | Solução de Engenharia Aplicada |
| :--- | :--- | :--- |
| **`Invalid hook call` em `components.spec.tsx`** | A suíte de testes legada chamava componentes diretamente como função (`DomusInput({...})`) fora de `renderer.create()`. Hooks nativos do React 19 lançam exceção sem um dispatcher ativo. | Criação dos hooks seguros [`safeHooks.ts`](../mobile/src/utils/safeHooks.ts) (`useSafeState`, `useSafeRef`, `useSafeEffect`), que utilizam `try/catch` interno para retornar valores padrão caso o dispatcher esteja ausente. |
| **Erro de compilação TS no `FlashListProps`** | A versão `@shopify/flash-list@^2.3.3` removeu temporariamente a declaração de tipo da propriedade `estimatedItemSize`. | Criação do arquivo de aumento de módulo [`mobile/src/types/flash-list.d.ts`](../mobile/src/types/flash-list.d.ts) estendendo `FlashListProps` para aceitar `estimatedItemSize?: number`. |
| **Erro Metro: `Unable to resolve react-native-worklets`** | O `react-native-reanimated` v4 depende do pacote de baixo nível `react-native-worklets` para empacotamento web e mobile. | Instalação explícita de `react-native-worklets` no `package.json`, destravando o bundle web (`npx expo export -p web` com 1154 módulos compilados). |
| **Badge não atualizava para "API Online"** | O aplicativo inicializava com um token mock (`domus-mock-token-...`). Ao conectar na API NestJS, o `JwtAuthGuard` rejeitava o token malformado com 401, acionando o fallback offline. | Implementação de auto-autenticação transparente em `domusApi.ts`: se o token for mock, ele faz login na rota `/api/auth/login` com as credenciais da Persona Junior (`junior.corretor` / `Domus@2026`), adquire o JWT real e atualiza a badge imediatamente. |

---

## 7. Como Executar e Apresentar o Mobile

### No Navegador Web (Computador de Apresentação):
```powershell
cd mobile
npx expo start --web --port 8081
```
Acesse `http://localhost:8081` no navegador.

### No Celular Físico via Cabo USB (Depuração Ativa):
```powershell
# 1. Roteia a porta 3000 do NestJS para o celular
adb reverse tcp:3000 tcp:3000

# 2. Inicia o Metro Bundler
cd mobile
npx expo start
```
Abra o **Expo Go** no celular e aponte a câmera para o QR Code. No modal de conexão do app, utilize `http://localhost:3000/api`.

### No Celular Físico via Wi-Fi:
Certifique-se de que o computador e o celular estão na mesma rede Wi-Fi. Abra o modal de conexão do app e insira o IP da sua máquina (ex: `http://192.168.1.100:3000/api`).

### Execução de Testes e Tipagem Estrita:
```powershell
cd mobile

# Executa as 4 suítes de testes unitários (39 testes)
npm test

# Validação de tipagem TypeScript
npm run typecheck
```

---

## 8. Catálogo Técnico e Justificativa das Bibliotecas Utilizadas

O ecossistema de dependências configurado em [`mobile/package.json`](../mobile/package.json) foi selecionado para atender requisitos específicos de desempenho, compatibilidade multiplataforma (iOS, Android e Web) e desacoplamento de infraestrutura. Abaixo está a especificação técnica de cada biblioteca instalada.

### Dependências de Produção (`dependencies`)

#### 1. `react-native-reanimated` (`^4.7.1`) e `react-native-worklets` (`^0.13.0`)
- **Papel Arquitetural:** Motor de animações de alto desempenho e execução em thread separada.
- **Funcionamento Técnico:** O React Native tradicional executa a lógica JavaScript em uma thread separada da thread de renderização da interface (UI Thread). O `react-native-reanimated` utiliza JavaScript Worklets (micro-threads síncronas compiladas via JSI - JavaScript Interface) que executam cálculos matemáticos e interpolações de estilos diretamente na UI Thread a 60 FPS ou 120 FPS. Isso elimina engasgos visuais e oscilações de frame causados por bloqueios eventuais no loop de eventos do JavaScript.
- **Justificativa da Inclusão:** Animações fluidas nos cartões interativos, transições de abas e abertura de Bottom Sheets sem latência perceptível. O pacote `react-native-worklets` é a dependência de runtime exigida a partir da v4 do Reanimated para permitir o empacotamento web e mobile unificado.

#### 2. `react-native-gesture-handler` (`^3.4.0`)
- **Papel Arquitetural:** Subsistema declarativo de manipulação e despacho de gestos nativos.
- **Funcionamento Técnico:** Em vez de depender do responder system legado do React Native (que despacha eventos de toque para a thread JS antes de decidir a resposta), o Gesture Handler se integra diretamente às APIs nativas de gestos do sistema operacional (`UIGestureRecognizer` no iOS e classes `MotionEvent` no Android).
- **Justificativa da Inclusão:** Rastreamento contínuo de arrasto para o Bottom Sheet de atendimentos, toques rápidos em botões e prevenção de conflitos de gestos entre listas de rolagem e elementos interativos internos.

#### 3. `@shopify/flash-list` (`^2.3.3`)
- **Papel Arquitetural:** Virtualização e reciclagem de células em listas de dados extensas.
- **Funcionamento Técnico:** A `FlatList` padrão do React Native cria e desmonta instâncias de componentes React à medida que o usuário rola a tela, o que causa picos de alocação de memória e paradas de coleta de lixo (Garbage Collection). O `FlashList` implementa uma arquitetura de reciclagem de views: um número fixo de nós visuais é criado e mantido em memória; durante a rolagem, as views recicladas apenas recebem novas propriedades (`props`), reutilizando a estrutura nativa já renderizada.
- **Justificativa da Inclusão:** Renderização de grandes listas de imóveis e históricos de atendimentos com consumo de memória estável e taxa de quadros sustentada em 60/120 FPS.

#### 4. `react-native-safe-area-context` (`^5.10.1`)
- **Papel Arquitetural:** Extração e propagação de métricas das áreas seguras da tela.
- **Funcionamento Técnico:** Comunica-se com as janelas do sistema operacional para obter as dimensões exatas de bordas físicas e elementos de sistema (Notch superior, Dynamic Island, barra de status e barra de gestos inferior). Expõe essas métricas via context (`SafeAreaProvider`) e hook reativo (`useSafeAreaInsets`).
- **Justificativa da Inclusão:** Garante que o [`DomusHeader`](../mobile/src/components/DomusHeader.tsx) não colida com o topo do aparelho e que a barra de navegação inferior [`DomusNavBar`](../mobile/src/components/DomusNavBar.tsx) reserve o espaçamento adequado para a barra de gestos do iOS e Android.

#### 5. `expo-haptics` (`^58.0.7`)
- **Papel Arquitetural:** Interface de controle de feedback físico e vibração tátil.
- **Funcionamento Técnico:** Invoca chamadas de sistema no Taptic Engine (iOS) e no subsistema de vibração tátil de precisão (Android) através dos métodos `selectionAsync`, `impactAsync` (intensidades leve, média e pesada) e `notificationAsync`.
- **Justificativa da Inclusão:** Enriquecimento da usabilidade através de confirmação física não visual ao alternar filtros, pressionar botões de ação e concluir agendamentos, implementado em [`mobile/src/utils/haptics.ts`](../mobile/src/utils/haptics.ts).

#### 6. `@react-native-async-storage/async-storage` (`^3.1.1`)
- **Papel Arquitetural:** Camada de persistência chave-valor assíncrona não volátil.
- **Funcionamento Técnico:** Fornece uma API Promise-based que grava dados estruturados no armazenamento local do dispositivo: utiliza SQLite no Android, RocksDB/UserDefaults no iOS e `window.localStorage` no ambiente web.
- **Justificativa da Inclusão:** Armazenamento do token de autenticação JWT (`@domus:access_token`), da URL base configurada para a API NestJS (`@domus:api_base_url`) e do snapshot completo dos dados locais offline (`@domus:local_state`), permitindo operação autônoma sem conexão com a internet.

#### 7. `@expo/vector-icons` (`^15.1.1`)
- **Papel Arquitetural:** Renderização de glifos vetoriais escaláveis.
- **Funcionamento Técnico:** Encapsula famílias de fontes de ícones padronizadas da indústria (como Ionicons, Feather e MaterialIcons) como fontes TrueType/OpenType renderizadas via texto vetorial, garantindo nitidez matemática independente da densidade de pixels da tela (`@2x`, `@3x`, Retina).
- **Justificativa da Inclusão:** Eliminação de elementos gráficos inconsistentes e substituição por iconografia profissional em todas as telas, botões, modais e badges.

#### 8. `react-native-web` (`^0.21.4`) e `react-dom` (`^19.1.0`)
- **Papel Arquitetural:** Camada de compatibilidade e compilação para navegadores desktop e móveis.
- **Funcionamento Técnico:** Mapeia primitivas nativas do React Native (`View`, `Text`, `Pressable`, `StyleSheet`) diretamente para elementos semânticos do DOM (`div`, `span`, estilos CSS em classe).
- **Justificativa da Inclusão:** Permite que toda a aplicação mobile seja executada, inspecionada e demonstrada diretamente em navegadores web (`http://localhost:8081`), simplificando testes em máquinas de desenvolvimento sem necessidade imediata de emuladores pesados.

#### 9. `expo-constants` (`~18.0.0`)
- **Papel Arquitetural:** Leitura de propriedades e metadados do manifesto da aplicação em runtime.
- **Funcionamento Técnico:** Expõe dados do manifesto do Expo gerados pelo Metro Bundler durante o handshake de inicialização. No DOMUS, extrai `Constants.expoConfig?.hostUri` para identificar o endereço IP da máquina servidora na rede local.
- **Justificativa da Inclusão:** Descoberta dinâmica da URL da API NestJS em desenvolvimento local, permitindo que o celular físico se conecte automaticamente ao computador na rede local sem necessidade de edição manual de arquivos de configuração.

#### 10. `expo-status-bar` (`~58.0.0`)
- **Papel Arquitetural:** Gestão declarativa do estilo da barra de status do sistema.
- **Funcionamento Técnico:** Modifica o esquema de cores dos ícones de hora, bateria e rede do sistema operacional (`dark` ou `light`) de forma sincronizada com as rotas e modais ativos da aplicação.
- **Justificativa da Inclusão:** Manutenção de legibilidade visual constante e harmonia com o cabeçalho escuro do tema DOMUS.

#### 11. `@expo/metro-runtime` (`~58.0.15`) e `expo` (`~58.0.16`)
- **Papel Arquitetural:** Runtime principal e motor de desenvolvimento unificado.
- **Funcionamento Técnico:** O `expo` fornece as pontes nativas e o ciclo de vida do aplicativo móvel. O `@expo/metro-runtime` implementa o protocolo de Fast Refresh e injeção a quente de módulos em tempo de desenvolvimento na web.
- **Justificativa da Inclusão:** Base do ecossistema Expo SDK 58, garantindo compatibilidade entre React Native 0.78 e React 19.

---

### Dependências de Desenvolvimento (`devDependencies`)

| Biblioteca | Versão | Função Técnica |
| :--- | :--- | :--- |
| **`typescript`** | `~5.8.0` | Compilador de tipagem estática. Executa verificação em tempo de compilação de todas as interfaces, contratos de API e modelos de dados (`npm run typecheck`). |
| **`jest`** e **`ts-jest`** | `^29.7.0` / `^29.2.6` | Framework de execução de testes unitários e transformador TypeScript em memória. Executa asserções de regras de negócio e contratos de API sem necessidade de transpilação prévia para disco. |
| **`react-test-renderer`** | `^19.1.0` | Renderizador sintético em memória para React 19. Permite renderizar a árvore de componentes sem um ambiente de navegador ou simulador de dispositivo móvel ativo. |
| **`@types/*`** | Várias | Definições de tipagem estática TypeScript para bibliotecas JavaScript e runtime (`@types/jest`, `@types/react`, `@types/react-native`, `@types/react-test-renderer`). |

---

## 9. Física de Gestos e Matemática de Worklets (`motion.ts` e `haptics.ts`)

Para garantir que os componentes deslizantes (`ConnectionModal.tsx` e o painel de ações em `AtendimentosScreen.tsx`) respondam à inércia do toque com precisão nativa na UI Thread, o módulo [`mobile/src/utils/motion.ts`](../mobile/src/utils/motion.ts) implementa duas funções matemáticas compiladas como worklets (`'worklet'`):

### 1. Projeção Inercial de Velocidade (`projectVelocity`)
Calcula a posição final estimada de um painel quando o usuário solta o dedo após um gesto rápido (swipe/fling), utilizando a taxa de desaceleração padrão do `UIScrollView` do iOS ($\text{decelerationRate} = 0.998$):

$$\text{Deslocamento Projetado} = \left(\frac{v}{1000}\right) \cdot \frac{d}{1 - d}$$

Onde $v$ é a velocidade do gesto em pixels por segundo (`event.velocityY`) e $d$ é a taxa de desaceleração. Isso permite que um gesto curto porém rápido feche o Bottom Sheet mesmo que o deslocamento absoluto do dedo ainda não tenha ultrapassado 35% da altura do painel.

### 2. Resistência Elástica Assintótica (`rubberband`)
Quando o usuário arrasta o Bottom Sheet para cima além do seu limite máximo de abertura, aplica-se a equação de resistência elástica da Apple (constante $c = 0.55$):

$$f(x, d, c) = \left(1 - \frac{1}{\frac{x \cdot c}{d} + 1}\right) \cdot d$$

Onde $x$ é o excesso de arrasto (`overshoot`) e $d$ é a dimensão de referência. O deslocamento visual cresce de forma sublinear, impedindo que o painel se descole da base da tela.

### 3. Degradação Graciosa de Feedback Tátil (`haptics.ts`)
O módulo [`mobile/src/utils/haptics.ts`](../mobile/src/utils/haptics.ts) encapsula todas as chamadas ao `expo-haptics` em blocos `try/catch` silenciosos e verifica a plataforma antes do disparo. Como navegadores web (`react-native-web`) e o ambiente de testes Node.js não possuem motor Taptic Engine, essa camada garante que o acionamento de `triggerSelectionHaptic()`, `triggerImpactHaptic()` e `triggerNotificationHaptic()` nunca lance exceções não tratadas em plataformas sem suporte de hardware.

---

## 10. Arquitetura de Persistência Resiliente (`storage.ts`) e Isolamento de Testes (`__mocks__/`)

### Padrão Strategy / Fallback em `storage.ts`
O arquivo [`mobile/src/services/storage.ts`](../mobile/src/services/storage.ts) define a interface `StorageDriver` e a classe `DomusStorage`. Na inicialização (`resolveStorageDriver()`):
1. Tenta resolver dinamicamente o módulo nativo `@react-native-async-storage/async-storage`.
2. Envolve cada método (`getItem`, `setItem`, `removeItem`, `clear`) em um bloco de captura que delega automaticamente para uma instância de `MemoryStorageDriver` (`Map<string, string>` em memória RAM) caso a ponte nativa falhe ou não exista (como durante a execução de testes via Jest no Node.js ou em janelas anônimas restritas).
3. Serializa e desserializa objetos com `JSON.stringify` / `JSON.parse` protegidos contra corrupção de payload.

### Isolamento de Módulos Nativos no Jest (`jest.config.js` e `src/__mocks__/`)
Bibliotecas como `react-native-reanimated`, `react-native-gesture-handler`, `@shopify/flash-list` e `expo-haptics` dependem de binários nativos (C++/JSI/Objective-C/Java) inexistentes no runtime Node.js. Para viabilizar testes unitários rápidos (`~3.5s` para 39 testes) sem necessidade de compilar um emulador Android/iOS:
- O arquivo [`mobile/jest.config.js`](../mobile/jest.config.js) utiliza `moduleNameMapper` para redirecionar todas as importações nativas para dublês determinísticos em [`mobile/src/__mocks__/`](../mobile/src/__mocks__/).
- O mock [`react-native-reanimated.ts`](../mobile/src/__mocks__/react-native-reanimated.ts) simula `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming` e `useReducedMotion` de forma síncrona.
- O mock [`flash-list.ts`](../mobile/src/__mocks__/flash-list.ts) executa `renderItem` diretamente para cada elemento de `data` ou renderiza `ListEmptyComponent` quando o array está vazio, permitindo testar a árvore renderizada das listas com `react-test-renderer`.

---

## 11. Segurança na Integração Mobile-Backend (RBAC e Mitigação OWASP A01)

A comunicação entre o aplicativo móvel e o servidor NestJS (`backend/`) segue o princípio de **Confiança Zero no Cliente (Zero Client Trust)**:

1. **Prevenção de Escalação de Privilégio no Auto-Cadastro (`RN01` / `RN03`):**
   - Mesmo que uma requisição maliciosa originada fora da UI tente enviar `perfil: "CADASTRADOR"` na rota pública `POST /api/usuarios`, o serviço [`usuarios.service.ts`](../backend/src/usuarios/usuarios.service.ts) bloqueia a operação com `ForbiddenException (403)`. Apenas operadores já autenticados com papel `CADASTRADOR` na rota administrativa `POST /api/usuarios/admin` podem criar contas com privilégio elevado.
2. **Restrição de Mutação de Usuários (`PATCH /api/usuarios/:id`):**
   - Protegido no controlador [`usuarios.controller.ts`](../backend/src/usuarios/usuarios.controller.ts) com `@UseGuards(JwtAuthGuard, RolesGuard)` e `@Roles(PerfilUsuario.CADASTRADOR)`, impedindo que um token de `CORRETOR` altere dados ou perfis de outros usuários.
3. **Validação Estrita de Payload (`ValidationPipe`):**
   - O backend opera com `whitelist: true` e `forbidNonWhitelisted: true`, rejeitando qualquer propriedade extra não declarada nos DTOs enviados pelo cliente móvel.

---

## 12. Referências Oficiais e Conceitos de Engenharia

Esta seção reúne as fontes primárias, especificações normativas e links oficiais para as tecnologias, padrões ergonômicos e conceitos de engenharia adotados na arquitetura do aplicativo móvel DOMUS.

### 1. Padrões de Design e Ergonomia de Interface (Apple HIG)

- **Apple Human Interface Guidelines (Apple HIG):**
  - **Definição Técnica:** O conjunto canônico de princípios e especificações mantido pela Apple para o desenvolvimento de interfaces no iOS. Abrange critérios de ergonomia motora, hierarquia visual, contraste tipográfico, feedback sensorial e navegação espacial.
  - **Link Oficial:** [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- **Área Mínima de Toque (Touch Targets de 44x44pt):**
  - **Definição Técnica:** Requisito ergonômico e de acessibilidade (formalizado no Apple HIG e nas diretrizes WCAG 2.1 — Critério 2.5.5/2.5.8). Estipula que qualquer controle interativo manipulado por toque digital deve possuir dimensões mínimas de 44 por 44 pontos tipográficos (`minHeight: 44` ou expansão de área de toque via `hitSlop`), compensando a imprecisão física do polegar sem provocar acionamentos acidentais.
  - **Links Oficiais:** [Apple HIG — Layout and Inputs](https://developer.apple.com/design/human-interface-guidelines/layout) | [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- **Barra de Navegação Inferior (Bottom Tab Bars):**
  - **Definição Técnica:** Padrão ergonômico que posiciona os destinos principais da aplicação no terço inferior da tela ("Thumb Zone"), viabilizando a navegação com uma única mão sem necessidade de reposicionar o aparelho.
  - **Link Oficial:** [Apple HIG — Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

### 2. Arquitetura de Execução Nativa e Animações (Two-Runtime Rule)

- **Two-Runtime Rule e JavaScript Worklets:**
  - **Definição Técnica:** Princípio de engenharia no ecossistema React Native moderno que estabelece a separação estrita de execução entre a thread JavaScript (onde roda o código da aplicação e lógica de negócio) e a UI Thread nativa (onde roda a renderização). Funções marcadas como worklets (`'worklet'`) são compiladas e injetadas diretamente na UI Thread através da JSI (JavaScript Interface em C++), operando a 60 FPS ou 120 FPS de forma síncrona e imune a bloqueios da thread principal do JS.
  - **Links Oficiais:** [React Native Reanimated — Architecture & Glossary](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#worklet) | [Software Mansion — react-native-worklets](https://github.com/software-mansion/react-native-worklets)
- **React Native Gesture Handler:**
  - **Definição Técnica:** Mecanismo declarativo que transfere o reconhecimento e despacho de gestos para os tratadores nativos do sistema operacional (`UIGestureRecognizer` no iOS e classes `MotionEvent` no Android), contornando o Responder System legado do React Native.
  - **Link Oficial:** [React Native Gesture Handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/)
- **Física Inercial e Efeito Elástico (Rubberbanding):**
  - **Definição Técnica:** Comportamento matemático proprietário do componente nativo `UIScrollView` do UIKit (iOS). Define a equação sublinear de resistência elástica quando a área de conteúdo é puxada além do limite da tela e a taxa de desaceleração inercial logarítmica ($d = 0.998$).
  - **Link Oficial:** [Apple Developer Documentation — UIScrollView](https://developer.apple.com/documentation/uikit/uiscrollview)

### 3. Virtualização e Reciclagem de Células

- **Shopify FlashList:**
  - **Definição Técnica:** Componente de virtualização de alto desempenho para React Native que substitui o modelo de montagem/desmontagem de instâncias da `FlatList` padrão pelo padrão de reciclagem de nós de interface (análogo ao `RecyclerView` do Android e `UICollectionView` do iOS). Reduz expressivamente a pressão sobre o coletor de lixo (Garbage Collector) mantendo um número fixo de views em memória.
  - **Links Oficiais:** [Shopify FlashList Documentation](https://shopify.github.io/flash-list/) | [Shopify Engineering — Recycling vs Unmounting](https://shopify.engineering/recycling-unmounting-react-native-flashlist)

### 4. Geometria de Janela e Resposta Háptica

- **React Native Safe Area Context:**
  - **Definição Técnica:** Biblioteca que consulta as métricas de recorte de hardware da janela do sistema operacional (`UIEdgeInsets` no iOS e `WindowInsets` no Android) para obter as dimensões exatas de zonas obstruídas (Dynamic Island, Notch, barra de status superior e barra de gestos da base).
  - **Link Oficial:** [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- **Expo Haptics (Taptic Engine e Haptic Feedback API):**
  - **Definição Técnica:** Interface de software que comanda atuadores eletromecânicos de vibração de precisão em dispositivos móveis, fornecendo confirmação tátil localizada (`impact`, `selection`, `notification`) sem dependência de som ou feedback exclusivamente visual.
  - **Link Oficial:** [Expo Haptics Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/)

### 5. Persistência de Dados e Execução Multiplataforma

- **React Native AsyncStorage:**
  - **Definição Técnica:** Sistema de persistência chave-valor assíncrono que delega o armazenamento físico para SQLite no Android, RocksDB/UserDefaults no iOS e `window.localStorage` em navegadores web.
  - **Link Oficial:** [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
- **React Native for Web:**
  - **Definição Técnica:** Camada de compatibilidade que compila primitivas do React Native (`View`, `Text`, `StyleSheet`) diretamente em elementos semânticos de HTML e CSS atômico para navegadores desktop e móveis.
  - **Link Oficial:** [React Native for Web Documentation](https://necolas.github.io/react-native-web/)

### 6. Segurança, Autenticação e Autorização

- **OWASP Top 10 (A01:2021 — Broken Access Control):**
  - **Definição Técnica:** Categoria prioritária de vulnerabilidade que ocorre quando o controle de acesso não é aplicado rigidamente no backend, permitindo que usuários manipulem identificadores ou endpoints para acessar recursos de terceiros ou auto-conceder perfis administrativos.
  - **Link Oficial:** [OWASP Top 10 — A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **RFC 7519 — JSON Web Token (JWT):**
  - **Definição Técnica:** Especificação normativa da IETF para transmissão compacta e auto-contida de reivindicações de identidade (claims) através de objetos JSON assinados digitalmente com HMAC ou criptografia assimétrica RSA/ECDSA.
  - **Link Oficial:** [IETF RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- **NestJS Authentication & Role-Based Access Control (RBAC):**
  - **Definição Técnica:** Arquitetura do NestJS baseada em interceptores (`CanActivate`) que combinam `JwtAuthGuard` (validação de integridade de token) e `RolesGuard` (inspeção de papéis autorizados via decoradores de metadados `@Roles()`).
  - **Links Oficiais:** [NestJS Authentication](https://docs.nestjs.com/security/authentication) | [NestJS Authorization](https://docs.nestjs.com/security/authorization)
