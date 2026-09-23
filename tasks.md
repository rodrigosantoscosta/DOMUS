# DOMUS — Tarefas (documento de diagnóstico)

Checklist do que falta para fechar o Documento de Diagnóstico da Problemática e Plano de
Intervenção, a partir do trabalho de coleta de dados (persona: corretor de imóveis).

## 1. Entrevista principal (persona)

- [ ] Aplicar a reestruturação sugerida em `docs/modelos/entrevistas/domus-entrevista.md`
      (adicionar Bloco 0 de perfil + perguntas fechadas/escala acopladas às abertas em cada bloco)
- [ ] Reaplicar a entrevista com o corretor-persona usando a versão reestruturada
- [ ] Registrar as respostas (documento ou planilha) para servir de baseline numérica

## 2. Triangulação com outros corretores

- [ ] Montar o formulário (`docs/modelos/entrevistas/domus-formulario-corretores.md`) no Google
      Forms (ou similar)
- [ ] Enviar para 5-10 contatos corretores (rede do parente / colegas de imobiliária / grupos)
- [ ] Coletar respostas e calcular médias/porcentagens por pergunta
- [ ] Comparar resultado com o que a persona relatou na entrevista principal

## 3. Mapa de jornada

- [ ] Preencher a tabela de etapas em `docs/modelos/domus-jornada-corretor.md` com o que a
      entrevista/formulário trouxerem (ação, ferramenta usada, ponto de dor, dado de apoio)
- [ ] Ajustar o diagrama Mermaid conforme os pontos de risco confirmados
- [ ] Gerar versão em imagem do diagrama (print/Figma) para anexar

## 4. Evidências complementares

- [ ] Coletar print/exemplo (anonimizado) da planilha ou caderno que o corretor usa hoje
- [ ] Levantamento rápido de concorrentes/CRMs imobiliários existentes (o que cobrem / o que
      deixam a desejar para o perfil autônomo/pequeno)
- [ ] Pesquisa breve de dados secundários do setor (CRECI, associações, matérias sobre
      digitalização de corretores) para reforçar que o problema não é isolado

## 5. Validação com o protótipo legado (insumo para Seção 4.3)

- [ ] Mostrar as telas de `legacy/DOMUS/prototipo/` para o corretor-persona
- [ ] Definir quem mais vai testar (ex.: outros corretores do formulário) e como o feedback será
      coletado (roteiro de observação, formulário pós-teste, etc.)
- [ ] Registrar o que fez sentido, o que faltou, o que não ficou claro
- [ ] Ajustar escopo da solução com base no retorno

## 6. Indicadores de impacto (Seção 4.4)

- [ ] Definir a lista final de indicadores de baseline a partir dos números coletados, por exemplo:
  - Horas/semana gastas verificando situação dos imóveis
  - % de clientes que desistem antes de fechar
  - Nº de comissões mal registradas/atrasadas em 3 meses
  - Nº de vendas perdidas por demora no envio de informação (6 meses)
- [ ] Registrar os valores atuais (baseline) para comparação futura pós-solução

## 7. Ajustes na proposta inicial (Seção 5)

- [ ] Localizar/recuperar o documento da 1ª entrega (proposta inicial) — não está neste
      repositório, só o template em `docs/modelos/MODELO PROPOSTA DE PROJETO - PDM E PE.docx.md`
- [ ] Comparar ponto a ponto com o que foi aprendido na coleta: o que mudou na ideia inicial
- [ ] Listar funcionalidades adicionadas ou removidas
- [ ] Registrar mudanças no público-alvo (se houve, ex.: foco em corretor autônomo vs. imobiliária)
- [ ] Justificar cada mudança com base nos dados coletados (entrevista/formulário/jornada)

## 8. Redação do documento de diagnóstico

- [ ] Seção 1 — Diagnóstico detalhado (usar dados da entrevista + jornada + formulário)
- [ ] Seção 2 — Análise do público-alvo/persona (usar Bloco 0 da entrevista + dados de
      triangulação; incluir dores, necessidades, comportamentos, não só perfil demográfico)
- [ ] Seção 3 — Justificativa da solução (usar levantamento de concorrentes)
- [ ] Seção 4.1 — Aplicação da solução (onde será aplicada, quem vai usar, como será usada)
- [ ] Seção 4.2 — Estratégia de implementação (etapas, recursos tecnológicos/humanos necessários)
- [ ] Seção 4.3 — Validação com o público (usar o item 5 acima: como testado, quem testou, como
      o feedback foi coletado)
- [ ] Seção 4.4 — Medição de impacto (usar os indicadores do item 6 acima)
- [ ] Seção 5 — Ajustes na proposta inicial (usar item 7 acima)
- [ ] Seção 6 (opcional) — Anexos: prints de entrevista, link/prints do formulário, diagrama de
      jornada, fotos de visita ao imóvel/acompanhamento, conversas registradas com o corretor
- [ ] Revisão final comparando com `docs/modelos/MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE
      INTERVENÇÃO - PDM E PE.md` item a item, conferindo que nenhuma resposta ficou genérica
