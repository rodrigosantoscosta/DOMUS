/**
 * Script de inicializacao do backend DOMUS com exposicao na rede local (LAN).
 * Permite que dispositivos na mesma rede Wi-Fi (como o celular Android com o APK instalado)
 * se conectem a API sem complicacao.
 */

const os = require('os');
const { spawn } = require('child_process');
const path = require('path');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignora enderecos internos (127.0.0.1) e IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();
const port = process.env.PORT || 3000;

console.log('===================================================================');
console.log(' [DOMUS] Servidor Fullstack na Rede Local (Wi-Fi / LAN)');
console.log('===================================================================');
console.log(` [OK] IP Local da sua maquina detectado: ${localIp}`);
console.log(` [OK] Backend API: http://${localIp}:${port}/api`);
console.log(` [OK] Swagger Docs: http://${localIp}:${port}/api/docs`);
console.log('-------------------------------------------------------------------');
console.log(' [COMO CONECTAR O APLICATIVO ANDROID (APK)]');
console.log(' 1. Certifique-se de que o celular esta conectado no mesmo Wi-Fi.');
console.log(' 2. Abra o app DOMUS no celular.');
console.log(' 3. Toque no status de conexao (topo do app) e confirme a URL:');
console.log(`    http://${localIp}:${port}/api`);
console.log(' 4. Caso o celular esteja offline ou fora do Wi-Fi, o app');
console.log('    continuara funcionando 100% no Modo Offline integrado.');
console.log('===================================================================\n');

// Inicia o backend NestJS
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const backendProcess = spawn(npmCmd, ['run', 'start:dev'], {
  cwd: path.resolve(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true,
});

backendProcess.on('error', (err) => {
  console.error('[ERRO] Falha ao iniciar o backend:', err);
});

backendProcess.on('exit', (code) => {
  console.log(`[INFO] Processo do backend finalizado com codigo ${code}`);
});
