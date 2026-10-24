import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { useDomus, DomusContextData } from '../context/DomusContext';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import { CanalContato, Cliente, Imovel } from '../types/domus';
import { formatarCpfCnpj, formatarMoedaBrl, formatarTelefone } from '../utils/formatters';
import {
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from '../utils/haptics';

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

function extrairIniciais(nome: string): string {
  if (!nome) return 'CL';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/* =========================================================================
   Componentes Extraidos e Otimizados com React.memo (Apple HIG 44pt Target)
   ========================================================================= */

interface CanalChipButtonProps {
  canal: CanalOption;
  selecionado: boolean;
  onPress: (id: CanalContato) => void;
}

export const CanalChipButton = React.memo<CanalChipButtonProps>(
  ({ canal, selecionado, onPress }) => {
    const handlePress = () => {
      triggerSelectionHaptic();
      onPress(canal.id);
    };

    return (
      <TouchableOpacity
        style={[
          styles.canalChip,
          selecionado && styles.canalChipSelected,
        ]}
        onPress={handlePress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        testID={`chip-canal-${canal.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: selecionado }}
        accessibilityLabel={`Canal ${canal.label}`}
      >
        <Ionicons
          name={canal.icon}
          size={15}
          color={selecionado ? '#C2410C' : '#475569'}
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
  }
);
CanalChipButton.displayName = 'CanalChipButton';

interface ImovelInteresseChipProps {
  imovel: Imovel;
  selecionado: boolean;
  onToggle: (id: number) => void;
}

export const ImovelInteresseChip = React.memo<ImovelInteresseChipProps>(
  ({ imovel, selecionado, onToggle }) => {
    const handlePress = () => {
      triggerSelectionHaptic();
      onToggle(imovel.id);
    };

    return (
      <TouchableOpacity
        style={[
          styles.imovelChip,
          selecionado && styles.imovelChipSelected,
        ]}
        onPress={handlePress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        testID={`chip-imovel-${imovel.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: selecionado }}
        accessibilityLabel={`Imovel ${imovel.tipoImovel} ${imovel.bairro || imovel.endereco}`}
      >
        <Ionicons
          name={selecionado ? 'checkbox' : 'square-outline'}
          size={18}
          color={selecionado ? DOMUS_THEME.primary : DOMUS_THEME.textMuted}
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
  }
);
ImovelInteresseChip.displayName = 'ImovelInteresseChip';

interface ClienteCardItemProps {
  cliente: Cliente;
  onAgendar: (cliente: Cliente) => void;
}

export const ClienteCardItem = React.memo<ClienteCardItemProps>(
  ({ cliente, onAgendar }) => {
    const imoveisVinculados = cliente.imoveisInteresse || [];
    const iniciais = extrairIniciais(cliente.nomeCompleto);

    return (
      <View
        style={styles.clienteCard}
        testID={`card-cliente-${cliente.id}`}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciais}</Text>
          </View>
          <View style={styles.cardHeaderTextColumn}>
            <Text style={styles.clienteNome} numberOfLines={1}>
              {cliente.nomeCompleto}
            </Text>
            <View style={styles.canalBadge}>
              <Ionicons
                name="chatbubble-ellipses"
                size={11}
                color={DOMUS_THEME.success}
              />
              <Text style={styles.canalBadgeText}>
                {cliente.canalPrincipalContato}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.clienteDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{cliente.telefone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="card-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{cliente.cpfDocumento}</Text>
          </View>
        </View>

        {cliente.email ? (
          <View style={styles.detailItemSingle}>
            <Ionicons name="mail-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{cliente.email}</Text>
          </View>
        ) : null}

        {cliente.observacoes ? (
          <View style={styles.obsContainer}>
            <Text style={styles.observacaoText} numberOfLines={2}>
              Obs: {cliente.observacoes}
            </Text>
          </View>
        ) : null}

        {imoveisVinculados.length > 0 ? (
          <View style={styles.imoveisBadgeRow}>
            <Ionicons name="home-outline" size={13} color={DOMUS_THEME.primary} />
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
          onPress={() => onAgendar(cliente)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          testID={`btn-agendar-cliente-${cliente.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Agendar Visita ou Retorno para ${cliente.nomeCompleto}`}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#C2410C"
          />
          <Text style={styles.btnAgendarAtalhoText}>
            Agendar Visita / Retorno
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);
ClienteCardItem.displayName = 'ClienteCardItem';

/* =========================================================================
   Tela Principal ClientesScreen
   ========================================================================= */

export const ClientesScreen: React.FC<ClientesScreenProps> = ({
  context,
  onAgendarCliente,
}) => {
  const domusHook = context ? null : useDomus();
  const domus = context || domusHook!;

  // Campos do formulario (fiel ao wireframe 01-cadastro-cliente.png)
  const [nomeCompleto, setNomeCompleto] = useState<string>('');
  const [cpfDocumento, setCpfDocumento] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Extensoes da Secao 4.2 do Diagnostico
  const [canalPrincipal, setCanalPrincipal] = useState<CanalContato>('WHATSAPP');
  const [observacoes, setObservacoes] = useState<string>('');
  const [imoveisInteresseIds, setImoveisInteresseIds] = useState<number[]>([]);

  // Filtro de busca na lista de clientes cadastrados
  const [busca, setBusca] = useState<string>('');

  // Estados de feedback e submissao
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [sucessoLocal, setSucessoLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [sucessoBotao, setSucessoBotao] = useState<boolean>(false);
  const timerSucessoRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerSucessoRef.current) {
        clearTimeout(timerSucessoRef.current);
        timerSucessoRef.current = null;
      }
    };
  }, []);

  const toggleImovelInteresse = useCallback((imovelId: number) => {
    setImoveisInteresseIds((prev) =>
      prev.includes(imovelId)
        ? prev.filter((id) => id !== imovelId)
        : [...prev, imovelId]
    );
  }, []);

  const handleCadastrarCliente = async () => {
    setErroLocal(null);
    setSucessoLocal(null);

    const nomeLimpo = nomeCompleto.trim();
    const cpfLimpo = cpfDocumento.trim();
    const telLimpo = telefone.trim();

    if (!nomeLimpo) {
      triggerErrorHaptic();
      setErroLocal('O campo nome Completo é obrigatório');
      return;
    }
    if (!cpfLimpo) {
      triggerErrorHaptic();
      setErroLocal('O campo CPF é obrigatório');
      return;
    }
    if (!telLimpo) {
      triggerErrorHaptic();
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
        imoveisInteresseIds:
          imoveisInteresseIds.length > 0 ? imoveisInteresseIds : undefined,
      });

      const mensagemSucesso = `[OK] Cliente "${novoCliente.nomeCompleto}" cadastrado com sucesso!`;
      setSucessoLocal(mensagemSucesso);
      setSucessoBotao(true);
      triggerSuccessHaptic();
      domus.mostrarToast?.(mensagemSucesso, 'sucesso');

      // Limpeza dos campos
      setNomeCompleto('');
      setCpfDocumento('');
      setTelefone('');
      setEmail('');
      setCanalPrincipal('WHATSAPP');
      setObservacoes('');
      setImoveisInteresseIds([]);

      if (timerSucessoRef.current) {
        clearTimeout(timerSucessoRef.current);
      }
      const timer = setTimeout(() => {
        setSucessoBotao(false);
      }, 2500);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
      timerSucessoRef.current = timer;
    } catch (err: any) {
      triggerErrorHaptic();
      const erroMsg = err.message || 'Erro ao cadastrar cliente';
      setErroLocal(erroMsg);
      domus.mostrarToast?.(`[ERRO] ${erroMsg}`, 'erro');
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

  const handleAgendarParaCliente = useCallback(
    (cliente: Cliente) => {
      if (onAgendarCliente) {
        onAgendarCliente(cliente);
      } else {
        domus.setAbaAtiva('Agendar');
      }
    },
    [onAgendarCliente, domus]
  );

  const keyExtractor = useCallback((item: Cliente) => String(item.id), []);

  const renderClienteItem = useCallback(
    ({ item }: { item: Cliente }) => (
      <ClienteCardItem cliente={item} onAgendar={handleAgendarParaCliente} />
    ),
    [handleAgendarParaCliente]
  );

  const handlePullToRefresh = useCallback(async () => {
    triggerSelectionHaptic();
    await domus.recarregarDados();
  }, [domus]);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="clientes-screen-scroll"
        refreshControl={
          <RefreshControl
            refreshing={domus.carregando}
            onRefresh={handlePullToRefresh}
            tintColor={DOMUS_THEME.primary}
            colors={[DOMUS_THEME.primary]}
          />
        }
      >
        <View style={styles.centerContainer}>
          {/* Banner de Feedback */}
          {erroLocal ? (
            <View style={styles.errorBox} testID="cliente-error-box" accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={DOMUS_THEME.danger} />
              <Text style={styles.errorText}>{erroLocal}</Text>
            </View>
          ) : null}

          {sucessoLocal ? (
            <View style={styles.successBox} testID="cliente-success-box">
              <Ionicons name="checkmark-circle" size={18} color={DOMUS_THEME.success} />
              <Text style={styles.successText}>{sucessoLocal}</Text>
            </View>
          ) : null}

          {/* Card: Cadastro de Cliente (fiel ao wireframe 01-cadastro-cliente.png) */}
          <View style={styles.formCard} testID="card-formulario-cliente">
            <View style={styles.titleHeader}>
              <View style={styles.formIconWrapper}>
                <Ionicons name="person-add" size={18} color={DOMUS_THEME.primary} />
              </View>
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

            {/* Secao 4.2 do Diagnostico: Canal Principal de Contato */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Canal Principal de Contato</Text>
              <View style={styles.canaisRow}>
                {CANAIS_CONTATO.map((canal) => (
                  <CanalChipButton
                    key={canal.id}
                    canal={canal}
                    selecionado={canalPrincipal === canal.id}
                    onPress={setCanalPrincipal}
                  />
                ))}
              </View>
            </View>

            {/* Campo Observacoes */}
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

            {/* Selecao de Imoveis de Interesse */}
            {domus.imoveis && domus.imoveis.length > 0 ? (
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Imóveis de Interesse</Text>
                <Text style={styles.fieldHelper}>
                  Selecione os imóveis para vincular ao interesse deste cliente:
                </Text>
                <View style={styles.imoveisChipsContainer}>
                  {domus.imoveis.map((imovel) => (
                    <ImovelInteresseChip
                      key={imovel.id}
                      imovel={imovel}
                      selecionado={imoveisInteresseIds.includes(imovel.id)}
                      onToggle={toggleImovelInteresse}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Botao Cadastrar fiel ao wireframe com estados integrados */}
            <DomusButton
              title="Cadastrar"
              variant="primary"
              loading={salvando}
              loadingLabel="Cadastrando..."
              success={sucessoBotao}
              successLabel="Cadastrado!"
              onPress={handleCadastrarCliente}
              testID="btn-cadastrar-cliente"
              style={styles.btnCadastrar}
            />
          </View>

          {/* Secao Inferior: Clientes Cadastrados com FlashList */}
          <View style={styles.listSection} testID="secao-clientes-cadastrados">
            <View style={styles.listHeaderRow}>
              <View style={styles.listTitleBox}>
                <View style={styles.listIconWrapper}>
                  <Ionicons name="people" size={18} color={DOMUS_THEME.primary} />
                </View>
                <Text style={styles.listTitle}>Clientes Cadastrados</Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>
                  {`${domus.clientes.length} ${domus.clientes.length === 1 ? 'cliente' : 'clientes'}`}
                </Text>
              </View>
            </View>

            {/* Barra de busca rapida */}
            <DomusInput
              placeholder="Buscar por nome, telefone ou CPF..."
              value={busca}
              onChangeText={setBusca}
              testID="input-busca-cliente"
              containerStyle={styles.buscaContainer}
            />

            {/* FlashList de Clientes */}
            <FlashList
              data={clientesFiltrados}
              renderItem={renderClienteItem}
              keyExtractor={keyExtractor}
              estimatedItemSize={148}
              testID="clientes-flash-list"
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
                </View>
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
  scrollContent: {
    padding: DOMUS_SPACING.md,
    paddingBottom: DOMUS_SPACING.xxl * 2,
  },
  centerContainer: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
    borderRadius: 12,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
  },
  errorText: {
    color: DOMUS_THEME.danger,
    fontSize: 13,
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOMUS_THEME.successSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.successBorder,
    borderRadius: 12,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
  },
  successText: {
    color: DOMUS_THEME.success,
    fontSize: 13,
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: DOMUS_SPACING.lg,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.md,
    gap: DOMUS_SPACING.sm,
  },
  formIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DOMUS_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  fieldSection: {
    marginBottom: DOMUS_SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 12,
    color: DOMUS_THEME.textMuted,
    marginBottom: 8,
  },
  canaisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  canalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  canalChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  canalChipText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    fontWeight: '600',
    marginLeft: 5,
  },
  canalChipTextSelected: {
    color: '#C2410C',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imoveisChipsContainer: {
    gap: 8,
  },
  imovelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    minHeight: 48,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  imovelChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  imovelChipInfo: {
    marginLeft: DOMUS_SPACING.sm,
    flex: 1,
  },
  imovelChipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textPrimary,
  },
  imovelChipTitleSelected: {
    color: '#C2410C',
    fontWeight: '700',
  },
  imovelChipSub: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
  },
  btnCadastrar: {
    marginTop: DOMUS_SPACING.sm,
    minHeight: 50,
  },
  listSection: {
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DOMUS_SPACING.md,
  },
  listTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOMUS_SPACING.sm,
  },
  listIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DOMUS_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  counterBadge: {
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DOMUS_RADIUS.pill,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DOMUS_THEME.textSecondary,
  },
  buscaContainer: {
    marginBottom: DOMUS_SPACING.md,
  },
  emptyCard: {
    padding: DOMUS_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: DOMUS_THEME.textMuted,
  },
  clienteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: DOMUS_SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DOMUS_SPACING.sm,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  cardHeaderTextColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: DOMUS_SPACING.xs,
  },
  canalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DOMUS_RADIUS.pill,
    gap: 3,
  },
  canalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  clienteDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOMUS_SPACING.md,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailItemSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    fontWeight: '500',
  },
  obsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  observacaoText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    fontStyle: 'italic',
  },
  imoveisBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 5,
  },
  imoveisBadgeText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    fontWeight: '500',
  },
  btnAgendarAtalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    minHeight: 44,
    paddingVertical: DOMUS_SPACING.xs,
    paddingHorizontal: DOMUS_SPACING.md,
    borderRadius: 10,
    gap: 6,
  },
  btnAgendarAtalhoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
});

export default ClientesScreen;
