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
import {
  Cliente,
  FinalidadeImovel,
  Imovel,
  StatusImovel,
  TipoImovel,
} from '../types/domus';
import { formatarMoedaBrl } from '../utils/formatters';
import {
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from '../utils/haptics';

export interface ImoveisScreenProps {
  context?: DomusContextData;
  onAgendarImovel?: (imovel: Imovel) => void;
}

interface OpcaoImovel<T> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TIPOS_IMOVEL: OpcaoImovel<TipoImovel>[] = [
  { id: 'CASA', label: 'Casa', icon: 'home-outline' },
  { id: 'APARTAMENTO', label: 'Apartamento', icon: 'business-outline' },
  { id: 'TERRENO', label: 'Terreno', icon: 'map-outline' },
  { id: 'COMERCIAL', label: 'Comercial', icon: 'storefront-outline' },
];

const FINALIDADES: OpcaoImovel<FinalidadeImovel>[] = [
  { id: 'VENDA', label: 'Venda', icon: 'pricetag-outline' },
  { id: 'ALUGUEL', label: 'Aluguel', icon: 'key-outline' },
  { id: 'AMBOS', label: 'Ambos', icon: 'swap-horizontal-outline' },
];

const STATUS_IMOVEL: OpcaoImovel<StatusImovel>[] = [
  { id: 'DISPONIVEL', label: 'Disponível', icon: 'checkmark-circle-outline' },
  { id: 'RESERVADO', label: 'Reservado', icon: 'time-outline' },
  { id: 'VENDIDO', label: 'Vendido', icon: 'close-circle-outline' },
  { id: 'ALUGADO', label: 'Alugado', icon: 'key-outline' },
  { id: 'INATIVO', label: 'Inativo', icon: 'pause-circle-outline' },
];

const LABEL_STATUS: Record<StatusImovel, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
  ALUGADO: 'Alugado',
  INATIVO: 'Inativo',
};

const COR_STATUS: Record<StatusImovel, string> = {
  DISPONIVEL: DOMUS_THEME.success,
  RESERVADO: DOMUS_THEME.warning,
  VENDIDO: DOMUS_THEME.danger,
  ALUGADO: DOMUS_THEME.info,
  INATIVO: DOMUS_THEME.textMuted,
};

const FUNDO_STATUS: Record<StatusImovel, string> = {
  DISPONIVEL: DOMUS_THEME.successSoft,
  RESERVADO: DOMUS_THEME.warningSoft,
  VENDIDO: DOMUS_THEME.dangerSoft,
  ALUGADO: DOMUS_THEME.infoSoft,
  INATIVO: DOMUS_THEME.surfaceSubtle,
};

const BORDA_STATUS: Record<StatusImovel, string> = {
  DISPONIVEL: DOMUS_THEME.successBorder,
  RESERVADO: DOMUS_THEME.warningBorder,
  VENDIDO: DOMUS_THEME.dangerBorder,
  ALUGADO: DOMUS_THEME.infoBorder,
  INATIVO: DOMUS_THEME.border,
};

