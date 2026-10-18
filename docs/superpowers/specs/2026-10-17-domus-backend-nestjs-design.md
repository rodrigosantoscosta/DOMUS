# Especificação de Design e Validação de Regras de Negócio — DOMUS Backend (TypeScript / NestJS)

**Data:** 2026-10-17  
**Projeto:** DOMUS — Sistema de Apoio à Rotina Comercial do Corretor de Imóveis (UNIESP — Sistemas para Internet, 2026.2)  
**Equipe:** Alexander Augusto de Figueiredo Baxendale, Pedro Neto Amancio, Rodrigo Santos Costa  
**Docente:** Prof(a). Álekiss Manço de Mélo  
**Stack Alvo:** TypeScript, NestJS 11, Prisma ORM (SQLite em dev/test local + compatibilidade MySQL via `DATABASE_URL`), JWT (`@nestjs/jwt` + `passport-jwt`), `class-validator` / `class-transformer`, OpenAPI/Swagger (`@nestjs/swagger`), Jest + Supertest.

---

## 1. Intenção e Contexto do Projeto (O "Porquê")

A **DOMUS** evoluiu de uma proposta inicial centrada no registro burocrático de contratos de compra/venda, aluguel e cálculo de comissão (versão legada em `legacy/DOMUS/`) para uma solução digital voltada ao **problema real validado em estudo de caso único** (Persona **Junior**, corretor autônomo em João Pessoa/PB), documentado em `docs/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx` e `docs/entrevistas/entrevista-realizada.md`.

### Evidências Empíricas da Entrevista e Diagnóstico
1. **Dor prioritária validada:** Dificuldade em acompanhar **retornos prometidos aos clientes** e **próximas ações** após visitas ou atendimentos quando o volume de contatos via WhatsApp, telefone e redes sociais cresce.
2. **Citação-chave do estudo de caso:**
   - *"Eu não coloquei a data que deveria dar o retorno para o cliente na planilha, então ele me ligou chateado."*
   - *"Gosto de planilhas, pois sou acostumada a usar os programas, mas ela não é boa em me avisar do que devo fazer."*
3. **Recorte de Intervenção (Seções 3, 4 e 5 do `.docx`):**
   - Substituir o controle passivo em planilha por um fluxo ativo onde, a partir do atendimento ou visita, o corretor cadastra o cliente (com canal preferencial de contato e imóveis de interesse), agenda visitas ou programa retornos (associados ao cliente e, quando aplicável, ao imóvel), visualiza seus atendimentos/pendências organizados por cliente e por imóvel, e recebe **avisos claros de agendamentos próximos ou retornos pendentes/sem data**, com suporte opcional à exportação/sincronização para o Google Calendar.

---

## 2. Validação e Auditoria das Regras de Negócio do Projeto

Foram inspecionados todos os artefatos do repositório:
- `docs/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx` (e `.md` homônimo);
- `docs/entrevistas/entrevista-realizada.md` e `docs/modelos/domus-jornada-corretor.md`;
- `docs/modelos/MODELO PROPOSTA DE PROJETO - PDM E PE.md`;
- `legacy/DOMUS/Docs/Visão/sql/create database dbDomus.sql`, diagramas UML/DER e protótipos HTML/React.

### 2.1. Evolução de Escopo (Seção 5 do Diagnóstico `.docx`)

