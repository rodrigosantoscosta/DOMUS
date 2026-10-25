# SECURITY.md — Dossie de Segurança do DOMUS

## Contexto

Projeto de estudo pessoal (extensionista UNIESP, 2026.2). Backend NestJS 11 + Prisma 6 + SQLite consumido por app mobile Expo. **Nao ha producao nem dados reais de usuarios.** Este documento registra a auditoria de segurança executada em 2026-10-25, as correcoes aplicadas e o que permanece pendente (lista de estudos).

Auditoria em modo de revisao focada: evidencia estatica (leitura dos fontes), `npm audit --package-lock-only`, e `git ls-files`. Nenhum codigo do alvo foi executado fora de testes automatizados.

---

## Correcoes aplicadas (CONFIRMED resolvidas)

| ID | Achado | Correcao | Commit |
|----|--------|----------|--------|
| C1 | Escalacao vertical: `CORRETOR` podia se auto-elevar a `CADASTRADOR` via `PATCH /api/usuarios/:id`, ou alterar contas de terceiros. `backend/src/usuarios/usuarios.controller.ts:45` (antes) + `usuarios.service.ts:192` | `@Roles('CADASTRADOR')` no PATCH. Nota de comportamento: CORRETOR comum perde autoedicao de perfil basico (trade-off aceito) | `8914b38` |
| C2 | Auto-cadastro publico aceitava `perfis: ['CADASTRADOR']` (`usuarios.controller.ts:24` + `create-usuario.dto.ts:52-59`) | `ForbiddenException` no `UsuariosService.create` se CADASTRADOR solicitado; emissao do perfil privilegiado ocorre apenas via seed Prisma (`prisma/seed.ts`). Ajuste do spec RN03 (`auth.service.spec.ts`) provisiona via Prisma — escopo do teste e autenticacao, nao cadastro | `504d4cb` |
| C11 | `npm audit`: 9 vulnerabilidades (6 high, 3 moderate). As 4 residuais travadas em deps exatas dos pais (`multer@2.4.0` fixado por `@nestjs/platform-express`, `js-yaml@5.3.0` fixado por `@nestjs/swagger`) | `npm audit fix` (5 primeiras) + bloco `overrides` no `backend/package.json` (`multer@2.5.0`, `js-yaml@^5.4.1`). Estado final: **0 vulnerabilidades** | `653cd70` |

Validacao executada apos as correcoes (todas verdes):

- `backend/`: `npm test` (12/12), `npm run test:e2e` (1/1), `npm run lint` (zero avisos), `npm run build`, `npm audit` (0 vulnerabilidades).
- `mobile/` (nao modificado, validado por seguranca): `npm test` (36/36, 4 suites), `npm run typecheck` (zero erros).

---

## Aceito no contexto (sem acao necessaria sem producao)

| ID | Achado | Arquivo/linha | Nota |
|----|--------|---------------|------|
| C3 | Segredo JWT versionado no `docker-compose.yml:14` + fallback dev em `guards/jwt-auth.guard.ts:21` | `docker-compose.yml`, `jwt-auth.guard.ts` | Fail-closed em producao ja implementado (jet-auth.guard.ts:17-19). Se o repositorio tornar-se publico, **regenerar o segredo antes** (o valor permanece no historico do git) |
| C7 | CORS `origin: true` + `credentials: true`; Swagger publico em `/api/docs` | `backend/src/main.ts:9-10,32-33` | Bearer no header: CSRF nao exploitavel hoje. Higienizar antes de qualquer uso publico |
| C8 | Sem rate limiting (brute force em `/api/auth/login`) | `backend/src/main.ts`, `package.json` | `@nestjs/throttler` ausente |
| C9 | Sem Helmet / security headers | `backend/src/main.ts` | 1 linha (`app.use(helmet())`), habito para producao |
| C10 | Enumeracao de usuarios via timing (bcrypt so roda se usuario existe) e 409 especificos | `auth.service.ts:39-49`, `usuarios.service.ts:75-95` | Fix didatico: hash dummy + mensagem generica |
| C4 | HTTP claro no mobile + credenciais hardcoded (`Domus@2026`) + auto-login silencioso | `mobile/src/services/domusApi.ts:115-136,143-149,231` | O mobile escolhe `http://<ip>:3000` |
| C5 | Token JWT em AsyncStorage nao criptografado | `domusApi.ts:28`, `storage.ts` | Fix: `expo-secure-store` |

