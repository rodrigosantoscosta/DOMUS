import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DomusInput } from '../components/DomusInput';
import { DomusToast } from '../components/DomusToast';
import DomusContext, { DomusContextData } from '../context/DomusContext';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import {
  Agendamento,
  Cliente,
  CreateAgendamentoInput,
  Imovel,
  TipoAgendamento,
} from '../types/domus';
import { formatarMoedaBrl, formatarTelefone } from '../utils/formatters';
import {
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
  triggerLightImpact,
} from '../utils/haptics';

const domusLogo = require('../../assets/logo.png');

const DEFAULT_CONTEXT_FALLBACK: DomusContextData = {
  usuario: null,
  abaAtiva: 'Agendar',
  setAbaAtiva: () => {},
  clientes: [],
  imoveis: [],
  agendamentos: [],
  visaoGeral: null,
  avisos: null,
  bannerVisivel: false,
  fecharBanner: () => {},
  modoOffline: true,
  carregando: false,
  erro: null,
  login: async () => ({} as any),
  logout: async () => {},
  recarregarDados: async () => {},
  resetarDemo: async () => {},
  criarCliente: async () => ({} as any),
  criarImovel: async () => ({} as any),
  criarAgendamento: async () => ({} as any),
  programarRetorno: async () => ({} as any),
  concluirAgendamento: async () => ({} as any),
  sincronizarGoogleCalendar: async () => ({} as any),
  cadastrarUsuario: async () => ({} as any),
  configurarModo: async () => {},
};

export interface AgendarScreenProps {
  context?: DomusContextData;
  clientePreSelecionadoId?: number;
  imovelPreSelecionadoId?: number;
  onAgendamentoCriado?: (agendamento: Agendamento) => void;
}

interface TipoOpcao {
  id: TipoAgendamento;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  descricao: string;
}

const TIPOS_AGENDAMENTO: TipoOpcao[] = [
  {
    id: 'VISITA',
    label: 'Visita',
    icon: 'location-outline',
    descricao: 'Imóvel obrigatório (RN08)',
  },
  {
    id: 'RETORNO',
    label: 'Retorno',
    icon: 'repeat-outline',
    descricao: 'Acompanhamento do cliente',
  },
  {
    id: 'ATENDIMENTO',
    label: 'Atendimento',
    icon: 'chatbubbles-outline',
    descricao: 'Reunião ou contato geral',
  },
];

