import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados DOMUS (Persona Junior)...');

  const senhaHash = await bcrypt.hash('Domus@2026', 10);

  const junior = await prisma.usuario.upsert({
    where: { login: 'junior.corretor' },
    update: {},
    create: {
      nome: 'Junior (Corretor Autônomo - João Pessoa/PB)',
      login: 'junior.corretor',
      cpf: '11122233344',
      email: 'junior@domus.com.br',
      senhaHash,
      perfis: 'CORRETOR,CADASTRADOR',
      ativo: true,
    },
  });

  const imovelManaira = await prisma.imovel.upsert({
    where: { numeroInscricao: 'JP-MAN-2026-01' },
    update: {},
    create: {
      numeroInscricao: 'JP-MAN-2026-01',
      tipoImovel: 'APARTAMENTO',
      finalidade: 'VENDA',
      cep: '58038-000',
      endereco: 'Av. Gov. Flávio Ribeiro Coutinho',
      bairro: 'Manaíra',
      numero: '500',
      complemento: 'Apto 802',
      areaTotal: 110,
      comodos: 3,
      banheiros: 2,
      valor: 620000,
      posicoes: 'NASCENTE,NORTE',
      statusImovel: 'DISPONIVEL',
      corretorCaptadorId: junior.id,
    },
  });

  const clienteCarlos = await prisma.cliente.upsert({
    where: { cpfDocumento: '98765432100' },
    update: {},
    create: {
      nomeCompleto: 'Carlos Eduardo Mendes',
      cpfDocumento: '98765432100',
      tipoDocumento: 'CPF',
      telefone: '(83) 99988-7766',
      celular: '(83) 99988-7766',
      email: 'carlos.mendes@email.com',
      canalPrincipalContato: 'WHATSAPP',
      observacoes: 'Procura apartamento 3 quartos em Manaíra, posição nascente.',
      imoveisInteresse: {
        connect: [{ id: imovelManaira.id }],
      },
    },
  });

  const amanha = new Date(Date.now() + 24 * 3600_000);
  await prisma.agendamento.create({
    data: {
      titulo: 'Visita ao Apto Manaíra com Carlos',
      descricao: 'Apresentar imóvel e documentação inicial',
      descricaoCurta: 'Apresentar imóvel e documentação inicial',
      tipo: 'VISITA',
      status: 'CONFIRMADO',
      dataHora: amanha,
      duracaoMinutos: 60,
      observacao: 'Confirmado via WhatsApp',
      canalContato: 'WHATSAPP',
      proximaAcao: 'Enviar simulação de financiamento após a visita',
      clienteId: clienteCarlos.id,
      imovelId: imovelManaira.id,
      corretorId: junior.id,
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
