# DOMUS Mobile — Protótipo de Cadastro de Clientes (Expo Go)

Protótipo mobile do sistema **DOMUS**, desenvolvido em **React Native** com **Expo SDK 58** e **TypeScript**, entregando a tela de **Cadastro de Clientes** validada no documento acadêmico institucional [MODELO DIAGNÓSTICO DA PROBLEMÁTICA E PLANO DE INTERVENÇÃO.docx](file:///d:/code/DOMUS/docs/MODELO%20DIAGN%C3%93STICO%20DA%20PROBLEM%C3%81TICA%20E%20PLANO%20DE%20INTERVEN%C3%87%C3%83O.docx) e fiel ao wireframe [01-cadastro-cliente.png](file:///d:/code/DOMUS/docs/prototipos/01-cadastro-cliente.png).

---

## 1. Tela Entregue: Cadastro de Cliente

Conforme o direcionamento da primeira entrega na **Seção 4.1 do Diagnóstico**, a aplicação apresenta:
- **Cabeçalho Institucional (`DomusHeader`):** Topo âmbar (`#FFE099`), ícone de casa, marca `DOMUS` e indicador de modo.
- **Barra de Navegação (`DomusNavBar`):** Barra grafite (`#262626`) com as abas e destaque ativo laranja (`#FFA347`) em "Clientes".
- **Formulário Fiel ao Wireframe (`01-cadastro-cliente.png`):**
  - `nome Completo`
  - `CPF` (com formatação automática)
  - `Telefone` (com máscara de telefone)
  - `E-mail`
  - Seleção tátil do `Canal Principal de Contato` (`WHATSAPP`, `TELEFONE`, `REDE_SOCIAL`, `EMAIL`, `PRESENCIAL`)
  - Campo `Observações` sobre interesses e perfil do cliente
  - Seleção de `Imóveis de Interesse` vinculados
  - Botão laranja padronizado `Cadastrar`
- **Listagem de Clientes Cadastrados:** Exibição dos clientes já salvos com busca rápida por texto e canal preferencial.

---

## 2. Como Executar no Celular com Expo Go

1. **Instalar dependências (caso necessário):**
   ```bash
   cd mobile
   npm install
   ```

2. **Iniciar o servidor Expo:**
   ```bash
   npm start
   # ou
   npx expo start
   ```

3. **Abrir no celular:**
   - No **Android:** Abra o aplicativo **Expo Go** e escaneie o QR Code exibido no terminal.
   - No **iOS:** Abra a câmera nativa do iPhone, aponte para o QR Code e toque no link do Expo Go.

---

## 3. Testes Automatizados e Verificação de Tipos

```bash
# Executar suíte de testes unitários (Jest)
npm test --prefix mobile

# Executar checagem estrita de tipos TypeScript
npm run typecheck --prefix mobile
```
