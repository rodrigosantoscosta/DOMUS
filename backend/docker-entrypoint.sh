#!/bin/sh
set -e

echo "[DOMUS Backend] Inicializando ambiente Docker..."

# Executa as migrations do Prisma no banco SQLite (dev.db)
echo "[DOMUS Backend] Aplicando migrations do Prisma..."
npx prisma migrate deploy

# Executa o seed para popular os dados iniciais da Persona Junior caso necessario
echo "[DOMUS Backend] Garantindo seed inicial da Persona Junior..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.count().then(count => {
  if (count === 0) {
    console.log('[DOMUS Backend] Banco vazio, executando seed...');
    require('child_process').execSync('npm run prisma:seed', { stdio: 'inherit' });
  } else {
    console.log('[DOMUS Backend] Banco ja contem dados (' + count + ' usuarios). Pulando seed.');
  }
  process.exit(0);
}).catch(err => {
  console.error('[DOMUS Backend] Erro ao checar dados:', err);
  process.exit(1);
});
" || npm run prisma:seed

echo "[DOMUS Backend] Iniciando servidor NestJS na porta ${PORT:-3000}..."
exec node dist/main.js
