# Especificação de Design — Aplicativo Mobile DOMUS (React Native / Expo Go)

**Data:** 2026-10-20
**Projeto:** DOMUS — Sistema de Acompanhamento de Clientes, Atendimentos e Retornos para Corretores de Imóveis
**Unidade Curricular:** Programação para Dispositivos Móveis e Projeto Extensionista IV (UNIESP — 2026.2)
**Equipe:** Alexander Augusto de Figueiredo Baxendale, Pedro Neto Amancio, Rodrigo Santos Costa
**Professor(a):** Álekiss Manço de Mélo

---

## 1. Contexto, Intenção e Problemática (Por Quê)

A partir do estudo de caso único com o corretor autônomo **Junior** (João Pessoa/PB), constatou-se que sua principal dor não é a ausência de registro, mas a falta de **avisos claros sobre retornos agendados, compromissos próximos e tarefas que ficaram sem data** ao utilizar planilhas:

> *"Eu não coloquei a data que deveria dar o retorno para o cliente na planilha, então ele me ligou chateado."*
> *"Gosto de planilhas, pois sou acostumado a usar os programas, mas ela não é boa em me avisar do que devo fazer."*

O objetivo do aplicativo móvel **DOMUS Mobile (`mobile/`)** em **React Native (Expo Go)** é materializar o protótipo validado no documento [MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx](file:///d:/code/DOMUS/docs/MODELO%20DIAGN%C3%93STICO%20DA%20PROBLEM%C3%81TICA%20E%20PLANO%20DE%20INTERVEN%C3%87%C3%83O.docx), entregando uma experiência móvel fluida, fiel à identidade visual dos protótipos anexados ao documento e integrada às regras de negócio (`RN01`–`RN16`) do backend oficial em `backend/`.

---

## 2. Referências Visuais Extraídas do Diagnóstico (`docs/prototipos/`)

As quatro telas de referência do anexo do documento oficial foram extraídas e catalogadas em `docs/prototipos/`:

| Arquivo Extraído | Tela no Diagnóstico | Elementos-Chave do Wireframe |
| :--- | :--- | :--- |
| [01-cadastro-cliente.png](file:///d:/code/DOMUS/docs/prototipos/01-cadastro-cliente.png) | **Cadastro de Cliente** | Topo `DOMUS`, barra `Agendar | Imoveis | Atendimentos`, título `Cadastro de Cliente`, campos `nome Completo`, `CPF`, `Telefone`, `E-mail` (+ extensões da Seção 4.2: `Canal Principal de Contato`, `Observações` e `Imóveis de Interesse`), botão laranja `Cadastrar`. |
| [02-agendar-compromisso.png](file:///d:/code/DOMUS/docs/prototipos/02-agendar-compromisso.png) | **Agendar Compromisso** | Título `Criar seu Agendamento` (corrigindo typo `"Crier"` do wireframe), campos `Titulo`, `Descrição`, `Data` e `Hora:` lado a lado, `Duração`, `Observação` (+ seletores de `Tipo: Visita/Retorno/Atendimento`, `Cliente`, `Imóvel` e `Próxima Ação`), botão laranja `Agendar`. |
| [03-visualizacao-atendimentos.png](file:///d:/code/DOMUS/docs/prototipos/03-visualizacao-atendimentos.png) | **Visualização de Atendimentos** | Título `Seus Atendimentos`, cards cinza-claros com `Titulo do Agendamento`, `Descrição Curta` e caixa de seleção (checkbox) à direita, além de botão laranja `Visualizar` e filtros de organização **por Cliente**, **por Imóvel** e **Pendências/Sem Data** (Seção 4.3). |
| [04-aviso-agendamentos-proximos.png](file:///d:/code/DOMUS/docs/prototipos/04-aviso-agendamentos-proximos.png) | **Disparar Avisos de Agendamentos Próximos** | Banner superior azul-claro com ícone de sino, mensagem `"Você tem agendamentos proximo do dias marcados"` e botão de fechar (`×`) no canto superior direito do banner, exibido sobre a tela `Seus Atendimentos`. |

---

## 3. Objetivos, Não-Objetivos e Anti-Objetivos

### 3.1. Objetivos (Escopo do MVP Mobile — Seções 4 e 5)
1. **Autenticação e Cadastro de Usuário (`RN01`–`RN03`):** Login (`junior.corretor` / `Domus@2026`), cadastro de novo corretor/cadastrador e preenchimento rápido de credenciais de demonstração para apresentação em sala.
2. **Cadastro e Seleção de Clientes (`RN04`–`RN06`):** Formulário de cliente com Nome Completo, CPF/CNPJ, Telefone, E-mail, Canal Principal de Contato (`WHATSAPP`, `TELEFONE`, `REDE_SOCIAL`, `EMAIL`, `PRESENCIAL`), Observações de perfil e vínculo com Imóveis de Interesse.
3. **Cadastro e Seleção de Imóveis (`RN07`):** Cadastro enxuto e listagem de apoio para vincular imóveis aos clientes e às visitas (Inscrição, Tipo, Finalidade, Endereço, Bairro, Valor).
4. **Agendamento de Visitas, Retornos e Atendimentos (`RN08`–`RN10`, `RN16`):** Criação de compromissos com validação de imóvel obrigatório em `VISITA`, programação rápida de retorno derivado (`POST /api/agendamentos/:id/programar-retorno`) e botão de sincronização/abertura de link do **Google Calendar**.
5. **Visualização de Atendimentos e Pendências (`RN11`–`RN12`):** Lista `"Seus Atendimentos"` com seleção por checkbox, modal/tela de detalhe (`Visualizar`), conclusão rápida de atendimento e alternância de visão: **Todos**, **Por Cliente**, **Por Imóvel** e **Sem Data / Atrasados**.
6. **Banner e Central de Avisos (`RN13`–`RN15`):** Exibição proativa do banner `"Você tem agendamentos proximo do dias marcados"` com ícone de sino, contagem de alertas (próximos em 48h, atrasados e tarefas sem data), ação de disparar/atualizar avisos e dispensa individual (`×`).
7. **Modo Híbrido Resiliente (API REST + Fallback Demo/Offline):** Comunicação com `backend/` (`http://<HOST>:3000/api`) com chaveamento automático ou manual para repositório local (`AsyncStorage` + Seed da Persona Junior), garantindo funcionamento pleno no **Expo Go** em qualquer rede Wi-Fi ou 4G durante a validação com o corretor e banca acadêmica.

### 3.2. Não-Objetivos (Funcionalidades Retiradas na Seção 5 do Diagnóstico)
- **Não** implementar módulo de consulta ao estado da venda/funil financeiro.
- **Não** implementar calculadora ou consulta de percentual de comissão.
- **Não** implementar vitrine pública/portal de busca de imóveis para compradores finais (o módulo de imóveis existe estritamente para vinculação comercial às visitas e interesses do cliente).

### 3.3. Anti-Objetivos (O que tornaria o projeto uma falha mesmo funcionando)
- Dependência de pacotes com código nativo customizado que exijam `expo prebuild` / Development Build e impeçam a abertura imediata no aplicativo **Expo Go** padrão da App Store / Play Store.
- Tela travada ou em erro de rede caso o celular com Expo Go não consiga alcançar o IP local da máquina com o `backend/` NestJS.
- Descaracterização visual em relação aos protótipos entregues no documento `.docx`.

---

## 4. Decisões de Arquitetura, Stack e UI/UX (Escolhas Aprovadas)

### 4.1. Stack Tecnológica (`mobile/`)
- **Runtime & Plataforma:** React Native com **Expo SDK 58** (`expo@~58.0.16`, compatível com o aplicativo **Expo Go** atual), linguagem **TypeScript** (`strict: true`).
- **Navegação:** `expo-router` (ou `@react-navigation/native` encapsulado pelo cabeçalho institucional `DomusHeader` + barra `DomusNavBar` fiel ao protótipo). Adotaremos estado de navegação controlado por abas/rotas com o topo fixo `DOMUS` + barra `Agendar | Imoveis | Atendimentos | Clientes` para preservar 100% a anatomia visual das 4 imagens do `.docx`.
- **Estilização:** `StyleSheet` nativo do React Native com tokens centralizados em `src/theme/tokens.ts` (zero risco de incompatibilidade Metro/Babel no Expo Go).
- **Ícones:** `@expo/vector-icons` (`Ionicons` / `MaterialCommunityIcons` — já embutido no Expo Go).
- **Persistência Local e Sessão:** `@react-native-async-storage/async-storage` (compatível com Expo Go) com fallback em memória para testes automatizados Jest.
- **Testes Automatizados:** `jest` + `ts-jest` / `@testing-library/react-native` cobrindo cliente de API/fallback híbrido, regras de validação de formulário (`RN04`–`RN15`) e componentes/telas principais.

### 4.2. Paleta de Cores e Tokens Visuais (`Identidade DOMUS Polida`)
Extraída diretamente das imagens `01` a `04` em `docs/prototipos/` e refinada para contraste e ergonomia mobile:
- `headerBg`: `#FFE099` (Amarelo-âmbar claro do topo DOMUS)
- `headerText`: `#1A1A1A` (Tipografia forte da marca `DOMUS`)
- `navBarBg`: `#262626` (Barra de navegação escura abaixo do header)
- `navBarText`: `#E5E5E5` / Ativo: `#FFA347` (Destaque laranja na aba ativa)
- `canvasBg`: `#A6A6A6` (Cinza médio característico do fundo dos protótipos, com variante suave `#B5B5B5` para melhor contraste)
- `surfaceInput` / `cardBg`: `#D9D9D9` (Cinza claro dos inputs e cards de atendimento, com borda sutil `#C4C4C4` e `borderRadius: 8`)
- `checkboxBg`: `#F5F5F5` (Quadrado branco/gelo de seleção nos cards de atendimento)
- `primaryOrange`: `#FFA347` (Botões principais `Cadastrar`, `Agendar`, `Visualizar`)
- `primaryButtonText`: `#111111` (Texto preto semi-negrito centralizado nos botões laranja)
- `alertBannerBg`: `#B8C8E8` (Azul-claro do banner de notificação `"Você tem agendamentos proximo do dias marcados"`)
- `alertBannerText`: `#111111` (Texto e ícone de sino pretos no banner)
- `statusDanger`: `#C62828` (Badge de retorno atrasado)
- `statusWarning`: `#EF6C00` (Badge de tarefa sem data)
- `statusSuccess`: `#2E7D32` (Badge de concluído / WhatsApp)

### 4.3. Camada de Dados Híbrida (`ApiOrFallbackRepository`)
Para garantir que o aplicativo funcione tanto integrado ao `backend/` NestJS quanto isolado no celular do corretor/professor via Expo Go:
1. O app tenta comunicar-se com `API_BASE_URL` (configurável na própria barra de status/modal de conexão do app, padrão `http://localhost:3000/api` ou IP LAN detectado pelo Expo).
2. Caso a API esteja acessível, todas as operações (`login`, `clientes`, `imoveis`, `agendamentos`, `visao-geral`, `avisos`, `programar-retorno`, `concluir`, `sincronizar-google-calendar`) executam contra o backend NestJS e atualizam o cache local.
3. Caso o backend não esteja acessível na rede do celular (timeout rápido de `2500ms` ou modo Demo ativado), o `DomusDataService` opera de forma transparente sobre o **Repositório Local Persistente** inicializado com o **Seed da Persona Junior** (Corretor Junior, Cliente Carlos Eduardo Mendes, Apto Manaíra `JP-MAN-2026-01`, Visita agendada dentro da janela de 48h, Retorno atrasado e Atendimento sem data), aplicando localmente as mesmas invariantes `RN01`–`RN16` (incluindo conflito de horário `RN10`, obrigatoriedade de imóvel em visita `RN08`, geração de link do Google Calendar `RN16` e disparo/dispensa do aviso `"Você tem agendamentos proximo do dias marcados"` `RN13`–`RN15`).

---

## 5. Estrutura de Diretórios Planejada (`mobile/`)

```text
mobile/
├── app.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── App.tsx
└── src/
    ├── theme/
    │   └── tokens.ts                  # Paleta de cores, espaçamentos e tipografia DOMUS
    ├── types/
    │   └── domus.ts                   # Tipos e DTOs espelhados do backend (Cliente, Imovel, Agendamento, Aviso, VisaoGeral)
    ├── services/
    │   ├── seedData.ts                # Massa de dados inicial da Persona Junior (RN01-RN16)
    │   ├── storage.ts                 # Abstração AsyncStorage + fallback em memória
    │   └── domusApi.ts                # Cliente HTTP + motor híbrido offline/demo com regras RN01-RN16
    ├── context/
    │   └── DomusContext.tsx           # Estado global (usuário logado, modo API/Demo, clientes, imóveis, agendamentos, avisos)
    ├── components/
    │   ├── DomusHeader.tsx            # Topo âmbar com ícone de casa + logo DOMUS + indicador API/Demo e perfil
    │   ├── DomusNavBar.tsx            # Barra escura ("Agendar", "Imoveis", "Atendimentos", "Clientes")
    │   ├── AvisoBanner.tsx            # Banner azul-claro com sino ("Você tem agendamentos proximo do dias marcados") e botão "x"
    │   ├── DomusButton.tsx            # Botão laranja padrão do protótipo ("Cadastrar", "Agendar", "Visualizar")
    │   └── DomusInput.tsx             # Input cinza-claro arredondado fiel ao protótipo
    ├── screens/
    │   ├── LoginScreen.tsx            # Login + Cadastro rápido de usuário + botão "Entrar como Junior (Demo)"
    │   ├── ClientesScreen.tsx         # Tela 01 do protótipo: Cadastro de Cliente + vínculo de Imóvel de Interesse + lista rápida
    │   ├── ImoveisScreen.tsx          # Cadastro e listagem enxuta de Imóveis para vincular a clientes e visitas
    │   ├── AgendarScreen.tsx          # Tela 02 do protótipo: Criar Agendamento (Visita/Retorno/Atendimento) com validações RN08/RN10
    │   └── AtendimentosScreen.tsx     # Telas 03 e 04 do protótipo: Banner de Aviso + Seus Atendimentos + Checkbox + Modal Visualizar (Programar Retorno, Concluir, Google Calendar) e filtros Por Cliente / Por Imóvel / Sem Data
    └── __tests__/
        ├── domusApi.spec.ts           # Testes unitários das regras RN01-RN16 no serviço híbrido
        └── screens.spec.tsx           # Testes de fluxos e renderização das 4 telas do protótipo
```

---

## 6. Matriz de Rastreabilidade (Protótipo `.docx` x Regras `RN01`–`RN16`)

| Regra / Item do `.docx` | Descrição | Onde é atendida no Mobile |
| :--- | :--- | :--- |
| `RN01`–`RN03` | Cadastro de usuário, login JWT e perfis `CORRETOR` / `CADASTRADOR` | `LoginScreen.tsx` + `domusApi.ts` |
| `RN04`–`RN06` | Cadastro de cliente com CPF/CNPJ, telefone, e-mail, canal principal (`WHATSAPP` etc.) e imóveis de interesse | `ClientesScreen.tsx` ([01-cadastro-cliente.png](file:///d:/code/DOMUS/docs/prototipos/01-cadastro-cliente.png)) |
| `RN07` | Cadastro de imóveis para vinculação às visitas e interesses | `ImoveisScreen.tsx` |
| `RN08` | Visita exige imóvel vinculado e data/hora definida | `AgendarScreen.tsx` ([02-agendar-compromisso.png](file:///d:/code/DOMUS/docs/prototipos/02-agendar-compromisso.png)) + `domusApi.ts` |
| `RN09` | Programar retorno vinculado a atendimento/visita anterior | Modal `Visualizar` em `AtendimentosScreen.tsx` -> botão `Programar Retorno` |
| `RN10` | Bloqueio de conflito de horário na agenda do corretor | `domusApi.ts` + alerta em `AgendarScreen.tsx` |
| `RN11`–`RN12` | Visualização de atendimentos organizados por cliente, por imóvel e pendências sem data + conclusão | `AtendimentosScreen.tsx` ([03-visualizacao-atendimentos.png](file:///d:/code/DOMUS/docs/prototipos/03-visualizacao-atendimentos.png)) |
| `RN13`–`RN15` | Disparo e dispensa de avisos de compromissos próximos (`"Você tem agendamentos proximo do dias marcados"`), atrasados e sem data | `AvisoBanner.tsx` + `AtendimentosScreen.tsx` ([04-aviso-agendamentos-proximos.png](file:///d:/code/DOMUS/docs/prototipos/04-aviso-agendamentos-proximos.png)) |
| `RN16` | Sincronização opcional com Google Calendar (geração/abertura de link com lembretes) | Modal `Visualizar` em `AtendimentosScreen.tsx` + checkbox em `AgendarScreen.tsx` |
