# DOMUS — Plano de tarefas

## Contexto

A DOMUS é uma proposta de solução digital para apoiar a organização da rotina de um corretor de imóveis. O projeto será fundamentado, nesta etapa, em um **estudo de caso único** com um familiar que atua como corretor.

O objetivo imediato é levantar evidências suficientes para preencher o documento de **Diagnóstico da Problemática e Plano de Intervenção (PDM e PE)** e definir um recorte viável para um MVP.

> **Delimitação:** os achados representam o contexto do participante investigado. Não devem ser apresentados como uma generalização para todos os corretores de imóveis.

---

## Status atual

| Item | Status | Evidência / arquivo |
|---|---|---|
| Organização inicial do repositório | Concluído | Estrutura `docs/`, `docs/entrevistas/` e `docs/modelos/` |
| Modelo institucional do PDM e PE | Concluído | `docs/modelos/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO - PDM E PE.md` |
| Roteiro geral de entrevista | Concluído | `docs/entrevistas/domus-entrevista.md` |
| Formulário inicial para corretores | Concluído | `docs/entrevistas/domus-formulario-corretores.md` |
| Jornada preliminar do corretor | Concluído | `docs/modelos/domus-jornada-corretor.md` |
| Definição do método | Concluído | Estudo de caso único: entrevista + observação de uma tarefa |
| Coleta com o participante | Pendente | Realizar antes da entrega |
| Diagnóstico consolidado | Pendente | Preencher modelo PDM e PE após a entrevista |
| Priorização do MVP | Pendente | Selecionar 1 problema principal |

---

## Objetivo da entrega

Entregar um diagnóstico qualitativo, baseado em um participante, que identifique uma dificuldade real na rotina de um corretor de imóveis e proponha uma intervenção inicial por meio da DOMUS.

### Pergunta norteadora

> Como uma solução digital pode auxiliar o corretor participante do estudo de caso a organizar sua rotina comercial, reduzindo uma dificuldade prioritária relacionada a clientes, imóveis, retornos ou visitas?

---

## Plano de execução — entrega em um dia

### 1. Preparar a coleta

- [x] Definir um pseudônimo para o participante.
- [x] Informar que a participação é voluntária e que dados pessoais, dados de clientes, telefones, endereços e valores serão preservados.
- [ ] Escolher uma tarefa da rotina para observar: responder cliente, localizar imóvel, agendar visita ou conferir retornos.
- [x] Preparar anotações ou gravação, caso o participante autorize.

**Saída esperada:** identificação anonimizada do caso e instrumento de registro preparado.

### 2. Realizar entrevista semiestruturada

- [x] Realizar conversa de aproximadamente 35 a 45 minutos.
- [ ] Mapear um dia típico de trabalho.
- [x] Identificar canais e ferramentas utilizados.
- [x] Pedir exemplos recentes de atrasos, retrabalho, dificuldade para localizar informação ou esquecimento de retorno.
- [x] Identificar o problema que mais prejudica a rotina.
- [x] Perguntar quais funções seriam mais úteis em uma ferramenta nova.

**Perguntas mínimas:**

1. Como é um dia normal de trabalho?
2. Como clientes chegam até você e onde essas informações são registradas?
3. Quais ferramentas você usa para clientes, imóveis, visitas e negociações?
4. Conte uma situação recente em que demorou para encontrar uma informação.
5. Como você controla retornos? Já esqueceu ou atrasou algum?
6. Como agenda e confirma visitas?
7. Qual etapa gera mais tempo perdido ou retrabalho?
8. Se uma ferramenta resolvesse apenas uma coisa, o que ela faria?
9. Quais três funções seriam mais úteis?

**Saída esperada:** anotações, pelo menos uma citação curta anonimizada e uma lista inicial de problemas.

### 3. Observar uma tarefa real

- [ ] Solicitar que o participante execute uma tarefa real ou simulada.
- [ ] Registrar ferramentas abertas, etapas realizadas e informações procuradas.
- [ ] Registrar dificuldades, contornos e duração aproximada.
- [ ] Não registrar dados identificáveis de clientes ou imóveis.

