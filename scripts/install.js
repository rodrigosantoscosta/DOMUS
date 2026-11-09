#!/usr/bin/env node
/**
 * DOMUS — Script de instalacao dos modulos (raiz + backend + mobile).
 *
 * Uso:
 *   npm install        (dispara este script via "postinstall" na raiz)
 *   npm run setup      (execucao manual)
 *
 * - Raiz: instala as devDependencies (concurrently) se ainda nao existirem.
 * - Backend (NestJS + Prisma): "npm ci" com fallback para "npm install".
 *   O "postinstall" do proprio backend roda "prisma generate".
 * - Mobile (Expo/RN): "npm ci" com fallback para "npm install".
 * - Banco (SQLite): copia .env.example -> .env se necessario, aplica
 *   "prisma migrate deploy" e executa o seed (ambos idempotentes).
 *   Para pular esta etapa: DOMUS_SKIP_DB=1.
 *
 * Cross-platform: no Windows invoca o npm via "npm.cmd" com shell,
 * contornando o bloqueio do npm.ps1 pela Execution Policy do PowerShell.
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NODE_MIN_MAJOR = 20;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const COLORS = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(tag, message) {
  console.log(`${COLORS.cyan}[domus-install]${COLORS.reset} ${message}`);
}

function ok(message) {
  console.log(`${COLORS.green}[domus-install]${COLORS.reset} ${message}`);
}

function warn(message) {
  console.log(`${COLORS.yellow}[domus-install]${COLORS.reset} ${message}`);
}

function fail(message) {
  console.error(`${COLORS.red}[domus-install]${COLORS.reset} ${message}`);
}

// ---------------------------------------------------------------------------

function checkNodeVersion() {
  const major = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (Number.isNaN(major) || major < NODE_MIN_MAJOR) {
    fail(`Node.js ${NODE_MIN_MAJOR} ou superior e necessario (encontrado: ${process.versions.node}).`);
    fail('Baixe a versao LTS mais recente em https://nodejs.org/');
    process.exit(1);
  }
  ok(`Node.js v${process.versions.node} detectado.`);
}

/**
 * Localiza o executavel correto do npm.
 * No Windows, "npm" resolve para npm.ps1 (bloqueado por Execution Policy)
 * ou npm.cmd. Invocamos npm.cmd com shell: true (exigido pelo Node moderno
 * para arquivos .cmd).
 */
function runNpm(cwd, args, label) {
  const useShell = process.platform === 'win32';
  // No Windows, "npm" resolve para npm.ps1 (bloqueado pela Execution Policy)
  // ou npm.cmd. Invocamos npm.cmd com shell: true (exigido pelo Node moderno
  // para arquivos .cmd) e concatenamos o comando para evitar o aviso DEP0190.
  // Os argumentos sao literais fixas deste script, sem entrada do usuario.
  const npmCmd = useShell ? 'npm.cmd' : 'npm';
  const command = useShell ? [npmCmd, ...args].join(' ') : npmCmd;
  const result = spawnSync(command, useShell ? [] : args, {
    cwd,
    stdio: 'inherit',
    shell: useShell,
  });

  if (result.error) {
    fail(`${label}: falha ao executar o npm (${result.error.message}).`);
    fail('Verifique se o Node.js/npm estao instalados e no PATH.');
    process.exit(1);
  }
  return result.status;
}

function checkVendoredTarballs() {
  const modules = ['backend', 'mobile'];
  for (const name of modules) {
    const tarball = path.join(ROOT, name, 'vendor', 'deepmerge-4.3.2.tgz');
    if (!fs.existsSync(tarball)) {
      fail(`Dependencia vendida nao encontrada: ${path.relative(ROOT, tarball)}`);
      fail(`O ${name}/package.json depende dela via "file:./vendor/deepmerge-4.3.2.tgz".`);
      fail('Restaure o arquivo (ex.: git checkout) antes de instalar.');
      process.exit(1);
    }
  }
  ok('Tarballs vendorados (deepmerge) presentes em backend/ e mobile/.');
}