| Funcionalidade | Status no Diagnóstico (`.docx`) | Decisão Arquitetural no Backend |
| :--- | :--- | :--- |
| **Cadastro de usuários** | **Mantida / Nova** | Módulo `UsuariosModule` com perfis `CADASTRADOR` e `CORRETOR` |
| **Login e autenticação** | **Mantida / Nova** | Módulo `AuthModule` com JWT, login por `login` ou `email`, troca de senha |
| **Cadastro de imóveis** | **Mantida / Nova** | Módulo `ImoveisModule` para base de imóveis vinculados a proprietários, interesses e visitas |
| **Cadastro de clientes** | **Nova (Prioritária)** | Módulo `ClientesModule` com CPF/documento, telefone, e-mail, canal preferencial, observações e **imóveis de interesse** |
| **Cadastro de agendamento** | **Nova (Prioritária)** | Módulo `AgendamentosModule` suportando **Agendar Visita**, **Programar Retorno** e **Atendimento** |
| **Visualização de Atendimentos** | **Nova (Prioritária)** | Listagem, busca, conclusão de pendências e agrupamento/filtro por **cliente**, por **imóvel** e por **status/pendências** |
| **Disparar avisos de agendamentos próximos** | **Nova (Prioritária)** | Módulo `AvisosModule` que detecta e dispara alertas de compromissos próximos, do dia, atrasados ou retornos sem data |
| *Visualização de catálogo público de imóveis* | *Retirada do foco principal* | Mantida apenas a consulta operacional de imóveis necessária para vincular a clientes e visitas |
| *Consultar o estado da Venda* | *Retirada (Seção 5)* | **Fora do escopo do MVP** (descontinuada em favor do acompanhamento de retornos) |
| *Consultar o percentual de comissão* | *Retirada (Seção 5)* | **Fora do escopo do MVP** (descontinuada conforme validação com o corretor) |

### 2.2. Inconsistências e Lacunas Encontradas nos Artefatos e Como Foram Resolvidas

1. **Lacuna 1 — Campos de Usuário divergentes entre SQL legado e Protótipo:**
   - *Constatado:* `tb_usuario` em `dbDomus.sql` possuía apenas `nm_usuario`, `nm_email`, `nm_senha`. Porém, o protótipo da tela de Cadastro de Usuário (`image2.png` da Proposta e `UsuarioCadastrar.html`) exige `nome`, `login`, `cpf`, `email`, `senha` e `confirmarSenha`, e a tela de Login (`image1.png`) solicita `Username` e `Password`.
   - *Resolução (RN01/RN02):* A entidade `Usuario` no backend contempla `nome`, `login` (único), `cpf` (único, opcional para seed legado mas validado quando enviado), `email` (único), `senhaHash`, `ativo`, `ultimoLogin` e `perfis` (`CADASTRADOR`, `CORRETOR`). O endpoint de login aceita tanto `login` (`username`) quanto `email` no identificador de autenticação.
2. **Lacuna 2 — Campos de Cliente entre Protótipo Visual e Texto do Plano de Intervenção:**
   - *Constatado:* O protótipo de tela "Cadastro de Cliente" no `.docx` exibe `nome Completo`, `CPF`, `Telefone` e `E-mail`. Já as Seções 4.1, 4.2 e 4.3 do mesmo `.docx` especificam que o cadastro mínimo de clientes deve conter também **canal principal de contato** (ex.: WhatsApp, Telefone, Rede Social), **observações sobre perfil e interesses** e a capacidade de **associar um ou mais imóveis de interesse**.
   - *Resolução (RN04/RN05):* O modelo `Cliente` unifica ambos: `nomeCompleto`, `cpfDocumento` (CPF/CNPJ), `tipoDocumento` (`CPF` | `CNPJ`), `telefone`, `email`, `canalPrincipalContato` (`WHATSAPP` | `TELEFONE` | `REDE_SOCIAL` | `EMAIL` | `PRESENCIAL`, com default `WHATSAPP`), `observacoes` e relação N:N `imoveisInteresse` com `Imovel`.
3. **Lacuna 3 — Campos de Imóvel entre SQL legado e Protótipo de Cadastro de Imóvel:**
   - *Constatado:* O SQL legado (`imovel`) definia `nu_comodos`, `nu_banheiros`, `nu_area`, `vl_imovel`, `dt_cadastramento` e `tb_posicao_imovel` (Norte, Sul, Leste, Oeste, Nascente, Poente), mas omitia o endereço! Por outro lado, o protótipo de tela "Cadastrar Imóvel" exige `Nome do cliente` (proprietário), `Numero da inscrição`, `Tipo de imovel`, `Finalidade`, `Cep`, `Endereço`, `Bairro`, `Número` e `Área total do terreno`.
   - *Resolução (RN06/RN07):* A entidade `Imovel` consolida todos os campos do protótipo e do modelo de domínio (`numeroInscricao`, `tipoImovel`, `finalidade` [`VENDA` | `ALUGUEL` | `AMBOS`], `cep`, `endereco`, `bairro`, `numero`, `complemento`, `areaTotal`, `comodos`, `banheiros`, `valor`, `posicoes`, `statusImovel` [`DISPONIVEL` | `RESERVADO` | `VENDIDO` | `ALUGADO` | `INATIVO`] e vínculo opcional/obrigatório com `proprietarioId` / `corretorCaptadorId`).
