import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { useDomus, DomusContextData } from '../context/DomusContext';
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';
import { CanalContato, Cliente, Imovel } from '../types/domus';
import { formatarCpfCnpj, formatarMoedaBrl, formatarTelefone } from '../utils/formatters';

export interface ClientesScreenProps {
  context?: DomusContextData;
  onAgendarCliente?: (cliente: Cliente) => void;
}

interface CanalOption {
  id: CanalContato;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CANAIS_CONTATO: CanalOption[] = [
  { id: 'WHATSAPP', label: 'WhatsApp', icon: 'chatbubbles-outline' },
  { id: 'TELEFONE', label: 'Telefone', icon: 'call-outline' },
  { id: 'REDE_SOCIAL', label: 'Rede Social', icon: 'share-social-outline' },
  { id: 'EMAIL', label: 'E-mail', icon: 'mail-outline' },
  { id: 'PRESENCIAL', label: 'Presencial', icon: 'people-outline' },
];

export const ClientesScreen: React.FC<ClientesScreenProps> = ({
  context,
  onAgendarCliente,
}) => {
  const domusHook = context ? null : useDomus();
  const domus = context || domusHook!;

  // Campos do formulário (fiel ao wireframe 01-cadastro-cliente.png)
  const [nomeCompleto, setNomeCompleto] = useState<string>('');
  const [cpfDocumento, setCpfDocumento] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Extensões da Seção 4.2 do Diagnóstico
  const [canalPrincipal, setCanalPrincipal] = useState<CanalContato>('WHATSAPP');
  const [observacoes, setObservacoes] = useState<string>('');
  const [imoveisInteresseIds, setImoveisInteresseIds] = useState<number[]>([]);

  // Filtro de busca na lista de clientes cadastrados
  const [busca, setBusca] = useState<string>('');

  // Estados de feedback e submissão
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [sucessoLocal, setSucessoLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  const toggleImovelInteresse = (imovelId: number) => {
    setImoveisInteresseIds((prev) =>
      prev.includes(imovelId)
        ? prev.filter((id) => id !== imovelId)
        : [...prev, imovelId]
    );
  };

  const handleCadastrarCliente = async () => {
    setErroLocal(null);
    setSucessoLocal(null);

    const nomeLimpo = nomeCompleto.trim();
    const cpfLimpo = cpfDocumento.trim();
    const telLimpo = telefone.trim();

    if (!nomeLimpo) {
      setErroLocal('O campo nome Completo é obrigatório');
      return;
    }
    if (!cpfLimpo) {
      setErroLocal('O campo CPF é obrigatório');
      return;
    }
    if (!telLimpo) {
      setErroLocal('O campo Telefone é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      const novoCliente = await domus.criarCliente({
        nomeCompleto: nomeLimpo,
        cpfDocumento: cpfLimpo,
        telefone: telLimpo,
        email: email.trim() || undefined,
        canalPrincipalContato: canalPrincipal,
        observacoes: observacoes.trim() || undefined,
        imoveisInteresseIds: imoveisInteresseIds.length > 0 ? imoveisInteresseIds : undefined,
      });

      setSucessoLocal(`[OK] Cliente "${novoCliente.nomeCompleto}" cadastrado com sucesso!`);
      // Limpeza dos campos
      setNomeCompleto('');
      setCpfDocumento('');
      setTelefone('');
      setEmail('');
      setCanalPrincipal('WHATSAPP');
      setObservacoes('');
      setImoveisInteresseIds([]);
    } catch (err: any) {
      setErroLocal(err.message || 'Erro ao cadastrar cliente');
    } finally {
      setSalvando(false);
    }
  };

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return domus.clientes;
    }
    const termo = busca.toLowerCase().trim();
    return domus.clientes.filter((c) => {
      const nomeMatch = c.nomeCompleto.toLowerCase().includes(termo);
      const telMatch = c.telefone.toLowerCase().includes(termo);
      const cpfMatch = c.cpfDocumento.toLowerCase().includes(termo);
      const emailMatch = c.email?.toLowerCase().includes(termo);
      return nomeMatch || telMatch || cpfMatch || emailMatch;
    });
  }, [domus.clientes, busca]);

  const handleAgendarParaCliente = (cliente: Cliente) => {
    if (onAgendarCliente) {
      onAgendarCliente(cliente);
    } else {
      domus.setAbaAtiva('Agendar');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="clientes-screen-scroll"
      >
        {/* Banner de Feedback */}
        {erroLocal ? (
          <View style={styles.errorBox} testID="cliente-error-box" accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={DOMUS_COLORS.statusDanger} />
            <Text style={styles.errorText}>{erroLocal}</Text>
          </View>
        ) : null}

        {sucessoLocal ? (
          <View style={styles.successBox} testID="cliente-success-box">
            <Ionicons name="checkmark-circle" size={18} color={DOMUS_COLORS.statusSuccess} />
            <Text style={styles.successText}>{sucessoLocal}</Text>
          </View>
        ) : null}

        {/* Card: Cadastro de Cliente (fiel ao wireframe 01-cadastro-cliente.png) */}
        <View style={styles.formCard} testID="card-formulario-cliente">
          <View style={styles.titleHeader}>
            <Ionicons name="person-add-outline" size={20} color={DOMUS_COLORS.textDark} />
            <Text style={styles.title} testID="titulo-cadastro-cliente">
              Cadastro de Cliente
            </Text>
          </View>

          {/* Campo 1: nome Completo */}
          <DomusInput
            label="nome Completo"
            placeholder="Nome Completo do Cliente"
            value={nomeCompleto}
            onChangeText={(text) => {
              setNomeCompleto(text);
              setErroLocal(null);
            }}
            testID="input-cliente-nome"
          />

          {/* Campo 2: CPF */}
          <DomusInput
            label="CPF"
            placeholder="000.000.000-00 (CPF ou CNPJ)"
            value={cpfDocumento}
            onChangeText={(text) => {
              setCpfDocumento(formatarCpfCnpj(text));
              setErroLocal(null);
            }}
            keyboardType="numeric"
            testID="input-cliente-cpf"
          />

          {/* Campo 3: Telefone */}
          <DomusInput
            label="Telefone"
            placeholder="(83) 90000-0000"
            value={telefone}
            onChangeText={(text) => {
              setTelefone(formatarTelefone(text));
              setErroLocal(null);
            }}
            keyboardType="phone-pad"
            testID="input-cliente-telefone"
          />

          {/* Campo 4: E-mail */}
          <DomusInput
            label="E-mail"
            placeholder="email@exemplo.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErroLocal(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-cliente-email"
          />

          {/* Seção 4.2 do Diagnóstico: Canal Principal de Contato */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Canal Principal de Contato</Text>
            <View style={styles.canaisRow}>
              {CANAIS_CONTATO.map((canal) => {
                const selecionado = canalPrincipal === canal.id;
                return (
                  <TouchableOpacity
                    key={canal.id}
                    style={[
                      styles.canalChip,
                      selecionado && styles.canalChipSelected,
                    ]}
                    onPress={() => setCanalPrincipal(canal.id)}
                    testID={`chip-canal-${canal.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selecionado }}
                  >
                    <Ionicons
                      name={canal.icon}
                      size={15}
                      color={
                        selecionado
                          ? DOMUS_COLORS.primaryButtonText
                          : DOMUS_COLORS.textDark
                      }
                    />
                    <Text
                      style={[
                        styles.canalChipText,
                        selecionado && styles.canalChipTextSelected,
                      ]}
                    >
                      {canal.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Campo Observações */}
          <DomusInput
            label="Observações"
            placeholder="Preferências, bairros desejados, faixa de valor..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            inputStyle={styles.textArea}
            testID="input-cliente-observacoes"
          />

          {/* Seleção de Imóveis de Interesse */}
          {domus.imoveis && domus.imoveis.length > 0 ? (
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Imóveis de Interesse</Text>
              <Text style={styles.fieldHelper}>
                Selecione os imóveis para vincular ao interesse deste cliente:
              </Text>
              <View style={styles.imoveisChipsContainer}>
                {domus.imoveis.map((imovel) => {
                  const selecionado = imoveisInteresseIds.includes(imovel.id);
                  return (
                    <TouchableOpacity
                      key={imovel.id}
                      style={[
                        styles.imovelChip,
                        selecionado && styles.imovelChipSelected,
                      ]}
                      onPress={() => toggleImovelInteresse(imovel.id)}
                      testID={`chip-imovel-${imovel.id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selecionado }}
                    >
                      <Ionicons
                        name={selecionado ? 'checkbox' : 'square-outline'}
                        size={16}
                        color={
                          selecionado
                            ? DOMUS_COLORS.primaryOrange
                            : DOMUS_COLORS.mutedText
                        }
                      />
                      <View style={styles.imovelChipInfo}>
                        <Text
                          style={[
                            styles.imovelChipTitle,
                            selecionado && styles.imovelChipTitleSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {imovel.tipoImovel} - {imovel.bairro || imovel.endereco}
                        </Text>
                        <Text style={styles.imovelChipSub}>
                          {imovel.numeroInscricao ? `[${imovel.numeroInscricao}] ` : ''}
                          {formatarMoedaBrl(imovel.valor)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Botão Cadastrar fiel ao wireframe */}
          <DomusButton
            title="Cadastrar"
            variant="primary"
            loading={salvando}
            onPress={handleCadastrarCliente}
            testID="btn-cadastrar-cliente"
            style={styles.btnCadastrar}
          />
        </View>

        {/* Seção Inferior: Clientes Cadastrados */}
        <View style={styles.listSection} testID="secao-clientes-cadastrados">
          <View style={styles.listHeaderRow}>
            <View style={styles.listTitleBox}>
              <Ionicons name="people" size={20} color={DOMUS_COLORS.textDark} />
              <Text style={styles.listTitle}>Clientes Cadastrados</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>
                {`${domus.clientes.length} ${domus.clientes.length === 1 ? 'cliente' : 'clientes'}`}
              </Text>
            </View>
          </View>

          {/* Barra de busca rápida */}
          <DomusInput
            placeholder="Buscar por nome, telefone ou CPF..."
            value={busca}
            onChangeText={setBusca}
            testID="input-busca-cliente"
            containerStyle={styles.buscaContainer}
          />

          {/* Cards de Clientes */}
          {clientesFiltrados.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
            </View>
          ) : (
            clientesFiltrados.map((cli) => {
              const imoveisVinculados = cli.imoveisInteresse || [];
              return (
                <View
                  key={cli.id}
                  style={styles.clienteCard}
                  testID={`card-cliente-${cli.id}`}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.clienteNome} numberOfLines={1}>
                      {cli.nomeCompleto}
                    </Text>
                    <View style={styles.canalBadge}>
                      <Ionicons
                        name="chatbubble-ellipses"
                        size={12}
                        color={DOMUS_COLORS.statusSuccess}
                      />
                      <Text style={styles.canalBadgeText}>
                        {cli.canalPrincipalContato}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.clienteDetailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={13} color={DOMUS_COLORS.mutedText} />
                      <Text style={styles.detailText}>{cli.telefone}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="card-outline" size={13} color={DOMUS_COLORS.mutedText} />
                      <Text style={styles.detailText}>{cli.cpfDocumento}</Text>
                    </View>
                  </View>

                  {cli.email ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={13} color={DOMUS_COLORS.mutedText} />
                      <Text style={styles.detailText}>{cli.email}</Text>
                    </View>
                  ) : null}

                  {cli.observacoes ? (
                    <Text style={styles.observacaoText} numberOfLines={2}>
                      Obs: {cli.observacoes}
                    </Text>
                  ) : null}

                  {imoveisVinculados.length > 0 ? (
                    <View style={styles.imoveisBadgeRow}>
                      <Ionicons name="home-outline" size={13} color={DOMUS_COLORS.mutedText} />
                      <Text style={styles.imoveisBadgeText}>
                        {`${imoveisVinculados.length} ${
                          imoveisVinculados.length === 1
                            ? 'imóvel de interesse'
                            : 'imóveis de interesse'
                        }`}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.btnAgendarAtalho}
                    onPress={() => handleAgendarParaCliente(cli)}
                    testID={`btn-agendar-cliente-${cli.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Agendar Visita ou Retorno para ${cli.nomeCompleto}`}
                  >
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={DOMUS_COLORS.primaryButtonText}
                    />
                    <Text style={styles.btnAgendarAtalhoText}>
                      Agendar Visita / Retorno
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DOMUS_COLORS.canvasBg,
  },
  scrollContent: {
    padding: DOMUS_SPACING.md,
    paddingBottom: DOMUS_SPACING.xxl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: DOMUS_COLORS.statusDanger,
    borderRadius: DOMUS_RADIUS.md,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
  },
  errorText: {
    ...DOMUS_TYPOGRAPHY.body,
    color: DOMUS_COLORS.statusDanger,
    fontSize: 13,
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: DOMUS_COLORS.statusSuccess,
    borderRadius: DOMUS_RADIUS.md,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
  },
  successText: {
    ...DOMUS_TYPOGRAPHY.body,
    color: DOMUS_COLORS.statusSuccess,
    fontSize: 13,
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
  },
  formCard: {
    backgroundColor: DOMUS_COLORS.white,
    borderRadius: DOMUS_RADIUS.lg,
    padding: DOMUS_SPACING.lg,
    marginBottom: DOMUS_SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.md,
  },
  title: {
    ...DOMUS_TYPOGRAPHY.title,
    fontSize: 20,
    fontWeight: '700',
    color: DOMUS_COLORS.textDark,
    marginLeft: DOMUS_SPACING.xs,
  },
  fieldSection: {
    marginBottom: DOMUS_SPACING.md,
  },
  fieldLabel: {
    ...DOMUS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: DOMUS_COLORS.textDark,
    marginBottom: DOMUS_SPACING.xs,
  },
  fieldHelper: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.mutedText,
    marginBottom: DOMUS_SPACING.xs,
  },
  canaisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOMUS_SPACING.xs,
  },
  canalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOMUS_COLORS.surfaceInput,
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: DOMUS_SPACING.xs + 2,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  canalChipSelected: {
    backgroundColor: DOMUS_COLORS.primaryOrange,
    borderColor: '#D87000',
  },
  canalChipText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.textDark,
    fontWeight: '600',
    marginLeft: 4,
  },
  canalChipTextSelected: {
    color: DOMUS_COLORS.primaryButtonText,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  imoveisChipsContainer: {
    gap: DOMUS_SPACING.xs,
  },
  imovelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOMUS_COLORS.surfaceInput,
    padding: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  imovelChipSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: DOMUS_COLORS.primaryOrange,
  },
  imovelChipInfo: {
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
  },
  imovelChipTitle: {
    ...DOMUS_TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_COLORS.textDark,
  },
  imovelChipTitleSelected: {
    color: '#D87000',
    fontWeight: '700',
  },
  imovelChipSub: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.mutedText,
    fontSize: 11,
  },
  btnCadastrar: {
    marginTop: DOMUS_SPACING.sm,
  },
  listSection: {
    backgroundColor: DOMUS_COLORS.white,
    borderRadius: DOMUS_RADIUS.lg,
    padding: DOMUS_SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DOMUS_SPACING.sm,
  },
  listTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    ...DOMUS_TYPOGRAPHY.title,
    fontSize: 18,
    color: DOMUS_COLORS.textDark,
    marginLeft: DOMUS_SPACING.xs,
  },
  counterBadge: {
    backgroundColor: DOMUS_COLORS.surfaceInput,
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: DOMUS_RADIUS.pill,
  },
  counterBadgeText: {
    ...DOMUS_TYPOGRAPHY.caption,
    fontWeight: '700',
    color: DOMUS_COLORS.textDark,
  },
  buscaContainer: {
    marginBottom: DOMUS_SPACING.sm,
  },
  emptyCard: {
    padding: DOMUS_SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...DOMUS_TYPOGRAPHY.body,
    color: DOMUS_COLORS.mutedText,
  },
  clienteCard: {
    backgroundColor: DOMUS_COLORS.surfaceInput,
    borderRadius: DOMUS_RADIUS.md,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DOMUS_SPACING.xs,
  },
  clienteNome: {
    ...DOMUS_TYPOGRAPHY.body,
    fontWeight: '700',
    color: DOMUS_COLORS.textDark,
    flex: 1,
    marginRight: DOMUS_SPACING.sm,
  },
  canalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: DOMUS_SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: DOMUS_RADIUS.sm,
  },
  canalBadgeText: {
    ...DOMUS_TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: DOMUS_COLORS.statusSuccess,
    marginLeft: 3,
  },
  clienteDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.textDark,
    marginLeft: 4,
  },
  observacaoText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.textDark,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: DOMUS_SPACING.xs,
  },
  imoveisBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.xs,
  },
  imoveisBadgeText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.mutedText,
    marginLeft: 4,
  },
  btnAgendarAtalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DOMUS_COLORS.primaryOrange,
    paddingVertical: DOMUS_SPACING.xs + 2,
    paddingHorizontal: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.sm,
    marginTop: DOMUS_SPACING.xs,
  },
  btnAgendarAtalhoText: {
    ...DOMUS_TYPOGRAPHY.caption,
    fontWeight: '700',
    color: DOMUS_COLORS.primaryButtonText,
    marginLeft: DOMUS_SPACING.xs,
  },
});