**Saída esperada:** evidência observável que complemente a entrevista.

### 4. Consolidar o diagnóstico

- [ ] Listar de 3 a 4 problemas identificados.
- [ ] Registrar para cada problema: evidência, frequência percebida, impacto e possível solução.
- [ ] Selecionar um problema prioritário.
- [ ] Registrar uma justificativa baseada em frequência, impacto e viabilidade de implementação.

#### Matriz de priorização

Atribuir notas de 1 a 5 para cada critério.

| Problema | Frequência | Impacto | Viabilidade no MVP | Total | Decisão |
|---|---:|---:|---:|---:|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

**Saída esperada:** um problema priorizado para orientar a intervenção.

### 5. Preencher o PDM e PE

- [ ] Caracterizar o participante usando pseudônimo, tipo de atuação, região ampla e ferramentas utilizadas.
- [ ] Descrever a problemática com base na entrevista e observação.
- [ ] Inserir uma citação curta anonimizada como evidência.
- [ ] Formular a pergunta de pesquisa e o objetivo geral.
- [ ] Descrever a metodologia como pesquisa qualitativa exploratória de estudo de caso único.
- [ ] Apresentar os problemas identificados e justificar a prioridade escolhida.
- [ ] Definir o plano de intervenção e as limitações do estudo.

**Texto-base da metodologia:**

> Foi realizada uma pesquisa qualitativa exploratória, estruturada como estudo de caso único. A coleta de dados ocorreu por meio de entrevista semiestruturada e observação de uma tarefa da rotina profissional do participante. Os registros foram analisados conforme frequência percebida, impacto no trabalho e viabilidade de resolução por meio de uma solução digital. Como o participante possui vínculo familiar com o pesquisador, foram adotados pseudônimo e anonimização de dados de terceiros.

**Texto-base da limitação:**

> O estudo envolveu apenas um participante, selecionado por acessibilidade, e não permite generalização estatística para todos os corretores de imóveis. Os achados representam o contexto investigado e orientam a construção inicial de um MVP, que poderá ser validado posteriormente com outros profissionais.

**Saída esperada:** documento de Diagnóstico da Problemática e Plano de Intervenção preenchido.

### 6. Definir a intervenção e o MVP

- [ ] Transformar o problema priorizado em um fluxo de usuário simples.
- [ ] Definir de 2 a 4 funções essenciais.
- [ ] Criar um protótipo ou descrever as telas e regras do MVP.
- [ ] Definir como o participante testará a proposta.

#### Sugestões de recorte

| Problema validado | Recorte do MVP | Funções essenciais |
|---|---|---|
| Retornos esquecidos | Controle de clientes e pendências | Cadastro de cliente, próxima ação, data de retorno e lista de pendências |
| Informações de clientes dispersas | Histórico centralizado de atendimento | Cliente, necessidade, histórico e busca |
| Visitas desorganizadas | Agenda de visitas | Cliente, imóvel, data/hora, status e confirmação |
| Dificuldade para localizar imóveis | Catálogo básico de imóveis | Cadastro, características e filtros |

---

## Critérios de qualidade

- [ ] Toda afirmação sobre a rotina é sustentada por relato ou observação do participante.
- [x] Não há dados pessoais, contatos, endereços completos, valores ou informações confidenciais no repositório.
- [ ] A intervenção responde diretamente ao problema priorizado.
- [ ] O MVP possui escopo pequeno e demonstrável.
- [ ] O documento declara o estudo de caso único e sua limitação de generalização.

---

## Próxima etapa após a entrega

- [ ] Validar o protótipo/MVP com o participante usando tarefas reais.
- [ ] Registrar dificuldades, sugestões e percepção de utilidade.
- [ ] Revisar o fluxo e as funções priorizadas.
- [ ] Se houver disponibilidade, ampliar a validação com outros corretores para comparar perfis e testar a generalização dos achados.