4. **Lacuna 4 — Tipagem fraca e desconexão entre Visita, Atendimento e Agendamento no Legado:**
   - *Constatado:* No SQL legado, `visita_imovel.dt_visita` era `VARCHAR(45)` sem hora/duração estruturada, e não existia entidade para **Retorno** ou **Atendimento**. No `.docx` (Seções 3, 4.1, 4.3 e telas `image1.png` e `image3.png`), o corretor cria agendamentos com `Titulo`, `Descrição`, `Data`, `Hora`, `Duração`, `Observação`, podendo acionar **"Agendar visita"** ou **"Programar retorno"**, além de registrar a **próxima ação** após um atendimento (mesmo que inicialmente fique pendente de data, gerando alerta para não ser esquecida como ocorreu na planilha da Persona Junior).
   - *Resolução (RN08 a RN12):* A entidade `Agendamento` (que representa compromissos e atendimentos da rotina do corretor) possui `titulo`, `descricao`, `tipo` (`VISITA` | `RETORNO` | `ATENDIMENTO`), `status` (`PENDENTE` | `CONFIRMADO` | `CONCLUIDO` | `CANCELADO`), `dataHora` (`DateTime` ISO-8601 opcional apenas quando for registro de atendimento com pendência sem data definida, ou obrigatório ao agendar visita/compromisso com hora marcada), `duracaoMinutos` (default `60`), `observacao`, `canalContato`, `proximaAcao`, `dataRetorno`, `clienteId` (obrigatório), `imovelId` (obrigatório para `VISITA`, opcional para `RETORNO`/`ATENDIMENTO`), `corretorId` (usuário responsável) e suporte a Google Calendar (`sincronizarGoogleCalendar`, `googleCalendarEventId`).
5. **Lacuna 5 — Mecanismo de "Disparar avisos de agendamentos próximos" (`image4.png` do `.docx`):**
   - *Constatado:* A tela 4 do `.docx` mostra um banner de notificação no topo da tela de Atendimentos: *"🔔 Você tem agendamentos proximo do dias marcados"* com botão de fechar (`×`), e a Seção 5 lista explicitamente a funcionalidade *"Disparar avisos de agendamentos próximos"*, enquanto a Seção 2 destaca a dor: *"A ausência de um aviso eficaz para os retornos registrados ou para tarefas que ficaram sem data"*.
   - *Resolução (RN13 a RN15):* O módulo `AvisosModule` implementa tanto a verificação sob demanda (`GET /avisos/proximos`) quanto o disparo e persistência de alertas (`POST /avisos/disparar`), classificando os avisos em:
     1. `COMPROMISSO_PROXIMO`: agendamentos `PENDENTE` ou `CONFIRMADO` cuja `dataHora` está dentro da janela de antecedência configurável (padrão: próximas 48 horas, incluindo hoje/amanhã — *"próximo dos dias marcados"*);
     2. `RETORNO_ATRASADO`: agendamentos/retornos `PENDENTE` ou `CONFIRMADO` cuja `dataHora` ou `dataRetorno` já passou sem conclusão;
     3. `TAREFA_SEM_DATA`: atendimentos que possuem `proximaAcao` anotada, mas estão sem `dataHora`/`dataRetorno` programada (resolvendo diretamente o relato da entrevista: *"Eu não coloquei a data que deveria dar o retorno para o cliente na planilha, então ele me ligou chateado"*).

---

## 3. Catálogo Oficial de Regras de Negócio (RN01 a RN16)