function installRoot() {
  const concurrentlyPath = path.join(ROOT, 'node_modules', 'concurrently', 'package.json');
  if (fs.existsSync(concurrentlyPath)) {
    ok('Raiz: dependencias (concurrently) ja instaladas.');
    return;
  }
  log('raiz', 'Instalando dependencias da raiz (concurrently)...');
  // --ignore-scripts evita que este postinstall seja disparado novamente (recursao).
  const status = runNpm(ROOT, ['install', '--ignore-scripts'], 'raiz');
  if (status !== 0) {
    fail('Raiz: falha ao instalar as dependencias.');
    process.exit(status || 1);
  }
  ok('Raiz: dependencias instaladas.');
}

function installModule(name) {
  const dir = path.join(ROOT, name);
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    fail(`Pasta ${name}/ nao encontrada ou sem package.json.`);
    process.exit(1);
  }

  const hasLockfile = fs.existsSync(path.join(dir, 'package-lock.json'));
  log(name, hasLockfile ? 'Instalando com "npm ci" (lockfile detectado)...' : 'Instalando com "npm install" (sem lockfile)...');

  let status = runNpm(dir, hasLockfile ? ['ci'] : ['install'], name);

  if (status !== 0 && hasLockfile) {
    warn(`${name}: "npm ci" falhou (exit ${status}). Tentando "npm install"...`);
    status = runNpm(dir, ['install'], name);
  }

  if (status !== 0) {
    fail(`${name}: falha na instalacao (exit ${status}). Consulte o log acima.`);
    process.exit(status || 1);
  }
  ok(`${name}: instalado com sucesso.`);
}

function setupDatabase() {
  // Pulo opcional: DOMUS_SKIP_DB=1 node scripts/install.js
  if (process.env.DOMUS_SKIP_DB === '1') {
    warn('Banco: etapa pulada (DOMUS_SKIP_DB=1).');
    return;
  }

  const backendDir = path.join(ROOT, 'backend');
  const envFile = path.join(backendDir, '.env');
  const envExample = path.join(backendDir, '.env.example');

  // O .env e ignorado pelo git; num clone fresco ele nao existe e o Prisma
  // falharia por falta de DATABASE_URL. O .env.example usa SQLite zero-config.
  if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    warn('Banco: backend/.env nao existia e foi criado a partir de .env.example (SQLite local).');
    warn('Banco: altere JWT_SECRET antes de qualquer uso em producao!');
  }

  // Idempotente: aplica apenas migracoes pendentes e cria o arquivo SQLite
  // se necessario (prisma/migrations/20261024160022_init).
  log('banco', 'Aplicando migracoes (prisma migrate deploy)...');
  let status = runNpm(backendDir, ['exec', 'prisma', 'migrate', 'deploy'], 'banco');
  if (status !== 0) {
    fail('Banco: falha ao aplicar as migracoes. Verifique o backend/.env (DATABASE_URL).');
    process.exit(status || 1);
  }

  // Idempotente: o seed (prisma/seed.ts) usa upsert e nao duplica dados.
  log('banco', 'Executando seed (npm run prisma:seed)...');
  status = runNpm(backendDir, ['run', 'prisma:seed'], 'banco');
  if (status !== 0) {
    warn(`Banco: o seed falhou (exit ${status}), mas a instalacao prossegue.`);
    warn('Banco: rode manualmente depois com "npm run prisma:seed" dentro de backend/.');
    return;
  }
  ok('Banco: migracoes aplicadas e seed executado.');
}

// ---------------------------------------------------------------------------
// Execucao
// ---------------------------------------------------------------------------

function main() {
  log('domus', 'Instalando DOMUS (raiz + backend + mobile)...');

  checkNodeVersion();
  checkVendoredTarballs();

  const startedAt = Date.now();
  installRoot();
  installModule('backend');
  installModule('mobile');
  setupDatabase();

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  ok(`Instalacao concluida em ${seconds}s.`);
  ok('Proximos passos:');
  ok('  1. raiz: "npm run dev" (backend + mobile web) ou "npm run dev:lan" (rede local)');
}

main();
