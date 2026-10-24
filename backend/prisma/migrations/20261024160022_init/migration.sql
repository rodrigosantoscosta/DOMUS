-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfis" TEXT NOT NULL DEFAULT 'CORRETOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomeCompleto" TEXT NOT NULL,
    "cpfDocumento" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL DEFAULT 'CPF',
    "telefone" TEXT NOT NULL,
    "celular" TEXT,
    "email" TEXT,
    "canalPrincipalContato" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Imovel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroInscricao" TEXT,
    "tipoImovel" TEXT NOT NULL DEFAULT 'APARTAMENTO',
    "finalidade" TEXT NOT NULL DEFAULT 'VENDA',
    "cep" TEXT,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "areaTotal" REAL,
    "comodos" INTEGER NOT NULL DEFAULT 1,
    "banheiros" INTEGER NOT NULL DEFAULT 1,
    "valor" REAL NOT NULL DEFAULT 0,
    "posicoes" TEXT,
    "statusImovel" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "proprietarioId" INTEGER,
    "corretorCaptadorId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Imovel_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Imovel_corretorCaptadorId_fkey" FOREIGN KEY ("corretorCaptadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "descricaoCurta" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'ATENDIMENTO',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataHora" DATETIME,
    "duracaoMinutos" INTEGER NOT NULL DEFAULT 60,
    "observacao" TEXT,
    "canalContato" TEXT,
    "proximaAcao" TEXT,
    "dataRetorno" DATETIME,
    "sincronizarGoogleCalendar" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarEventId" TEXT,
    "googleCalendarUrl" TEXT,
    "clienteId" INTEGER NOT NULL,
    "imovelId" INTEGER,
    "corretorId" INTEGER,
    "agendamentoOrigemId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_agendamentoOrigemId_fkey" FOREIGN KEY ("agendamentoOrigemId") REFERENCES "Agendamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipoAviso" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "agendamentoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "disparadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensadoEm" DATETIME,
    CONSTRAINT "Aviso_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aviso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_InteresseClienteImovel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_InteresseClienteImovel_A_fkey" FOREIGN KEY ("A") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_InteresseClienteImovel_B_fkey" FOREIGN KEY ("B") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfDocumento_key" ON "Cliente"("cpfDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_numeroInscricao_key" ON "Imovel"("numeroInscricao");

-- CreateIndex
CREATE UNIQUE INDEX "Aviso_agendamentoId_tipoAviso_key" ON "Aviso"("agendamentoId", "tipoAviso");

-- CreateIndex
CREATE UNIQUE INDEX "_InteresseClienteImovel_AB_unique" ON "_InteresseClienteImovel"("A", "B");

-- CreateIndex
CREATE INDEX "_InteresseClienteImovel_B_index" ON "_InteresseClienteImovel"("B");