| Código | Regra de Negócio | Origem | Validação / Comportamento no Backend |
| :--- | :--- | :--- | :--- |
| **RN01** | **Unicidade e Credenciais de Usuário:** Todo usuário possui `nome`, `login`, `email` e `senha` (armazenada exclusivamente com hash `bcrypt`). `login`, `email` e `cpf` (quando informado) não podem se repetir. | Legado `tb_usuario` + Protótipo Cadastro | Validação de conflito (`409 Conflict`) antes de criar/atualizar; confirmação de senha (`confirmarSenha === senha`) validada no DTO. |
| **RN02** | **Perfis de Acesso:** O sistema admite os perfis `CADASTRADOR` e `CORRETOR` (um usuário pode ter um ou ambos; padrão no auto-cadastro do aplicativo móvel é `CORRETOR`). | Legado `tb_perfil_acesso` + Caso de Uso | Guards `JwtAuthGuard` e `RolesGuard` protegem rotas autenticadas; senhas nunca são retornadas nas respostas JSON. |
| **RN03** | **Autenticação e Registro de Último Login:** O login pode ser feito informando `username` (`login` ou `email`) e `password` (`senha`), atualizando o timestamp `ultimoLogin` do usuário e retornando um JWT assinado. | Protótipo Login (`image1.png`) + `DomusHome` | Retorna `401 Unauthorized` para credenciais inválidas ou usuário inativo. Permite alteração de senha autenticada validando a senha atual. |
| **RN04** | **Cadastro Mínimo e Completo de Cliente:** O cliente deve ter `nomeCompleto`, `cpfDocumento` (CPF ou CNPJ único), `telefone` e `email` (opcional), além de `canalPrincipalContato` (`WHATSAPP`, `TELEFONE`, `REDE_SOCIAL`, `EMAIL`, `PRESENCIAL`) e `observacoes` sobre perfil/interesses. | `.docx` Seções 4.1, 4.2 e Tela 1 | Valida formato/unicidade de `cpfDocumento` (`409 Conflict` se duplicado) e preenche `WHATSAPP` como canal padrão caso omitido. |
| **RN05** | **Associação de Imóveis de Interesse ao Cliente:** Um cliente pode ser associado a um ou mais imóveis de interesse já cadastrados para orientar visitas e propostas. | `.docx` Seção 4.3 (Item 1) | Endpoints `POST /clientes/:id/imoveis-interesse` e suporte a `imoveisInteresseIds` na criação/atualização do cliente. Valida existência dos imóveis (`404 Not Found` se imóvel inexistente). |
| **RN06** | **Cadastro de Imóvel:** Todo imóvel registra dados de localização (`cep`, `endereco`, `bairro`, `numero`, `numeroInscricao`), características (`tipoImovel`, `finalidade` Venda/Aluguel/Ambos, `areaTotal`, `comodos`, `banheiros`, `posicoes` solares) e `valor`, podendo estar vinculado a um cliente proprietário. | Protótipo Imóvel (`image3.png`) + `dbDomus.sql` | Valida valores numéricos positivos (`valor >= 0`, `comodos >= 0`, `banheiros >= 0`, `areaTotal > 0` quando informada) e unicidade de `numeroInscricao` quando informado. |
| **RN07** | **Agendamento de Compromisso (Visita ou Retorno):** Todo agendamento exige `titulo`, `clienteId` existente e `tipo` (`VISITA`, `RETORNO` ou `ATENDIMENTO`). Aceita `descricao`, `data` + `hora` (ou `dataHora` ISO), `duracaoMinutos`, `observacao`, `canalContato`, `proximaAcao` e `imovelId`. | `.docx` Seção 4.1 e Tela 2 (`image3.png`) | Converte `data` (`YYYY-MM-DD` ou `DD/MM/YYYY`) + `hora` (`HH:mm`) ou `dataHora` ISO em `DateTime` padronizado. Se `canalContato` não for informado, herda o `canalPrincipalContato` do cliente. |
| **RN08** | **Obrigatoriedade de Imóvel em Agendamento de Visita:** Quando o tipo do agendamento for `VISITA` (*"Agendar uma visita a um imóvel já cadastrado, vinculando-o ao cliente"*), o campo `imovelId` e a `dataHora` são obrigatórios. | `.docx` Seção 4.3 (Item 2) | Retorna `400 Bad Request` caso um agendamento do tipo `VISITA` seja criado sem `imovelId` ou sem data/hora definida. |
| **RN09** | **Programação de Retorno a partir de Visita ou Atendimento:** A partir de uma visita ou atendimento existente (`POST /agendamentos/:id/programar-retorno`), o corretor pode programar um retorno vinculado automaticamente ao mesmo `clienteId` e `imovelId` do atendimento de origem. | `.docx` Seções 3, 4.1 e 4.3 (Item 3) | Cria novo agendamento do tipo `RETORNO` referenciando `agendamentoOrigemId`, mantendo a rastreabilidade do histórico comercial. |
| **RN10** | **Prevenção de Conflito de Horário na Agenda do Corretor:** O corretor não pode agendar duas visitas/compromissos ativos (`PENDENTE` ou `CONFIRMADO`) com sobreposição de intervalo `[dataHora, dataHora + duracaoMinutos)`. | `.docx` Seção 1 / Entrevista (2 visitas/turno) | Retorna `409 Conflict` indicando o compromisso conflitante caso haja colisão de horário para o mesmo corretor. |
| **RN11** | **Visualização de Atendimentos Organizados por Cliente e por Imóvel:** O corretor deve visualizar seus atendimentos/compromissos com título, descrição curta, status e dados de cliente/imóvel, podendo filtrar e agrupar por `clienteId`, por `imovelId`, por `tipo` e por `status`. | `.docx` Seções 4.3 (Item 4), 4.4, 5 e Tela 3 (`image1.png`) | `GET /agendamentos` e `GET /agendamentos/visao-geral` retornam a lista ordenada cronologicamente e visões agrupadas por cliente e por imóvel, além de resumo (`descricaoCurta` truncada em até 80 caracteres quando não fornecida). |
| **RN12** | **Conclusão de Atendimento e Controle de Pendências:** O corretor pode marcar um agendamento/atendimento como `CONCLUIDO` (checkbox da tela de Atendimentos) e registrar a `proximaAcao` e `dataRetorno`. | `.docx` Seção 3 e Tela 3 (`image1.png`) | `PATCH /agendamentos/:id/concluir` atualiza o status para `CONCLUIDO`; se o corretor informar `proximaAcao` e `dataRetorno`, permite criar automaticamente o retorno subsequente. |
| **RN13** | **Disparo de Avisos de Agendamentos Próximos:** O sistema identifica e dispara avisos para agendamentos ativos (`PENDENTE`/`CONFIRMADO`) dentro da janela de proximidade (padrão: próximas 48 horas), exibindo a mensagem padrão do protótipo (*"Você tem agendamentos próximo do dias marcados"*). | `.docx` Seção 5 e Tela 4 (`image4.png`) | `GET /avisos/proximos` e `POST /avisos/disparar` retornam o banner resumo + lista detalhada de compromissos próximos, evitando duplicação de avisos para o mesmo agendamento/tipo. |
| **RN14** | **Alerta de Retornos Atrasados e Tarefas sem Data:** Além dos compromissos próximos, o motor de avisos sinaliza retornos vencidos (`dataHora < agora` e ainda `PENDENTE`/`CONFIRMADO`) e registros com `proximaAcao` preenchida mas sem data de retorno definida. | `.docx` Seções 1 e 2 (Persona Junior) | Ataca diretamente a falha das planilhas relatada na entrevista (*"ausência de um aviso eficaz para os retornos registrados ou para tarefas que ficaram sem data"*). |
| **RN15** | **Dispensa / Leitura de Avisos:** O corretor pode fechar/dispensar um aviso exibido no topo da tela (botão `×` do protótipo `image4.png`). | `.docx` Tela 4 (`image4.png`) | `PATCH /avisos/:id/dispensar` marca o aviso como `LIDO`/`DISPENSADO` com timestamp de leitura. |
| **RN16** | **Sincronização Opcional com Google Calendar:** Quando autorizado pelo corretor (`sincronizarGoogleCalendar: true`), o backend gera a estrutura de evento compatível com a API do Google Calendar (e link direto `calendar.google.com/calendar/render`), mantendo a DOMUS como fonte principal do contexto comercial. | `.docx` Seções 4.1, 4.2 e 4.4 | `POST /agendamentos/:id/sincronizar-google-calendar` retorna o payload padronizado RFC5545/Google Calendar Event (`summary`, `description` com cliente/canal/imóvel/próxima ação, `start`, `end`, `reminders`) e registra o vínculo no agendamento. |