---

## Pendente 

1. **Autorizacao fina alem do guard de rota (RESOLVIDO no codigo, estudar o conceito)** — RBAC por campo, self-service vs admin-only. C1/C2 foram os achados mais graves; ler `usuarios.controller.ts` e identificar o padrao.
2. **Ciclo de vida de tokens JWT (C6 — NAO corrigido)** — troca de senha nao invalida tokens existentes (`auth.service.ts:70-105`). Estudar `tokenVersion`/`jti` no payload, validacao no `JwtAuthGuard`, refresh token. Severidade real: MEDIUM (token vazado sobrevive 8h) — irrelevante sem producao, topico didatico alto.
3. **Seguranca do cliente mobile (C4/C5 — NAO corrigido)** — nada de credencial no bundle, `expo-secure-store` vs AsyncStorage, TLS obrigatorio. Testar com Wireshark em rede propria.
4. **Gestao de segredos (C3 — aceito)** — `.env` + `.env.example` + fail-closed; por que segredo versionado nunca volta a ser secreto (regenerar > reescrever historico).
5. **Rate limiting e enumeracao (C8/C10 — NAO corrigido)** — `@nestjs/throttler`, hash dummy para usuario inexistente, backoff.
6. **CORS, Helmet e superficie da API (C7/C9 — NAO corrigido)** — por que `origin: true + credentials: true` quebra CORS; quando Swagger fica publico.
7. **Cadeia de dependencias (C11 — RESOLVIDO, manter)** — `npm audit` no CI; risco de transitive deps; `overrides` quando o pai fixa a versao exata.
8. **Multi-tenancy (evolucao futura)** — endpoints por agencia transformariam a visao compartilhada atual em IDOR real. Anotado como arquitetura, nao exploit hoje.

---

## Hipoteses descartadas (REJECTED)

- **Injecao SQL** — REJEITADA: Prisma parameteriza; zero `$queryRaw` no projeto; `ValidationPipe (whitelist + forbidNonWhitelisted)` ativo em `main.ts:15-25`.
- **IDOR intra-agencia** — REJEITADO como exploit: modelo de dados zero-tenancy compartilhada entre corretores da mesma imobiliaria. Reavaliar ao introduzir multi-agencia.
- **RCE via multer** — REJEITADA como exploit atual: nenhum endpoint de upload; correcao feita mesmo assim via overrides.
- **Hash/senha vazando em respostas** — REJEITADA: `sanitizarUsuario` exclui `senhaHash` de todas as respostas.
- **`backend/.env` versionado** — REJEITADA: `git ls-files` confirma apenas `.env.example` no repositorio.

## Itens NEEDS_VALIDATION (com blocker executivo fora da fonte)

- **N1** — `dev.db` na imagem Docker (`Dockerfile` copia `prisma/` inteiro; volume `./backend/prisma:/app/prisma`). Validar com `docker run --rm domus-backend ls /app/prisma` em ambiente isolado; conferir se o `.dockerignore` exclui `prisma/dev.db`.
- **N2** — Comportamento nativo de rede (ATS/cleartext) no build nativo vs Expo Go. Codigo escolhe HTTP (`domusApi.ts:115-136`); fix real e no codigo (C4).
- **N3** — `npm audit` no `mobile/` ainda nao executado. Rodar `npm audit --package-lock-only` em `mobile/`.

---

## Histórico

- 2026-10-25 — Auditoria focada executada; C1/C2/C11 corrigidos e validados (commits `8914b38`, `504d4cb`, `653cd70`); memoria Serena `backend/core` sincronizada.