export const AgendarScreen: React.FC<AgendarScreenProps> = ({
  context,
  clientePreSelecionadoId,
  imovelPreSelecionadoId,
  onAgendamentoCriado,
}) => {
  // Obtencao segura do contexto Domus (com fallback gracioso caso renderizado sem Provider)
  const contextFromHook = React.useContext(DomusContext);
  const domus = context || contextFromHook || DEFAULT_CONTEXT_FALLBACK;

  const clientesDisponiveis = domus?.clientes || [];
  const imoveisDisponiveis = domus?.imoveis || [];

  // Estados principais do formulario
  const [tipo, setTipo] = useState<TipoAgendamento>('VISITA');
  const [clienteId, setClienteId] = useState<number | null>(clientePreSelecionadoId ?? null);
  const [imovelId, setImovelId] = useState<number | null>(imovelPreSelecionadoId ?? null);
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [hora, setHora] = useState<string>('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<string>('60');
  const [proximaAcao, setProximaAcao] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [sincronizarGoogleCalendar, setSincronizarGoogleCalendar] = useState<boolean>(false);

  // Estados de busca e selecao
  const [buscaCliente, setBuscaCliente] = useState<string>('');
  const [buscaImovel, setBuscaImovel] = useState<string>('');
  const [mostrarListaClientes, setMostrarListaClientes] = useState<boolean>(!clientePreSelecionadoId);
  const [mostrarListaImoveis, setMostrarListaImoveis] = useState<boolean>(!imovelPreSelecionadoId);

  // Estados de feedback e submissao
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [sucessoLocal, setSucessoLocal] = useState<string | null>(null);
  const [toastLocal, setToastLocal] = useState<{
    visivel: boolean;
    mensagem: string | null;
    tipo: 'sucesso' | 'erro' | 'info';
  }>({
    visivel: false,
    mensagem: null,
    tipo: 'info',
  });

  // Atualiza selecoes iniciais se as props mudarem
  useEffect(() => {
    if (clientePreSelecionadoId !== undefined) {
      setClienteId(clientePreSelecionadoId);
      setMostrarListaClientes(false);
    }
  }, [clientePreSelecionadoId]);

  useEffect(() => {
    if (imovelPreSelecionadoId !== undefined) {
      setImovelId(imovelPreSelecionadoId);
      setMostrarListaImoveis(false);
    }
  }, [imovelPreSelecionadoId]);

  // Cliente selecionado no estado
  const clienteSelecionado = useMemo(() => {
    if (!clienteId) return null;
    return clientesDisponiveis.find((c) => c.id === clienteId) || null;
  }, [clienteId, clientesDisponiveis]);

  // Imovel selecionado no estado
  const imovelSelecionado = useMemo(() => {
    if (!imovelId) return null;
    return imoveisDisponiveis.find((i) => i.id === imovelId) || null;
  }, [imovelId, imoveisDisponiveis]);

  // Conjunto de IDs de imoveis de interesse do cliente selecionado
  const idsImoveisInteresseCliente = useMemo<Set<number>>(() => {
    if (!clienteSelecionado) return new Set();
    const ids = new Set<number>();
    if (Array.isArray(clienteSelecionado.imoveisInteresse)) {
      clienteSelecionado.imoveisInteresse.forEach((imv) => ids.add(imv.id));
    }
    return ids;
  }, [clienteSelecionado]);

  // Lista filtrada de clientes
  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();
    if (!termo) return clientesDisponiveis;
    return clientesDisponiveis.filter((c) => {
      const nomeMatch = c.nomeCompleto?.toLowerCase().includes(termo);
      const cpfMatch = c.cpfDocumento?.toLowerCase().includes(termo);
      const telMatch = c.telefone?.toLowerCase().includes(termo);
      return nomeMatch || cpfMatch || telMatch;
    });
  }, [buscaCliente, clientesDisponiveis]);

  // Lista filtrada e ordenada de imoveis (com destaque para interesses no topo)
  const imoveisFiltrados = useMemo(() => {
    const termo = buscaImovel.trim().toLowerCase();
    const filtrados = imoveisDisponiveis.filter((i) => {
      if (!termo) return true;
      const endMatch = i.endereco?.toLowerCase().includes(termo);
      const bairroMatch = i.bairro?.toLowerCase().includes(termo);
      const inscMatch = i.numeroInscricao?.toLowerCase().includes(termo);
      const tipoMatch = i.tipoImovel?.toLowerCase().includes(termo);
      return endMatch || bairroMatch || inscMatch || tipoMatch;
    });

    // Ordenacao prioritaria: imoveis de interesse do cliente selecionado sobem
    return filtrados.sort((a, b) => {
      const aInteresse = idsImoveisInteresseCliente.has(a.id) ? 1 : 0;
      const bInteresse = idsImoveisInteresseCliente.has(b.id) ? 1 : 0;
      return bInteresse - aInteresse;
    });
  }, [buscaImovel, imoveisDisponiveis, idsImoveisInteresseCliente]);

  const handleSelecionarTipo = useCallback((novoTipo: TipoAgendamento) => {
    triggerSelectionHaptic();
    setTipo(novoTipo);
    setErroLocal(null);
  }, []);

  const handleSelecionarCliente = useCallback((c: Cliente) => {
    triggerSelectionHaptic();
    setClienteId(c.id);
    setMostrarListaClientes(false);
    setErroLocal(null);

    // Sugere titulo inteligente caso ainda esteja em branco
    setTitulo((prev) => {
      if (!prev.trim()) {
        return `Atendimento com ${c.nomeCompleto}`;
      }
      return prev;
    });
  }, []);

  const handleTrocarCliente = useCallback(() => {
    triggerLightImpact();
    setMostrarListaClientes(true);
  }, []);

  const handleSelecionarImovel = useCallback((imv: Imovel) => {
    triggerSelectionHaptic();
    setImovelId(imv.id);
    setMostrarListaImoveis(false);
    setErroLocal(null);

    // Se o tipo for visita e o titulo tiver sugestao padrao, aprimora
    setTitulo((prev) => {
      if (!prev.trim() || prev.startsWith('Atendimento') || prev.startsWith('Visita')) {
        const parteBairro = imv.bairro ? ` - ${imv.bairro}` : '';
        return `Visita ao imóvel (${imv.tipoImovel}${parteBairro})`;
      }
      return prev;
    });
  }, []);

  const handleTrocarImovel = useCallback(() => {
    triggerLightImpact();
    setMostrarListaImoveis(true);
  }, []);

  const handleToggleGoogleCalendar = useCallback(() => {
    triggerSelectionHaptic();
    setSincronizarGoogleCalendar((prev) => !prev);
  }, []);

  const handleSubmeterAgendamento = useCallback(async () => {
    setErroLocal(null);
    setSucessoLocal(null);

    const tituloLimpo = titulo.trim();

    // Validacao basica de titulo
    if (!tituloLimpo) {
      const msg = 'O título do agendamento é obrigatório';
      setErroLocal(msg);
      domus?.mostrarToast?.(msg, 'erro');
      setToastLocal({ visivel: true, mensagem: msg, tipo: 'erro' });
      triggerErrorHaptic();
      return;
    }

    // Regra RN10: Cliente obrigatorio
    if (!clienteId) {
      const msg = 'Cliente é obrigatório para criar o agendamento (RN10)';
      setErroLocal(msg);
      domus?.mostrarToast?.(msg, 'erro');
      setToastLocal({ visivel: true, mensagem: msg, tipo: 'erro' });
      triggerErrorHaptic();
      return;
    }

    // Regra RN08: Imovel obrigatorio em visita
    if (tipo === 'VISITA' && !imovelId) {
      const msg =
        'Para agendar uma visita (tipo VISITA), é obrigatório selecionar um imóvel cadastrado (RN08)';
      setErroLocal(msg);
      domus?.mostrarToast?.(msg, 'erro');
      setToastLocal({ visivel: true, mensagem: msg, tipo: 'erro' });
      triggerErrorHaptic();
      return;
    }

    // Regra RN08: Data e hora obrigatorias em visita
    if (tipo === 'VISITA' && (!data.trim() || !hora.trim())) {
      const msg =
        'Para agendar uma visita (tipo VISITA), é obrigatório informar a data e hora do compromisso (RN08)';
      setErroLocal(msg);
      domus?.mostrarToast?.(msg, 'erro');
      setToastLocal({ visivel: true, mensagem: msg, tipo: 'erro' });
      triggerErrorHaptic();
      return;
    }

    const duracaoNum = parseInt(duracaoMinutos, 10);
    const duracaoFinal = !isNaN(duracaoNum) && duracaoNum > 0 ? duracaoNum : 60;

    const inputAgendamento: CreateAgendamentoInput = {
      titulo: tituloLimpo,
      descricao: descricao.trim() || undefined,
      tipo,
      status: 'PENDENTE',
      clienteId,
      imovelId: imovelId || undefined,
      data: data.trim() || undefined,
      hora: hora.trim() || undefined,
      duracaoMinutos: duracaoFinal,
      proximaAcao: proximaAcao.trim() || undefined,
      observacao: observacoes.trim() || undefined,
      sincronizarGoogleCalendar,
    };

    try {
      setSalvando(true);
      const novo = await domus.criarAgendamento(inputAgendamento);

      const msgSucesso = 'Agendamento criado com sucesso!';
      setSucessoLocal(msgSucesso);
      domus?.mostrarToast?.(msgSucesso, 'sucesso');
      setToastLocal({ visivel: true, mensagem: msgSucesso, tipo: 'sucesso' });
      triggerSuccessHaptic();

      // Limpeza do formulario
      setTitulo('');
      setDescricao('');
      setData('');
      setHora('');
      setDuracaoMinutos('60');
      setProximaAcao('');
      setObservacoes('');
      setSincronizarGoogleCalendar(false);

      if (!clientePreSelecionadoId) {
        setClienteId(null);
        setMostrarListaClientes(true);
      }
      if (!imovelPreSelecionadoId) {
        setImovelId(null);
        setMostrarListaImoveis(true);
      }

      onAgendamentoCriado?.(novo);
    } catch (err: any) {
      const msgFalha = err.message || 'Erro ao criar agendamento';
      setErroLocal(msgFalha);
      domus?.mostrarToast?.(msgFalha, 'erro');
      setToastLocal({ visivel: true, mensagem: msgFalha, tipo: 'erro' });
      triggerErrorHaptic();
    } finally {
      setSalvando(false);
    }
  }, [
    titulo,
    tipo,
    clienteId,
    imovelId,
    data,
    hora,
    duracaoMinutos,
    descricao,
    proximaAcao,
    observacoes,
    sincronizarGoogleCalendar,
    domus,
    clientePreSelecionadoId,
    imovelPreSelecionadoId,
    onAgendamentoCriado,
  ]);

  return (
    <View style={styles.container} testID="agendar-screen">
      <ScrollView
        testID="agendar-scroll-view"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Topo Visual: Imagem Logo DOMUS e Titulo (fiel ao wireframe 02) */}
        <View style={styles.headerHero}>
          <Image
            source={domusLogo}
            style={styles.logo}
            resizeMode="contain"
            testID="agendar-logo"
            accessibilityRole="image"
            accessibilityLabel="Logo DOMUS"
          />
          <View style={styles.headerHeroTexts}>
            <Text style={styles.headerHeroTitle}>Criar seu Agendamento</Text>
            <Text style={styles.headerHeroSubtitle}>
              Organize visitas, retornos e atendimentos de forma estruturada
            </Text>
          </View>
        </View>

        {/* Feedback Inline Nao-Bloqueante (Erro ou Sucesso) */}
        {erroLocal ? (
          <View style={styles.bannerErro} testID="banner-erro-agendamento">
            <Ionicons name="alert-circle-outline" size={18} color={DOMUS_THEME.danger} />
            <Text style={styles.bannerErroTexto}>{erroLocal}</Text>
          </View>
        ) : null}

        {sucessoLocal ? (
          <View style={styles.bannerSucesso} testID="banner-sucesso-agendamento">
            <Ionicons name="checkmark-circle-outline" size={18} color={DOMUS_THEME.success} />
            <Text style={styles.bannerSucessoTexto}>{sucessoLocal}</Text>
          </View>
        ) : null}

        {/* Seletor de Tipo com Pressable e Escala Tatil (VISITA, RETORNO, ATENDIMENTO) */}
        <View style={styles.cardSecao}>
          <Text style={styles.secaoTitulo}>Tipo de Compromisso</Text>
          <View style={styles.tiposRow}>
            {TIPOS_AGENDAMENTO.map((item) => {
              const selecionado = tipo === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={`tipo-selector-${item.id.toLowerCase()}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                  accessibilityLabel={`Selecionar tipo ${item.label}`}
                  onPress={() => handleSelecionarTipo(item.id)}
                  style={({ pressed }) => [
                    styles.tipoOption,
                    selecionado && styles.tipoOptionSelected,
                    pressed && styles.pressedScale,
                  ]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={selecionado ? DOMUS_THEME.primary : DOMUS_THEME.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tipoOptionLabel,
                      selecionado && styles.tipoOptionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.tipoHelperText}>
            {TIPOS_AGENDAMENTO.find((t) => t.id === tipo)?.descricao}
          </Text>
        </View>

        {/* Selecao de Cliente com Busca e Obrigacao RN10 */}
        <View style={styles.cardSecao}>
          <View style={styles.secaoHeaderRow}>
            <Text style={styles.secaoTitulo}>Cliente (RN10)</Text>
            <View style={styles.badgeObrigatorio}>
              <Text style={styles.badgeObrigatorioText}>Obrigatório</Text>
            </View>
          </View>

          {clienteSelecionado && !mostrarListaClientes ? (
            <View style={styles.entidadeSelecionadaCard}>
              <View style={styles.entidadeInfoCol}>
                <Text style={styles.entidadeNome} numberOfLines={1}>
                  {clienteSelecionado.nomeCompleto}
                </Text>
                <Text style={styles.entidadeDetalhe}>
                  {formatarTelefone(clienteSelecionado.telefone)} | {clienteSelecionado.canalPrincipalContato}
                </Text>
                {clienteSelecionado.cpfDocumento ? (
                  <Text style={styles.entidadeSubdetalhe}>
                    Doc: {clienteSelecionado.cpfDocumento}
                  </Text>
                ) : null}
              </View>
              <Pressable
                testID="btn-trocar-cliente"
                onPress={handleTrocarCliente}
                style={({ pressed }) => [
                  styles.btnTrocarEntidade,
                  pressed && styles.pressedScale,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Trocar cliente selecionado"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="swap-horizontal" size={14} color={DOMUS_THEME.primary} />
                <Text style={styles.btnTrocarEntidadeText}>Trocar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buscaContainer}>
              <DomusInput
                testID="input-busca-cliente"
                placeholder="Buscar cliente por nome ou CPF..."
                value={buscaCliente}
                onChangeText={setBuscaCliente}
                containerStyle={styles.inputBuscaContainer}
              />
              <View style={styles.listaSelecaoContainer}>
                {clientesFiltrados.length === 0 ? (
                  <Text style={styles.listaVaziaTexto}>Nenhum cliente encontrado</Text>
                ) : (
                  clientesFiltrados.slice(0, 5).map((c) => {
                    const isSelected = clienteId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        testID={`cliente-item-${c.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar cliente ${c.nomeCompleto}`}
                        onPress={() => handleSelecionarCliente(c)}
                        style={({ pressed }) => [
                          styles.itemListaSelecao,
                          isSelected && styles.itemListaSelecaoActive,
                          pressed && styles.pressedScale,
                        ]}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <View style={styles.itemAvatar}>
                          <Text style={styles.itemAvatarText}>
                            {c.nomeCompleto.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.itemListaTextCol}>
                          <Text style={styles.itemListaNome}>{c.nomeCompleto}</Text>
                          <Text style={styles.itemListaSub}>
                            {formatarTelefone(c.telefone)} • {c.canalPrincipalContato}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                          size={18}
                          color={isSelected ? DOMUS_THEME.primary : DOMUS_THEME.textMuted}
                        />
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>

        {/* Selecao de Imovel com Busca, Destaque para Interesses e RN08 */}
        <View style={styles.cardSecao}>
          <View style={styles.secaoHeaderRow}>
            <Text style={styles.secaoTitulo}>Imóvel {tipo === 'VISITA' ? '(RN08)' : ''}</Text>
            {tipo === 'VISITA' ? (
              <View style={styles.badgeObrigatorio}>
                <Text style={styles.badgeObrigatorioText}>Obrigatório em Visita</Text>
              </View>
            ) : (
              <View style={styles.badgeOpcional}>
                <Text style={styles.badgeOpcionalText}>Opcional</Text>
              </View>
            )}
          </View>

          {imovelSelecionado && !mostrarListaImoveis ? (
            <View style={styles.entidadeSelecionadaCard}>
              <View style={styles.entidadeInfoCol}>
                <View style={styles.imovelTituloRow}>
                  <Text style={styles.entidadeNome} numberOfLines={1}>
                    {imovelSelecionado.endereco}
                  </Text>
                </View>
                <Text style={styles.entidadeDetalhe}>
                  {imovelSelecionado.bairro || 'Sem bairro'} • {imovelSelecionado.tipoImovel}
                </Text>
                {imovelSelecionado.valor ? (
                  <Text style={styles.entidadeSubdetalhe}>
                    {formatarMoedaBrl(imovelSelecionado.valor)}
                  </Text>
                ) : null}
                {idsImoveisInteresseCliente.has(imovelSelecionado.id) ? (
                  <View
                    style={styles.badgeInteresseCliente}
                    testID={`imovel-interesse-badge-${imovelSelecionado.id}`}
                  >
                    <Ionicons name="star-outline" size={12} color="#C2410C" />
                    <Text style={styles.badgeInteresseClienteText}>
                      Imóvel de Interesse do Cliente
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                testID="btn-trocar-imovel"
                onPress={handleTrocarImovel}
                style={({ pressed }) => [
                  styles.btnTrocarEntidade,
                  pressed && styles.pressedScale,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Trocar imóvel selecionado"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="swap-horizontal" size={14} color={DOMUS_THEME.primary} />
                <Text style={styles.btnTrocarEntidadeText}>Trocar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buscaContainer}>
              <DomusInput
                testID="input-busca-imovel"
                placeholder="Buscar imóvel por endereço, bairro ou tipo..."
                value={buscaImovel}
                onChangeText={setBuscaImovel}
                containerStyle={styles.inputBuscaContainer}
              />
              <View style={styles.listaSelecaoContainer}>
                {imoveisFiltrados.length === 0 ? (
                  <Text style={styles.listaVaziaTexto}>Nenhum imóvel encontrado</Text>
                ) : (
                  imoveisFiltrados.slice(0, 5).map((imv) => {
                    const isSelected = imovelId === imv.id;
                    const ehInteresse = idsImoveisInteresseCliente.has(imv.id);

                    return (
                      <Pressable
                        key={imv.id}
                        testID={`imovel-item-${imv.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar imóvel ${imv.endereco}`}
                        onPress={() => handleSelecionarImovel(imv)}
                        style={({ pressed }) => [
                          styles.itemListaSelecao,
                          isSelected && styles.itemListaSelecaoActive,
                          ehInteresse && styles.itemListaSelecaoInteresse,
                          pressed && styles.pressedScale,
                        ]}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <View style={styles.itemAvatarImovel}>
                          <Ionicons
                            name="business-outline"
                            size={16}
                            color={ehInteresse ? '#C2410C' : DOMUS_THEME.textSecondary}
                          />
                        </View>
                        <View style={styles.itemListaTextCol}>
                          <View style={styles.rowItemTitulo}>
                            <Text style={styles.itemListaNome} numberOfLines={1}>
                              {imv.endereco}
                            </Text>
                          </View>
                          <Text style={styles.itemListaSub}>
                            {imv.bairro || 'Sem bairro'} • {imv.tipoImovel} •{' '}
                            {formatarMoedaBrl(imv.valor || 0)}
                          </Text>
                          {ehInteresse ? (
                            <View
                              style={styles.badgeInteresseLista}
                              testID={`imovel-interesse-badge-${imv.id}`}
                            >
                              <Text style={styles.badgeInteresseListaText}>
                                [INTERESSE DO CLIENTE]
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                          size={18}
                          color={isSelected ? DOMUS_THEME.primary : DOMUS_THEME.textMuted}
                        />
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>

        {/* Campos Fiel ao Wireframe 02 (Titulo, Descricao, Data, Hora, Duracao, Proxima Acao, Observacao) */}
        <View style={styles.cardSecao}>
          <Text style={styles.secaoTitulo}>Dados do Compromisso</Text>

          {/* Titulo */}
          <DomusInput
            label="Titulo"
            testID="input-agendamento-titulo"
            placeholder="Ex: Visita Residencial Manaíra"
            value={titulo}
            onChangeText={setTitulo}
            containerStyle={styles.campoEspacamento}
          />

          {/* Descricao */}
          <DomusInput
            label="Descrição"
            testID="input-agendamento-descricao"
            placeholder="Detalhes ou pauta do encontro"
            value={descricao}
            onChangeText={setDescricao}
            containerStyle={styles.campoEspacamento}
          />

          {/* Linha com Data e Hora lado a lado (fiel ao wireframe 02) */}
          <View style={styles.dataHoraRow}>
            <View style={styles.dataHoraCol}>
              <DomusInput
                label="Data"
                testID="input-agendamento-data"
                placeholder="DD/MM/AAAA"
                value={data}
                onChangeText={setData}
              />
            </View>
            <View style={styles.dataHoraCol}>
              <DomusInput
                label="Hora:"
                testID="input-agendamento-hora"
                placeholder="HH:MM"
                value={hora}
                onChangeText={setHora}
              />
            </View>
          </View>

          {/* Duracao */}
          <DomusInput
            label="Duração"
            testID="input-agendamento-duracao"
            placeholder="Duração em minutos (ex: 60)"
            keyboardType="numeric"
            value={duracaoMinutos}
            onChangeText={setDuracaoMinutos}
            containerStyle={styles.campoEspacamento}
          />

          {/* Proxima Acao */}
          <DomusInput
            label="Próxima Ação"
            testID="input-agendamento-proxima-acao"
            placeholder="Ex: Enviar proposta de financiamento por WhatsApp"
            value={proximaAcao}
            onChangeText={setProximaAcao}
            containerStyle={styles.campoEspacamento}
          />

          {/* Observacao */}
          <DomusInput
            label="Observação"
            testID="input-agendamento-observacoes"
            placeholder="Anotações internas sobre o cliente ou negociação"
            multiline={true}
            numberOfLines={3}
            value={observacoes}
            onChangeText={setObservacoes}
            containerStyle={styles.campoEspacamento}
          />
        </View>

        {/* Toggle Pressable de Sincronizacao Google Calendar (RN16) */}
        <View style={styles.cardSecao}>
          <Pressable
            testID="toggle-google-calendar"
            accessibilityRole="switch"
            accessibilityState={{ checked: sincronizarGoogleCalendar }}
            accessibilityLabel="Sincronizar com Google Calendar"
            onPress={handleToggleGoogleCalendar}
            style={({ pressed }) => [
              styles.googleSyncRow,
              sincronizarGoogleCalendar && styles.googleSyncRowActive,
              pressed && styles.pressedScale,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View style={styles.googleSyncIconWrap}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={sincronizarGoogleCalendar ? DOMUS_THEME.primary : DOMUS_THEME.textSecondary}
              />
            </View>
            <View style={styles.googleSyncTexts}>
              <Text style={styles.googleSyncTitle}>
                Sincronizar com Google Calendar (RN16)
              </Text>
              <Text style={styles.googleSyncSubtitle}>
                Gera evento com lembrete automático na agenda do corretor
              </Text>
            </View>
            <View
              style={[
                styles.switchPill,
                sincronizarGoogleCalendar && styles.switchPillActive,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  sincronizarGoogleCalendar && styles.switchThumbActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Botao de Acao "Agendar" (fiel ao wireframe 02) */}
        <View style={styles.actionContainer}>
          <Pressable
            testID="btn-agendar-submit"
            accessibilityRole="button"
            accessibilityLabel="Criar agendamento"
            disabled={salvando}
            onPress={handleSubmeterAgendamento}
            style={({ pressed }) => [
              styles.btnAgendar,
              salvando && styles.btnAgendarDisabled,
              pressed && !salvando && styles.pressedScale,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {salvando ? (
              <View style={styles.rowLoading}>
                <ActivityIndicator size="small" color="#FFFFFF" testID="btn-agendar-loading" />
                <Text style={styles.btnAgendarText}>Agendando...</Text>
              </View>
            ) : (
              <Text style={styles.btnAgendarText}>Agendar</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Toast Flutuante embutido para feedback instantaneo nao-bloqueante */}
      <DomusToast
        visivel={toastLocal.visivel}
        mensagem={toastLocal.mensagem}
        tipo={toastLocal.tipo}
        onDismiss={() => setToastLocal((prev) => ({ ...prev, visivel: false }))}
        testID="agendar-toast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
  scrollContent: {
    paddingHorizontal: DOMUS_SPACING.md,
    paddingTop: DOMUS_SPACING.sm,
    paddingBottom: DOMUS_SPACING.xl * 2,
  },
  headerHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOMUS_THEME.surface,
    padding: DOMUS_SPACING.md,
    borderRadius: DOMUS_RADIUS.md,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    marginBottom: DOMUS_SPACING.md,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: DOMUS_SPACING.md,
  },
  headerHeroTexts: {
    flex: 1,
  },
  headerHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  headerHeroSubtitle: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  cardSecao: {
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: DOMUS_RADIUS.md,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
  },
  secaoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.sm,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
    marginBottom: DOMUS_SPACING.xs,
  },
  badgeObrigatorio: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DOMUS_RADIUS.pill,
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
  },
  badgeObrigatorioText: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_THEME.danger,
  },
  badgeOpcional: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DOMUS_RADIUS.pill,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
  },
  badgeOpcionalText: {
    fontSize: 11,
    fontWeight: '500',
    color: DOMUS_THEME.textMuted,
  },
  tiposRow: {
    flexDirection: 'row',
    gap: DOMUS_SPACING.xs,
    marginTop: DOMUS_SPACING.xs,
  },
  tipoOption: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DOMUS_SPACING.xs,
    paddingHorizontal: DOMUS_SPACING.xs,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    gap: 6,
  },
  tipoOptionSelected: {
    borderColor: DOMUS_THEME.primary,
    backgroundColor: '#FFF7ED',
  },
  tipoOptionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: DOMUS_THEME.textSecondary,
  },
  tipoOptionLabelSelected: {
    color: DOMUS_THEME.primary,
    fontWeight: '700',
  },
  tipoHelperText: {
    fontSize: 11,
    color: DOMUS_THEME.textMuted,
    marginTop: DOMUS_SPACING.xs,
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
  entidadeSelecionadaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    borderRadius: DOMUS_RADIUS.sm,
    padding: DOMUS_SPACING.sm,
    marginTop: DOMUS_SPACING.xs,
  },
  entidadeInfoCol: {
    flex: 1,
    marginRight: DOMUS_SPACING.sm,
  },
  entidadeNome: {
    fontSize: 14,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  entidadeDetalhe: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
  },
  entidadeSubdetalhe: {
    fontSize: 12,
    color: DOMUS_THEME.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  imovelTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeInteresseCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DOMUS_RADIUS.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeInteresseClienteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A3412',
  },
  btnTrocarEntidade: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: DOMUS_SPACING.xs,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    backgroundColor: DOMUS_THEME.surface,
  },
  btnTrocarEntidadeText: {
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.primary,
  },
  buscaContainer: {
    marginTop: DOMUS_SPACING.xs,
  },
  inputBuscaContainer: {
    marginBottom: DOMUS_SPACING.xs,
  },
  listaSelecaoContainer: {
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    borderRadius: DOMUS_RADIUS.sm,
    backgroundColor: DOMUS_THEME.surface,
    overflow: 'hidden',
  },
  listaVaziaTexto: {
    fontSize: 12,
    color: DOMUS_THEME.textMuted,
    padding: DOMUS_SPACING.sm,
    textAlign: 'center',
  },
  itemListaSelecao: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: DOMUS_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.border,
  },
  itemListaSelecaoActive: {
    backgroundColor: '#FFF7ED',
  },
  itemListaSelecaoInteresse: {
    backgroundColor: '#FFFBEB',
  },
  itemAvatar: {
    width: 32,
    height: 32,
    borderRadius: DOMUS_RADIUS.pill,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DOMUS_SPACING.sm,
  },
  itemAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  itemAvatarImovel: {
    width: 32,
    height: 32,
    borderRadius: DOMUS_RADIUS.pill,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DOMUS_SPACING.sm,
  },
  itemListaTextCol: {
    flex: 1,
    marginRight: DOMUS_SPACING.xs,
  },
  rowItemTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemListaNome: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textPrimary,
  },
  itemListaSub: {
    fontSize: 11,
    color: DOMUS_THEME.textSecondary,
    marginTop: 1,
  },
  badgeInteresseLista: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  badgeInteresseListaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  campoEspacamento: {
    marginTop: DOMUS_SPACING.xs,
  },
  dataHoraRow: {
    flexDirection: 'row',
    gap: DOMUS_SPACING.sm,
    marginTop: DOMUS_SPACING.xs,
  },
  dataHoraCol: {
    flex: 1,
  },
  googleSyncRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DOMUS_SPACING.xs,
    paddingHorizontal: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
  },
  googleSyncRowActive: {
    borderColor: DOMUS_THEME.primary,
    backgroundColor: '#FFF7ED',
  },
  googleSyncIconWrap: {
    marginRight: DOMUS_SPACING.sm,
  },
  googleSyncTexts: {
    flex: 1,
    marginRight: DOMUS_SPACING.sm,
  },
  googleSyncTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textPrimary,
  },
  googleSyncSubtitle: {
    fontSize: 11,
    color: DOMUS_THEME.textSecondary,
    marginTop: 1,
  },
  switchPill: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  switchPillActive: {
    backgroundColor: DOMUS_THEME.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  actionContainer: {
    marginTop: DOMUS_SPACING.sm,
    marginBottom: DOMUS_SPACING.lg,
  },
  btnAgendar: {
    minHeight: 48,
    backgroundColor: DOMUS_THEME.primary,
    borderRadius: DOMUS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DOMUS_SPACING.lg,
  },
  btnAgendarDisabled: {
    opacity: 0.6,
  },
  btnAgendarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
    padding: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.sm,
    marginBottom: DOMUS_SPACING.md,
  },
  bannerErroTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: DOMUS_THEME.danger,
  },
  bannerSucesso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DOMUS_THEME.successSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.successBorder,
    padding: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.sm,
    marginBottom: DOMUS_SPACING.md,
  },
  bannerSucessoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.success,
  },
});

export default AgendarScreen;