---

## 4. Objetivos, Não-Objetivos (Non-Goals) e Anti-Objetivos

### Objetivos
- Fornecer uma API RESTful completa em **TypeScript / NestJS** em `backend/` que implemente 100% das regras `RN01` a `RN16`.
- Utilizar **Prisma ORM** com banco **SQLite** local zero-config para desenvolvimento e testes automatizados determinísticos, mantendo compatibilidade direta com MySQL.
- Garantir cobertura completa por testes unitários (`Jest`) e testes de ponta a ponta (`Supertest` E2E) para todas as regras de negócio.
- Documentar todos os endpoints via **Swagger / OpenAPI** (`/api/docs`).

### Não-Objetivos (Non-Goals)
- Implementar módulos descontinuados na Seção 5 do `.docx` (cálculo de percentual de comissão de vendas/aluguéis, fluxo de parcelas de contrato de compra e venda).
- Reescrever o frontend legado React em `legacy/DOMUS/js/front/DomusFrontEnd/` (o escopo solicitado é validar as regras de negócio e desenvolver o backend em TypeScript/NestJS).

### Anti-Objetivos
- Não depender de banco de dados externo inacessível para rodar `npm test` ou `npm run test:e2e`.
- Não expor hashes de senha, segredos ou stack traces internos nas respostas HTTP (conformidade OWASP Top 10:2025).