function extrairIniciais(nome: string): string {
  if (!nome) return 'IM';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarValorInput(texto: string): string {
  const numeros = texto.replace(/\D/g, '');
  if (!numeros) return '';
  return formatarMoedaBrl(Number(numeros) / 100);
}

function parsearValor(texto: string): number | undefined {
  const numeros = texto.replace(/\D/g, '');
  if (!numeros) return undefined;
  return Number(numeros) / 100;
}

function parsearInteiro(texto: string): number | undefined {
  const numeros = texto.replace(/\D/g, '');
  if (!numeros) return undefined;
  return Number(numeros);
}

interface OpcaoChipProps<T> {
  opcao: OpcaoImovel<T>;
  selecionado: boolean;
  onPress: (id: T) => void;
  testIDPrefix: string;
}

function OpcaoChip<T extends string>({
  opcao,
  selecionado,
  onPress,
  testIDPrefix,
}: OpcaoChipProps<T>) {
  const handlePress = () => {
    triggerSelectionHaptic();
    onPress(opcao.id);
  };

  return (
    <TouchableOpacity
      style={[styles.canalChip, selecionado && styles.canalChipSelected]}
      onPress={handlePress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      testID={`${testIDPrefix}-${opcao.id}`}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={`Opção ${opcao.label}`}
    >
      <Ionicons
        name={opcao.icon}
        size={15}
        color={selecionado ? '#C2410C' : '#475569'}
      />
      <Text
        style={[
          styles.canalChipText,
          selecionado && styles.canalChipTextSelected,
        ]}
      >
        {opcao.label}
      </Text>
    </TouchableOpacity>
  );
}

interface ProprietarioChipProps {
  cliente: Cliente;
  selecionado: boolean;
  onToggle: (id: number) => void;
}

export const ProprietarioChip = React.memo<ProprietarioChipProps>(
  ({ cliente, selecionado, onToggle }) => {
    const handlePress = () => {
      triggerSelectionHaptic();
      onToggle(cliente.id);
    };

    return (
      <TouchableOpacity
        style={[
          styles.imovelChip,
          selecionado && styles.imovelChipSelected,
        ]}
        onPress={handlePress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        testID={`chip-proprietario-${cliente.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: selecionado }}
        accessibilityLabel={`Proprietário ${cliente.nomeCompleto}`}
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
            {cliente.nomeCompleto}
          </Text>
          <Text style={styles.imovelChipSub}>
            {cliente.telefone}
            {cliente.cpfDocumento ? ` • ${cliente.cpfDocumento}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);
ProprietarioChip.displayName = 'ProprietarioChip';

interface ImovelCardItemProps {
  imovel: Imovel;
  onAgendar: (imovel: Imovel) => void;
}

export const ImovelCardItem = React.memo<ImovelCardItemProps>(
  ({ imovel, onAgendar }) => {
    const proprietario = imovel.proprietario || null;
    const iniciais = extrairIniciais(proprietario?.nomeCompleto || imovel.tipoImovel);
    const localizacao = imovel.bairro || imovel.endereco || 'Sem endereço';
    const status = imovel.statusImovel;

    return (
      <View style={styles.clienteCard} testID={`card-imovel-${imovel.id}`}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciais}</Text>
          </View>
          <View style={styles.cardHeaderTextColumn}>
            <Text style={styles.clienteNome} numberOfLines={1}>
              {imovel.tipoImovel} - {localizacao}
            </Text>
            <View
              style={[
                styles.canalBadge,
                {
                  backgroundColor: FUNDO_STATUS[status],
                  borderColor: BORDA_STATUS[status],
                },
              ]}
            >
              <Ionicons
                name="ellipse"
                size={7}
                color={COR_STATUS[status]}
              />
              <Text
                style={[styles.canalBadgeText, { color: COR_STATUS[status] }]}
              >
                {LABEL_STATUS[status]}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.clienteDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {imovel.endereco}
              {imovel.numero ? `, ${imovel.numero}` : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{formatarMoedaBrl(imovel.valor)}</Text>
          </View>
        </View>

        {imovel.numeroInscricao ? (
          <View style={styles.detailItemSingle}>
            <Ionicons name="document-text-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{imovel.numeroInscricao}</Text>
          </View>
        ) : null}

        <View style={styles.clienteDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="layers-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>
              {`${imovel.areaTotal ? `${imovel.areaTotal} m² • ` : ''}${imovel.comodos ?? 0} com. • ${imovel.banheiros ?? 0} ban.`}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.detailText}>{imovel.finalidade}</Text>
          </View>
        </View>

        {proprietario ? (
          <View style={styles.obsContainer}>
            <Text style={styles.observacaoText} numberOfLines={1}>
              Proprietário: {proprietario.nomeCompleto}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.btnAgendarAtalho}
          onPress={() => onAgendar(imovel)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          testID={`btn-agendar-imovel-${imovel.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Agendar Visita para ${imovel.tipoImovel} ${localizacao}`}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#C2410C"
          />
          <Text style={styles.btnAgendarAtalhoText}>
            Agendar Visita
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);
ImovelCardItem.displayName = 'ImovelCardItem';

/* =========================================================================
   Tela Principal ImoveisScreen
   ========================================================================= */

export const ImoveisScreen: React.FC<ImoveisScreenProps> = ({
  context,
  onAgendarImovel,
}) => {
  const domusHook = context ? null : useDomus();
  const domus = context || domusHook!;

  // Campos do formulario de imovel
  const [numeroInscricao, setNumeroInscricao] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [bairro, setBairro] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [complemento, setComplemento] = useState<string>('');
  const [areaTotal, setAreaTotal] = useState<string>('');
  const [comodos, setComodos] = useState<string>('');
  const [banheiros, setBanheiros] = useState<string>('');
  const [valor, setValor] = useState<string>('');

  const [tipoImovel, setTipoImovel] = useState<TipoImovel>('CASA');
  const [finalidade, setFinalidade] = useState<FinalidadeImovel>('VENDA');
  const [statusImovel, setStatusImovel] = useState<StatusImovel>('DISPONIVEL');
  const [proprietarioId, setProprietarioId] = useState<number | null>(null);

  // Filtro de busca na lista de imoveis cadastrados
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

  const toggleProprietario = useCallback((clienteId: number) => {
    setProprietarioId((prev) => (prev === clienteId ? null : clienteId));
  }, []);

  const handleCadastrarImovel = async () => {
    setErroLocal(null);
    setSucessoLocal(null);

    const enderecoLimpo = endereco.trim();

    if (!enderecoLimpo) {
      triggerErrorHaptic();
      setErroLocal('O campo Endereço é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      const novoImovel = await domus.criarImovel({
        numeroInscricao: numeroInscricao.trim() || undefined,
        tipoImovel,
        finalidade,
        endereco: enderecoLimpo,
        bairro: bairro.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        areaTotal: parsearInteiro(areaTotal),
        comodos: parsearInteiro(comodos),
        banheiros: parsearInteiro(banheiros),
        valor: parsearValor(valor),
        statusImovel,
        proprietarioId: proprietarioId ?? undefined,
      });

      const mensagemSucesso = `[OK] Imóvel "${novoImovel.tipoImovel} - ${
        novoImovel.bairro || novoImovel.endereco
      }" cadastrado com sucesso!`;
      setSucessoLocal(mensagemSucesso);
      setSucessoBotao(true);
      triggerSuccessHaptic();
      domus.mostrarToast?.(mensagemSucesso, 'sucesso');

      // Limpeza dos campos
      setNumeroInscricao('');
      setEndereco('');
      setBairro('');
      setNumero('');
      setComplemento('');
      setAreaTotal('');
      setComodos('');
      setBanheiros('');
      setValor('');
      setTipoImovel('CASA');
      setFinalidade('VENDA');
      setStatusImovel('DISPONIVEL');
      setProprietarioId(null);

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
      const erroMsg = err.message || 'Erro ao cadastrar imóvel';
      setErroLocal(erroMsg);
      domus.mostrarToast?.(`[ERRO] ${erroMsg}`, 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const imoveisFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return domus.imoveis;
    }
    const termo = busca.toLowerCase().trim();
    return domus.imoveis.filter((i) => {
      const tipoMatch = i.tipoImovel.toLowerCase().includes(termo);
      const enderecoMatch = i.endereco?.toLowerCase().includes(termo);
      const bairroMatch = i.bairro?.toLowerCase().includes(termo);
      const inscricaoMatch = i.numeroInscricao?.toLowerCase().includes(termo);
      const proprietarioMatch = i.proprietario?.nomeCompleto
        .toLowerCase()
        .includes(termo);
      const valorMatch = String(i.valor ?? '').includes(termo);
      return (
        tipoMatch ||
        enderecoMatch ||
        bairroMatch ||
        inscricaoMatch ||
        proprietarioMatch ||
        valorMatch
      );
    });
  }, [domus.imoveis, busca]);

  const handleAgendarParaImovel = useCallback(
    (imovel: Imovel) => {
      if (onAgendarImovel) {
        onAgendarImovel(imovel);
      } else {
        domus.setAbaAtiva('Agendar');
      }
    },
    [onAgendarImovel, domus]
  );

  const keyExtractor = useCallback((item: Imovel) => String(item.id), []);

  const renderImovelItem = useCallback(
    ({ item }: { item: Imovel }) => (
      <ImovelCardItem imovel={item} onAgendar={handleAgendarParaImovel} />
    ),
    [handleAgendarParaImovel]
  );

  const handlePullToRefresh = useCallback(async () => {
    triggerSelectionHaptic();
    await domus.recarregarDados();
  }, [domus]);

  return (
    <View style={styles.safeArea} testID="imoveis-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="imoveis-screen-scroll"
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
            <View style={styles.errorBox} testID="imovel-error-box" accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={DOMUS_THEME.danger} />
              <Text style={styles.errorText}>{erroLocal}</Text>
            </View>
          ) : null}

          {sucessoLocal ? (
            <View style={styles.successBox} testID="imovel-success-box">
              <Ionicons name="checkmark-circle" size={18} color={DOMUS_THEME.success} />
              <Text style={styles.successText}>{sucessoLocal}</Text>
            </View>
          ) : null}

          {/* Card: Cadastro de Imovel */}
          <View style={styles.formCard} testID="card-formulario-imovel">
            <View style={styles.titleHeader}>
              <View style={styles.formIconWrapper}>
                <Ionicons name="home" size={18} color={DOMUS_THEME.primary} />
              </View>
              <Text style={styles.title} testID="titulo-cadastro-imovel">
                Cadastro de Imóvel
              </Text>
            </View>

            {/* Campo 1: Numero de Inscricao */}
            <DomusInput
              label="Número de Inscrição"
              placeholder="JP-MAN-2026-01"
              value={numeroInscricao}
              onChangeText={(text) => {
                setNumeroInscricao(text);
                setErroLocal(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              testID="input-imovel-numero-inscricao"
            />

            {/* Campo 2: Endereco */}
            <DomusInput
              label="Endereço"
              placeholder="Rua, Avenida, número..."
              value={endereco}
              onChangeText={(text) => {
                setEndereco(text);
                setErroLocal(null);
              }}
              testID="input-imovel-endereco"
            />

            {/* Campo 3: Bairro */}
            <DomusInput
              label="Bairro"
              placeholder="Bairro do imóvel"
              value={bairro}
              onChangeText={(text) => {
                setBairro(text);
                setErroLocal(null);
              }}
              testID="input-imovel-bairro"
            />

            {/* Campo 4: Numero */}
            <DomusInput
              label="Número"
              placeholder="Número do imóvel"
              value={numero}
              onChangeText={(text) => {
                setNumero(text);
                setErroLocal(null);
              }}
              keyboardType="numeric"
              testID="input-imovel-numero"
            />

            {/* Campo 5: Complemento */}
            <DomusInput
              label="Complemento"
              placeholder="Bloco, apartamento, referência..."
              value={complemento}
              onChangeText={setComplemento}
              testID="input-imovel-complemento"
            />

            {/* Campo 6: Valor */}
            <DomusInput
              label="Valor"
              placeholder="R$ 0,00"
              value={valor}
              onChangeText={(text) => {
                setValor(formatarValorInput(text));
                setErroLocal(null);
              }}
              keyboardType="numeric"
              testID="input-imovel-valor"
            />

            {/* Campos 7, 8 e 9: Area, Comodos e Banheiros */}
            <DomusInput
              label="Área Total (m²)"
              placeholder="Ex: 120"
              value={areaTotal}
              onChangeText={(text) => setAreaTotal(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              testID="input-imovel-area"
            />

            <DomusInput
              label="Cômodos"
              placeholder="Ex: 3"
              value={comodos}
              onChangeText={(text) => setComodos(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              testID="input-imovel-comodos"
            />

            <DomusInput
              label="Banheiros"
              placeholder="Ex: 2"
              value={banheiros}
              onChangeText={(text) => setBanheiros(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              testID="input-imovel-banheiros"
            />

            {/* Tipo do Imovel */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Tipo do Imóvel</Text>
              <View style={styles.canaisRow}>
                {TIPOS_IMOVEL.map((opcao) => (
                  <OpcaoChip
                    key={opcao.id}
                    opcao={opcao}
                    selecionado={tipoImovel === opcao.id}
                    onPress={setTipoImovel}
                    testIDPrefix="chip-tipo"
                  />
                ))}
              </View>
            </View>

            {/* Finalidade */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Finalidade</Text>
              <View style={styles.canaisRow}>
                {FINALIDADES.map((opcao) => (
                  <OpcaoChip
                    key={opcao.id}
                    opcao={opcao}
                    selecionado={finalidade === opcao.id}
                    onPress={setFinalidade}
                    testIDPrefix="chip-finalidade"
                  />
                ))}
              </View>
            </View>

            {/* Status do Imovel */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Status do Imóvel</Text>
              <View style={styles.canaisRow}>
                {STATUS_IMOVEL.map((opcao) => (
                  <OpcaoChip
                    key={opcao.id}
                    opcao={opcao}
                    selecionado={statusImovel === opcao.id}
                    onPress={setStatusImovel}
                    testIDPrefix="chip-status"
                  />
                ))}
              </View>
            </View>

            {/* Selecao do Proprietario */}
            {domus.clientes && domus.clientes.length > 0 ? (
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Proprietário</Text>
                <Text style={styles.fieldHelper}>
                  Selecione o cliente proprietário deste imóvel:
                </Text>
                <View style={styles.imoveisChipsContainer}>
                  {domus.clientes.map((cliente) => (
                    <ProprietarioChip
                      key={cliente.id}
                      cliente={cliente}
                      selecionado={proprietarioId === cliente.id}
                      onToggle={toggleProprietario}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Botao Cadastrar */}
            <DomusButton
              title="Cadastrar"
              variant="primary"
              loading={salvando}
              loadingLabel="Cadastrando..."
              success={sucessoBotao}
              successLabel="Cadastrado!"
              onPress={handleCadastrarImovel}
              testID="btn-cadastrar-imovel"
              style={styles.btnCadastrar}
            />
          </View>

          {/* Secao Inferior: Imoveis Cadastrados com FlashList */}
          <View style={styles.listSection} testID="secao-imoveis-cadastrados">
            <View style={styles.listHeaderRow}>
              <View style={styles.listTitleBox}>
                <View style={styles.listIconWrapper}>
                  <Ionicons name="home" size={18} color={DOMUS_THEME.primary} />
                </View>
                <Text style={styles.listTitle}>Imóveis Cadastrados</Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>
                  {`${domus.imoveis.length} ${domus.imoveis.length === 1 ? 'imóvel' : 'imóveis'}`}
                </Text>
              </View>
            </View>

            {/* Barra de busca rapida */}
            <DomusInput
              placeholder="Buscar por tipo, endereço, bairro ou inscrição..."
              value={busca}
              onChangeText={setBusca}
              testID="input-busca-imovel"
              containerStyle={styles.buscaContainer}
            />

            {/* FlashList de Imoveis */}
            <FlashList
              data={imoveisFiltrados}
              renderItem={renderImovelItem}
              keyExtractor={keyExtractor}
              estimatedItemSize={180}
              testID="imoveis-flash-list"
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nenhum imóvel encontrado.</Text>
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

export default ImoveisScreen;