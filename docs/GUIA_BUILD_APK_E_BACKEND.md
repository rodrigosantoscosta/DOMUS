# Guia de Geracao do APK Android e Integracao com o Backend

> [!NOTE]
> **TL;DR:** O arquivo `.apk` e gerado diretamente pelo Expo EAS Cloud (`npm run build:apk`) sem exigir instalacao manual do Android Studio. O aplicativo instalado no celular Android opera conectado ao backend via Wi-Fi (`npm run dev:lan`) ou cabo USB (`adb reverse`), exigindo autenticacao JWT real na `LoginScreen`. O modo demonstrativo offline legado esta preservado na branch `feat/modo-demo-local`.

---

## 1. Arquitetura de Integracao e Execucao

```mermaid
flowchart TD
    subgraph Nuvem_ou_Maquina["1. Geracao do Instalador"]
        EAS["EAS Cloud Build<br/>(npm run build:apk)"] --> APK["Arquivo APK Gerado<br/>(domus-mobile.apk)"]
    end

    subgraph Dispositivo_Android["2. Celular do Usuario"]
        APK --> APP["App DOMUS Instalado"]
        APP -->|"Autenticacao JWT Real"| LOGIN["LoginScreen (POST /api/auth/login)"]
        LOGIN -->|"Na mesma rede Wi-Fi ou USB"| ONLINE["Conexao com Backend<br/>(http://IP_DA_MAQUINA:3000/api)"]
    end

    subgraph Computador_Servidor["3. Servidor Local / Nuvem"]
        LAN["npm run dev:lan"] --> BACKEND["Backend NestJS + SQLite<br/>(Porta 3000 em 0.0.0.0)"]
        BACKEND -.-> ONLINE
    end
```

---

## 2. Passo a Passo para Gerar o APK no Celular

### Passo 1: Disparar a Build do APK via Expo EAS

Abra o terminal na pasta raiz do projeto DOMUS e execute:

```bash
npm run build:apk
```

*(Ou alternativamente: `cd mobile && npx eas-cli build -p android --profile preview`)*

### Passo 2: Login no Expo (apenas no primeiro uso)

Se for a primeira vez usando o EAS no seu computador:
1. O terminal perguntara se voce ja possui uma conta Expo.
2. Caso nao tenha, crie uma conta gratuita em [expo.dev](https://expo.dev/signup) ou crie diretamente no prompt.
3. Apos o login, o Expo fara o upload do codigo e compilara o APK nos servidores da nuvem.

### Passo 3: Baixar e Instalar no Celular

1. Ao finalizar a compilacao, o terminal exibira um **QR Code** e um **Link Direto** para download.
2. Aponte a camera do seu celular Android para o QR Code (ou abra o link no navegador do celular).
3. Baixe o arquivo `.apk` e toque para instalar (permita instalacao de fontes desconhecidas caso o Android solicite).

---

## 3. Como o APK Funciona com o Backend

| Modo de Uso | Como Funciona | Quando Utilizar |
| :--- | :--- | :--- |
| **Modo Padrao: Integrado com Backend (Online-First)** | Execute `npm run dev:lan` no computador. O app no celular autentica via JWT na `LoginScreen`, conecta-se via Wi-Fi ou USB ao backend NestJS e sincroniza o banco SQLite. | Uso operacional real, demonstracoes ponta a ponta, login real, persistencia no banco e rotas de API. |
| **Branch Legada: Modo Demo Offline (`feat/modo-demo-local`)** | Caso seja necessario apresentar sem servidor backend disponivel, utilize a branch dedicada `feat/modo-demo-local` que preserva os dados embutidos da Persona Junior. | Contingencia em locais sem acesso a rede local ou sem computador servidor. |

---

## 4. Conectando o Celular ao Backend Local (Wi-Fi)

Para testar a integracao com o backend em tempo real:

1. Conecte o computador e o celular na mesma rede Wi-Fi.
2. No computador, inicie o backend com o comando:
   ```bash
   npm run dev:lan
   ```
3. O terminal informara o IP da sua maquina, por exemplo: `http://192.168.1.15:3000/api`.
4. No aplicativo DOMUS no celular:
   - Pelo **Expo Go**, o aplicativo detecta automaticamente o IP da maquina via `expo-constants` (ou utiliza `EXPO_PUBLIC_API_URL` definido em `mobile/.env`).
   - Na tela de login (`LoginScreen`), autentique-se com um usuario cadastrado (ex.: seed `junior.corretor` ou novo cadastro de corretor na aba **Criar Conta**).

---

## 5. Estrutura dos Arquivos de Configuracao Criados

- `mobile/eas.json`: Perfil `preview` configurado com `buildType: "apk"`.
- `mobile/app.json`: Pacote Android configurado como `com.domus.mobile`, versao de codigo e permissoes de rede (`INTERNET`, `ACCESS_NETWORK_STATE`).
- `backend/src/main.ts`: Escuta em todas as interfaces de rede (`0.0.0.0`) para permitir conexoes externas de celulares.
- `scripts/host-lan.js`: Utilitario automatico que detecta o IP local e inicia o backend com instrucoes visuais.