---

## 5. Modelo de Dados (Prisma Schema)

O arquivo `backend/prisma/schema.prisma` conterá os seguintes modelos:

```prisma
model Usuario {
  id           Int           @id @default(autoincrement())
  nome         String
  login        String        @unique
  cpf          String?       @unique
  email        String        @unique
  senhaHash    String
  perfis       String        @default("CORRETOR") // CSV/JSON: "CORRETOR", "CADASTRADOR"
  ativo        Boolean       @default(true)
  ultimoLogin  DateTime?
  criadoEm     DateTime      @default(now())
  atualizadoEm DateTime      @updatedAt

  imoveisCaptados Imovel[]      @relation("CorretorCaptador")
  agendamentos    Agendamento[] @relation("CorretorAgendamento")
  avisos          Aviso[]
}

model Cliente {
  id                    Int           @id @default(autoincrement())
  nomeCompleto          String
  cpfDocumento          String        @unique
  tipoDocumento         String        @default("CPF") // CPF | CNPJ
  telefone              String
  celular               String?
  email                 String?
  canalPrincipalContato String        @default("WHATSAPP") // WHATSAPP | TELEFONE | REDE_SOCIAL | EMAIL | PRESENCIAL
  observacoes           String?
  criadoEm              DateTime      @default(now())
  atualizadoEm          DateTime      @updatedAt

  imoveisProprios  Imovel[]      @relation("ProprietarioImovel")
  imoveisInteresse Imovel[]      @relation("InteresseClienteImovel")
  agendamentos     Agendamento[]
}

model Imovel {
  id                 Int           @id @default(autoincrement())
  numeroInscricao    String?       @unique
  tipoImovel         String        @default("APARTAMENTO") // CASA | APARTAMENTO | TERRENO | COMERCIAL
  finalidade         String        @default("VENDA") // VENDA | ALUGUEL | AMBOS
  cep                String?
  endereco           String
  bairro             String?
  numero             String?
  complemento        String?
  areaTotal          Float?
  comodos            Int           @default(1)
  banheiros          Int           @default(1)
  valor              Float         @default(0)
  posicoes           String?       // Ex: "NASCENTE,NORTE"
  statusImovel       String        @default("DISPONIVEL") // DISPONIVEL | RESERVADO | VENDIDO | ALUGADO | INATIVO
  proprietarioId     Int?
  corretorCaptadorId Int?
  criadoEm           DateTime      @default(now())
  atualizadoEm       DateTime      @updatedAt

  proprietario        Cliente?      @relation("ProprietarioImovel", fields: [proprietarioId], references: [id], onDelete: SetNull)
  corretorCaptador    Usuario?      @relation("CorretorCaptador", fields: [corretorCaptadorId], references: [id], onDelete: SetNull)
  clientesInteressados Cliente[]    @relation("InteresseClienteImovel")
  agendamentos        Agendamento[]
}

model Agendamento {
  id                        Int           @id @default(autoincrement())
  titulo                    String
  descricao                 String?
  descricaoCurta            String?
  tipo                      String        @default("ATENDIMENTO") // VISITA | RETORNO | ATENDIMENTO
  status                    String        @default("PENDENTE") // PENDENTE | CONFIRMADO | CONCLUIDO | CANCELADO
  dataHora                  DateTime?
  duracaoMinutos            Int           @default(60)
  observacao                String?
  canalContato              String?       // WHATSAPP | TELEFONE | REDE_SOCIAL | EMAIL | PRESENCIAL
  proximaAcao               String?
  dataRetorno               DateTime?
  sincronizarGoogleCalendar Boolean       @default(false)
  googleCalendarEventId     String?
  googleCalendarUrl         String?
  clienteId                 Int
  imovelId                  Int?
  corretorId                Int?
  agendamentoOrigemId       Int?
  criadoEm                  DateTime      @default(now())
  atualizadoEm              DateTime      @updatedAt

  cliente            Cliente       @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  imovel             Imovel?       @relation(fields: [imovelId], references: [id], onDelete: SetNull)
  corretor           Usuario?      @relation("CorretorAgendamento", fields: [corretorId], references: [id], onDelete: SetNull)
  agendamentoOrigem  Agendamento?  @relation("HistoricoRetorno", fields: [agendamentoOrigemId], references: [id], onDelete: SetNull)
  retornosDerivados  Agendamento[] @relation("HistoricoRetorno")
  avisos             Aviso[]
}

model Aviso {
  id            Int         @id @default(autoincrement())
  tipoAviso     String      // COMPROMISSO_PROXIMO | RETORNO_ATRASADO | TAREFA_SEM_DATA
  titulo        String
  mensagem      String
  status        String      @default("PENDENTE") // PENDENTE | DISPENSADO
  agendamentoId Int
  usuarioId     Int?
  disparadoEm   DateTime    @default(now())
  dispensadoEm  DateTime?

  agendamento   Agendamento @relation(fields: [agendamentoId], references: [id], onDelete: Cascade)
  usuario       Usuario?    @relation(fields: [usuarioId], references: [id], onDelete: SetNull)

  @@unique([agendamentoId, tipoAviso])
}
```

---

## 6. Contratos de Endpoints da API REST (`/api`)

### 6.1. Autenticação (`/api/auth`) e Usuários (`/api/usuarios`)
- `POST /api/usuarios`: Cadastra novo usuário (`nome`, `login`, `cpf?`, `email`, `senha`, `confirmarSenha`, `perfis?`).
- `GET /api/usuarios`: Lista usuários cadastrados (sem `senhaHash`).
- `GET /api/usuarios/:id`: Obtém detalhes de um usuário.
- `POST /api/auth/login`: Autentica por `username` (`login` ou `email`) e `password` (`senha`), atualiza `ultimoLogin` e retorna `{ accessToken, usuario }`.
- `PATCH /api/auth/alterar-senha`: Altera a senha do usuário autenticado (`senhaAtual`, `novaSenha`, `confirmarNovaSenha`).
- `GET /api/auth/me`: Retorna os dados do usuário autenticado.

### 6.2. Clientes (`/api/clientes`)
- `POST /api/clientes`: Cadastra cliente (`nomeCompleto`, `cpfDocumento`, `tipoDocumento?`, `telefone`, `celular?`, `email?`, `canalPrincipalContato?`, `observacoes?`, `imoveisInteresseIds?`).
- `GET /api/clientes`: Lista clientes com filtro por `busca` (nome/CPF/telefone) ou `canalPrincipalContato`, incluindo `imoveisInteresse` e contagem de agendamentos pendentes.
- `GET /api/clientes/:id`: Detalha o cliente com seus imóveis de interesse, imóveis próprios e histórico de atendimentos/compromissos.
- `PATCH /api/clientes/:id`: Atualiza dados do cliente.
- `DELETE /api/clientes/:id`: Remove cliente.
- `POST /api/clientes/:id/imoveis-interesse`: Vincula um ou mais imóveis de interesse ao cliente (`{ imovelIds: number[] }`).
- `DELETE /api/clientes/:id/imoveis-interesse/:imovelId`: Desvincula imóvel de interesse.

### 6.3. Imóveis (`/api/imoveis`)
- `POST /api/imoveis`: Cadastra imóvel (`numeroInscricao?`, `tipoImovel?`, `finalidade?`, `cep?`, `endereco`, `bairro?`, `numero?`, `complemento?`, `areaTotal?`, `comodos?`, `banheiros?`, `valor?`, `posicoes?`, `proprietarioId?`, `corretorCaptadorId?`).
- `GET /api/imoveis`: Lista imóveis com filtros opcionais (`finalidade`, `tipoImovel`, `bairro`, `statusImovel`, `proprietarioId`).
- `GET /api/imoveis/:id`: Detalha imóvel com proprietário, clientes interessados e visitas/agendamentos associados.
- `PATCH /api/imoveis/:id`: Atualiza imóvel.
- `DELETE /api/imoveis/:id`: Remove imóvel.

### 6.4. Agendamentos e Visualização de Atendimentos (`/api/agendamentos`)
- `POST /api/agendamentos`: Cria agendamento/atendimento (`titulo`, `descricao?`, `tipo` [`VISITA` | `RETORNO` | `ATENDIMENTO`], `data?`, `hora?`, `dataHora?`, `duracaoMinutos?`, `observacao?`, `canalContato?`, `proximaAcao?`, `dataRetorno?`, `sincronizarGoogleCalendar?`, `clienteId`, `imovelId?`, `corretorId?`).
- `GET /api/agendamentos`: Lista atendimentos/agendamentos com filtros (`clienteId`, `imovelId`, `corretorId`, `tipo`, `status`, `apenasPendentes`, `semDataRetorno`).
- `GET /api/agendamentos/visao-geral`: Retorna os próximos compromissos da página inicial organizados **por cliente** e **por imóvel** (atendendo literalmente à Seção 4.3, item 4 do `.docx`), além das listas de retornos pendentes e tarefas sem data.
- `GET /api/agendamentos/:id`: Visualiza detalhes completos de um agendamento/atendimento (botão *"Visualizar"* da Tela 3 do `.docx`).
- `PATCH /api/agendamentos/:id`: Atualiza dados do agendamento.
- `PATCH /api/agendamentos/:id/concluir`: Marca o atendimento como `CONCLUIDO` (checkbox da Tela 3) e opcionalmente registra `proximaAcao` / `dataRetorno` gerando retorno programado.
- `POST /api/agendamentos/:id/programar-retorno`: Programa um novo retorno (`RETORNO`) derivado de uma visita ou atendimento existente.
- `POST /api/agendamentos/:id/sincronizar-google-calendar`: Gera e vincula os dados de evento do Google Calendar para lembretes externos.
- `DELETE /api/agendamentos/:id`: Cancela/remove agendamento.

### 6.5. Avisos de Agendamentos Próximos (`/api/avisos`)
- `GET /api/avisos/proximos`: Avalia em tempo real os compromissos próximos (janela configurável via query `?horasAntecedencia=48`), retornos atrasados e tarefas sem data, retornando `{ possuiAvisos, mensagemBanner: "Você tem agendamentos proximo do dias marcados", totalProximos, totalAtrasados, totalSemData, avisos }`.
- `POST /api/avisos/disparar`: Executa o disparo/persistência de avisos na tabela `Aviso` para os compromissos próximos, atrasados e tarefas sem data ainda não dispensados.
- `GET /api/avisos`: Lista os avisos persistidos (filtráveis por `status` e `usuarioId`).
- `PATCH /api/avisos/:id/dispensar`: Dispensa/fecha um aviso (botão `×` do banner na Tela 4 do `.docx`).
