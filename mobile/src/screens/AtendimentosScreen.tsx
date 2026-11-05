import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { AvisoBanner } from '../components/AvisoBanner';
import { useDomus, DomusContextData } from '../context/DomusContext';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import { Agendamento } from '../types/domus';
import { formatarDataBr, formatarHora, validarDataBr, validarHora } from '../utils/formatters';
import { projectVelocity, rubberband } from '../utils/motion';
import {
  triggerLightImpact,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from '../utils/haptics';

export interface AtendimentosScreenProps {
  context?: DomusContextData;
  onNovoAgendamento?: () => void;
}

type FiltroSegmento = 'TODOS' | 'CLIENTE' | 'IMOVEL' | 'SEM_DATA';

function formatarDataHoraAmigavel(iso?: string | null): string {
  if (!iso) return 'Sem data definida';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch {
    return iso;
  }
}

/* =========================================================================
   Card Item de Atendimento (React.memo)
   ========================================================================= */

interface AtendimentoCardItemProps {
  item: Agendamento;
  onVisualizar: (atendimento: Agendamento) => void;
}

export const AtendimentoCardItem = React.memo<AtendimentoCardItemProps>(
  ({ item, onVisualizar }) => {
    const isConcluido = item.status === 'CONCLUIDO';
    const hasData = !!item.dataHora;

    return (
      <View
        style={[styles.atendimentoCard, isConcluido && styles.cardConcluido]}
        testID={`card-atendimento-${item.id}`}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.statusIconCircle,
                isConcluido ? styles.statusCircleConcluido : styles.statusCirclePendente,
              ]}
            >
              <Ionicons
                name={isConcluido ? 'checkmark' : 'time-outline'}
                size={14}
                color={isConcluido ? '#16A34A' : '#EA580C'}
              />
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.cliente?.nomeCompleto || `Cliente #${item.clienteId}`}
              </Text>
            </View>
          </View>

          <View style={styles.badgesCol}>
            <View
              style={[
                styles.badgeTipo,
                item.tipo === 'VISITA'
                  ? styles.badgeVisita
                  : item.tipo === 'RETORNO'
                  ? styles.badgeRetorno
                  : styles.badgeAtendimento,
              ]}
            >
              <Text
                style={[
                  styles.badgeTipoText,
                  item.tipo === 'VISITA'
                    ? styles.badgeVisitaText
                    : item.tipo === 'RETORNO'
                    ? styles.badgeRetornoText
                    : styles.badgeAtendimentoText,
                ]}
              >
                {item.tipo}
              </Text>
            </View>
          </View>
        </View>

        {item.imovel ? (
          <View style={styles.cardImovelRow}>
            <Ionicons name="business-outline" size={13} color={DOMUS_THEME.textSecondary} />
            <Text style={styles.cardImovelText} numberOfLines={1}>
              {item.imovel.tipoImovel} - {item.imovel.bairro || item.imovel.endereco}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardMetaRow}>
          <View style={styles.dataMetaItem}>
            <Ionicons
              name={hasData ? 'calendar-outline' : 'alert-circle-outline'}
              size={13}
              color={hasData ? DOMUS_THEME.textSecondary : '#D97706'}
            />
            <Text
              style={[
                styles.dataMetaText,
                !hasData && styles.dataMetaSemData,
              ]}
            >
              {formatarDataHoraAmigavel(item.dataHora)}
            </Text>
          </View>

          <View
            style={[
              styles.badgeStatus,
              isConcluido ? styles.badgeStatusConcluido : styles.badgeStatusPendente,
            ]}
          >
            <Text
              style={[
                styles.badgeStatusText,
                isConcluido ? styles.badgeStatusTextConcluido : styles.badgeStatusTextPendente,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btnVisualizar,
            pressed && styles.btnVisualizarPressed,
          ]}
          onPress={() => onVisualizar(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          testID={`btn-visualizar-atendimento-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Visualizar detalhes do agendamento ${item.titulo}`}
        >
          <Ionicons name="eye-outline" size={15} color="#C2410C" />
          <Text style={styles.btnVisualizarText}>Visualizar Detalhes</Text>
        </Pressable>
      </View>
    );
  }
);
AtendimentoCardItem.displayName = 'AtendimentoCardItem';

/* =========================================================================
   Tela Principal AtendimentosScreen
   ========================================================================= */

export const AtendimentosScreen: React.FC<AtendimentosScreenProps> = ({
  context,
  onNovoAgendamento,
}) => {
  const domusHook = context ? null : useDomus();
  const domus = context || domusHook!;

  // Filtro
  const [filtro, setFiltro] = useState<FiltroSegmento>('TODOS');
  const [busca, setBusca] = useState<string>('');

  // Atendimento selecionado para o Bottom Sheet
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Agendamento | null>(null);

  // Estados de acoes no Sheet
  const [modoAcaoSheet, setModoAcaoSheet] = useState<'visualizar' | 'retorno' | 'concluir'>('visualizar');
  const [dataRetorno, setDataRetorno] = useState<string>('');
  const [horaRetorno, setHoraRetorno] = useState<string>('09:00');
  const [proximaAcaoRetorno, setProximaAcaoRetorno] = useState<string>('');
  const [obsConclusao, setObsConclusao] = useState<string>('');
  const [executandoAcao, setExecutandoAcao] = useState<boolean>(false);
  const submetendoRef = useRef<boolean>(false);
  const timerFecharSheetRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerFecharSheetRef.current) {
        clearTimeout(timerFecharSheetRef.current);
        timerFecharSheetRef.current = null;
      }
    };
  }, []);
  const [feedbackSheet, setFeedbackSheet] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Bottom Sheet Gestures & Animation
  const SHEET_HEIGHT = 620;
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const dragContext = useSharedValue(0);

  const fecharSheet = useCallback(() => {
    triggerLightImpact();
    setAtendimentoSelecionado(null);
    setModoAcaoSheet('visualizar');
    setFeedbackSheet(null);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart(() => {
          'worklet';
          dragContext.set(translateY.get());
        })
        .onUpdate((e) => {
          'worklet';
          const next = dragContext.get() + e.translationY;
          if (next < 0) {
            translateY.set(rubberband(next, SHEET_HEIGHT, 0.55));
          } else {
            translateY.set(next);
          }
        })
        .onEnd((e) => {
          'worklet';
          const projected = translateY.get() + projectVelocity(e.velocityY);
          if (projected > SHEET_HEIGHT * 0.35 || e.velocityY > 500) {
            translateY.set(
              withSpring(
                SHEET_HEIGHT,
                {

                  dampingRatio: 1,
                  velocity: e.velocityY,
                  overshootClamping: true,
                },
                (finished) => {
                  if (finished !== false) {
                    runOnJS(fecharSheet)();
                  }
                }
              )
            );
          } else {
            translateY.set(
              withSpring(0, {

                dampingRatio: 0.8,
                velocity: e.velocityY,
              })
            );
            runOnJS(triggerLightImpact)();
          }
        }),
    [dragContext, translateY, reducedMotion, fecharSheet]
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.get() }],
      opacity: interpolate(
        translateY.get(),
        [0, SHEET_HEIGHT],
        [1, 0.85],
        Extrapolation.CLAMP
      ),
    };
  });

  const abrirDetalhes = useCallback(
    (item: Agendamento) => {
      triggerLightImpact();
      setAtendimentoSelecionado(item);
      setModoAcaoSheet('visualizar');
      setFeedbackSheet(null);
      translateY.set(0);
      dragContext.set(0);
    },
    [translateY, dragContext]
  );

  // Metricas
  const totalAtendimentos = domus.agendamentos.length;
  const totalPendentes = useMemo(
    () => domus.agendamentos.filter((a) => a.status === 'PENDENTE').length,
    [domus.agendamentos]
  );
  const totalSemData = useMemo(
    () => domus.agendamentos.filter((a) => !a.dataHora).length,
    [domus.agendamentos]
  );

  // Filtragem
  const atendimentosFiltrados = useMemo(() => {
    let base = domus.agendamentos;

    switch (filtro) {
      case 'CLIENTE':
        base = [...base].sort((a, b) => (a.clienteId || 0) - (b.clienteId || 0));
        break;
      case 'IMOVEL':
        base = base.filter((a) => !!a.imovelId);
        break;
      case 'SEM_DATA':
        base = base.filter((a) => !a.dataHora || a.status === 'PENDENTE');
        break;
      case 'TODOS':
      default:
        break;
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      base = base.filter((a) => {
        const titMatch = a.titulo.toLowerCase().includes(termo);
        const cliMatch = a.cliente?.nomeCompleto.toLowerCase().includes(termo);
        const imvMatch = a.imovel?.endereco.toLowerCase().includes(termo);
        return titMatch || cliMatch || imvMatch;
      });
    }

    return base;
  }, [domus.agendamentos, filtro, busca]);

  // Acoes no Sheet
  const handleProgramarRetorno = async () => {
    if (!atendimentoSelecionado) return;
    setFeedbackSheet(null);

    try {
      setExecutandoAcao(true);
      await domus.programarRetorno(atendimentoSelecionado.id, {
        titulo: `Retorno com ${atendimentoSelecionado.cliente?.nomeCompleto || 'Cliente'}`,
        data: dataRetorno.trim() || undefined,
        hora: horaRetorno.trim() || undefined,
        proximaAcao: proximaAcaoRetorno.trim() || undefined,
      });

      triggerSuccessHaptic();
      setFeedbackSheet({
        tipo: 'sucesso',
        texto: '[OK] Retorno programado com sucesso !',
      });
      domus.mostrarToast?.('[OK] Retorno programado com sucesso!', 'sucesso');
      setTimeout(() => {
        fecharSheet();
      }, 1000);
    } catch (err: any) {
      triggerErrorHaptic();
      setFeedbackSheet({
        tipo: 'erro',
        texto: `[ERRO] ${err.message || 'Falha ao programar retorno'}`,
      });
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleConcluirAtendimento = async () => {
    if (!atendimentoSelecionado) return;
    setFeedbackSheet(null);

    try {
      setExecutandoAcao(true);
      await domus.concluirAgendamento(atendimentoSelecionado.id, {
        observacaoConclusao: obsConclusao.trim() || undefined,
      });

      triggerSuccessHaptic();
      setFeedbackSheet({
        tipo: 'sucesso',
        texto: '[OK] Atendimento concluído com sucesso e avisos baixados !',
      });
      domus.mostrarToast?.('[OK] Atendimento concluído com sucesso!', 'sucesso');
      setTimeout(() => {
        fecharSheet();
      }, 1000);
    } catch (err: any) {
      triggerErrorHaptic();
      setFeedbackSheet({
        tipo: 'erro',
        texto: `[ERRO] ${err.message || 'Falha ao concluir atendimento'}`,
      });
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleSincronizarGoogle = async () => {
    if (!atendimentoSelecionado) return;
    setFeedbackSheet(null);

    try {
      setExecutandoAcao(true);
      const res = await domus.sincronizarGoogleCalendar(atendimentoSelecionado.id);
      triggerSuccessHaptic();
      setFeedbackSheet({
        tipo: 'sucesso',
        texto: `[OK] Google Calendar sincronizado !`,
      });
      domus.mostrarToast?.('[OK] Integrado ao Google Calendar!', 'sucesso');
    } catch (err: any) {
      triggerErrorHaptic();
      setFeedbackSheet({
        tipo: 'erro',
        texto: `[ERRO] ${err.message || 'Falha ao sincronizar'}`,
      });
    } finally {
      setExecutandoAcao(false);
    }
  };

  const keyExtractor = useCallback((item: Agendamento) => String(item.id), []);

  const renderAtendimentoItem = useCallback(
    ({ item }: { item: Agendamento }) => (
      <AtendimentoCardItem item={item} onVisualizar={abrirDetalhes} />
    ),
    [abrirDetalhes]
  );

  const handlePullToRefresh = useCallback(async () => {
    triggerSelectionHaptic();
    await domus.recarregarDados();
  }, [domus]);

  return (
    <View style={styles.safeArea} testID="atendimentos-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="atendimentos-screen-scroll"
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
          {/* Topo com AvisoBanner elegante nao-bloqueante */}
          {domus.bannerVisivel && domus.avisos?.possuiAvisos ? (
            <AvisoBanner
              visivel={true}
              mensagem={domus.avisos.mensagemBanner || undefined}
              totalProximos={domus.avisos.totalProximos}
              totalAtrasados={domus.avisos.totalAtrasados}
              totalSemData={domus.avisos.totalSemData}
              onFechar={domus.fecharBanner}
            />
          ) : null}

          {/* Cards de Metricas Rapidas */}
          <View style={styles.metricCardsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrapTotal}>
                <Ionicons name="clipboard" size={16} color="#2563EB" />
              </View>
              <Text style={styles.metricValue}>{totalAtendimentos}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrapPendentes}>
                <Ionicons name="time" size={16} color="#EA580C" />
              </View>
              <Text style={styles.metricValue}>{totalPendentes}</Text>
              <Text style={styles.metricLabel}>Pendentes</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrapSemData}>
                <Ionicons name="alert" size={16} color="#D97706" />
              </View>
              <Text style={styles.metricValue}>{totalSemData}</Text>
              <Text style={styles.metricLabel}>Sem Data</Text>
            </View>
          </View>

          {/* Filtro Segmentado em Pills */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Filtrar Atendimentos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.filterPill,
                  filtro === 'TODOS' && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setFiltro('TODOS');
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                testID="filtro-todos"
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === 'TODOS' }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filtro === 'TODOS' && styles.filterPillTextActive,
                  ]}
                >
                  Todos
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.filterPill,
                  filtro === 'CLIENTE' && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setFiltro('CLIENTE');
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                testID="filtro-por-cliente"
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === 'CLIENTE' }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filtro === 'CLIENTE' && styles.filterPillTextActive,
                  ]}
                >
                  Por Cliente
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.filterPill,
                  filtro === 'IMOVEL' && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setFiltro('IMOVEL');
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                testID="filtro-por-imovel"
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === 'IMOVEL' }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filtro === 'IMOVEL' && styles.filterPillTextActive,
                  ]}
                >
                  Por Imóvel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.filterPill,
                  filtro === 'SEM_DATA' && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setFiltro('SEM_DATA');
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                testID="filtro-sem-data"
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === 'SEM_DATA' }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filtro === 'SEM_DATA' && styles.filterPillTextActive,
                  ]}
                >
                  Sem Data / Pendentes
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* FlashList de Atendimentos */}
          <View style={styles.listSection} testID="secao-atendimentos">
            <View style={styles.listHeaderRow}>
              <View style={styles.listTitleBox}>
                <View style={styles.listIconWrapper}>
                  <Ionicons name="clipboard" size={18} color={DOMUS_THEME.primary} />
                </View>
                <Text style={styles.listTitle}>Lista de Atendimentos</Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>
                  {`${atendimentosFiltrados.length} ${
                    atendimentosFiltrados.length === 1 ? 'item' : 'itens'
                  }`}
                </Text>
              </View>
            </View>

            {/* Busca rapida */}
            <DomusInput
              placeholder="Buscar por compromisso, cliente ou imóvel..."
              value={busca}
              onChangeText={setBusca}
              testID="input-busca-atendimento"
              containerStyle={styles.buscaContainer}
            />

            <FlashList
              data={atendimentosFiltrados}
              renderItem={renderAtendimentoItem}
              keyExtractor={keyExtractor}
              estimatedItemSize={140}
              testID="atendimentos-flash-list"
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nenhum atendimento encontrado para o filtro selecionado.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet com Gesto para Detalhes do Atendimento */}
      <Modal
        visible={!!atendimentoSelecionado}
        transparent
        animationType="fade"
        onRequestClose={fecharSheet}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdropDismiss}
            onPress={fecharSheet}
            accessibilityRole="button"
            accessibilityLabel="Fechar detalhes"
          />

          <Animated.View style={[styles.bottomSheetCard, sheetAnimatedStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.dragHandleContainer} testID="sheet-drag-handle">
                <View style={styles.dragHandle} />
              </View>
            </GestureDetector>

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <Text style={styles.sheetHeaderTitle} numberOfLines={1}>
                  {atendimentoSelecionado?.titulo}
                </Text>
                <Text style={styles.sheetHeaderSub}>
                  {atendimentoSelecionado?.tipo} • Status: {atendimentoSelecionado?.status}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetCloseBtn,
                  pressed && styles.sheetCloseBtnPressed,
                ]}
                onPress={fecharSheet}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID="btn-fechar-detalhes"
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={20} color={DOMUS_THEME.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
              {/* Feedback inline no Sheet */}
              {feedbackSheet ? (
                <View
                  style={[
                    styles.sheetFeedback,
                    feedbackSheet.tipo === 'sucesso'
                      ? styles.sheetFeedbackSuccess
                      : styles.sheetFeedbackError,
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetFeedbackText,
                      feedbackSheet.tipo === 'sucesso'
                        ? styles.sheetFeedbackTextSuccess
                        : styles.sheetFeedbackTextError,
                    ]}
                  >
                    {feedbackSheet.texto}
                  </Text>
                </View>
              ) : null}

              {/* Detalhes do Atendimento */}
              <View style={styles.detailsGroup}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>
                    {atendimentoSelecionado?.cliente?.nomeCompleto || 'Não informado'}
                  </Text>
                </View>

                {atendimentoSelecionado?.imovel && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Imóvel:</Text>
                    <Text style={styles.detailValue}>
                      {atendimentoSelecionado.imovel.tipoImovel} -{' '}
                      {atendimentoSelecionado.imovel.endereco}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data e Hora:</Text>
                  <Text style={styles.detailValue}>
                    {formatarDataHoraAmigavel(atendimentoSelecionado?.dataHora)}
                  </Text>
                </View>

                {atendimentoSelecionado?.descricao && (
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Descrição:</Text>
                    <Text style={styles.detailValueBlock}>
                      {atendimentoSelecionado.descricao}
                    </Text>
                  </View>
                )}

                {atendimentoSelecionado?.proximaAcao && (
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Próxima Ação:</Text>
                    <Text style={styles.detailValueBlock}>
                      {atendimentoSelecionado.proximaAcao}
                    </Text>
                  </View>
                )}
              </View>

              {/* Painel de Ações Rápidas */}
              {modoAcaoSheet === 'visualizar' && (
                <View style={styles.sheetActionsContainer}>
                  {atendimentoSelecionado?.status !== 'CONCLUIDO' && (
                    <>
                      <DomusButton
                        label="Programar Retorno"
                        variant="secondary"
                        onPress={() => setModoAcaoSheet('retorno')}
                        testID="btn-abrir-modo-retorno"
                      />

                      <DomusButton
                        label="Concluir Atendimento"
                        variant="primary"
                        onPress={() => setModoAcaoSheet('concluir')}
                        testID="btn-abrir-modo-concluir"
                      />
                    </>
                  )}

                  <DomusButton
                    label="Sincronizar Google Calendar"
                    variant="outline"
                    onPress={handleSincronizarGoogle}
                    loading={executandoAcao}
                    testID="btn-sync-google"
                  />
                </View>
              )}

              {/* Modo: Programar Retorno (RN09) */}
              {modoAcaoSheet === 'retorno' && (
                <View style={styles.actionPanel}>
                  <Text style={styles.actionPanelTitle}>Programar Retorno</Text>
                  <DomusInput
                    label="Data de Retorno"
                    placeholder="YYYY-MM-DD"
                    value={dataRetorno}
                    onChangeText={setDataRetorno}
                    testID="input-retorno-data"
                  />
                  <DomusInput
                    label="Hora de Retorno"
                    placeholder="HH:mm (ex: 09:00)"
                    value={horaRetorno}
                    onChangeText={setHoraRetorno}
                    testID="input-retorno-hora"
                  />
                  <DomusInput
                    label="Próxima Ação"
                    placeholder="Ex: Apresentar proposta revisada..."
                    value={proximaAcaoRetorno}
                    onChangeText={setProximaAcaoRetorno}
                    testID="input-retorno-proxima-acao"
                  />

                  <View style={styles.sheetBtnRow}>
                    <DomusButton
                      label="Cancelar"
                      variant="secondary"
                      onPress={() => setModoAcaoSheet('visualizar')}
                      style={styles.sheetBtnCol}
                    />
                    <DomusButton
                      label="Salvar Retorno"
                      variant="primary"
                      onPress={handleProgramarRetorno}
                      loading={executandoAcao}
                      loadingLabel="Salvando..."
                      testID="btn-salvar-retorno"
                      style={styles.sheetBtnCol}
                    />
                  </View>
                </View>
              )}

              {/* Modo: Concluir Atendimento (RN12) */}
              {modoAcaoSheet === 'concluir' && (
                <View style={styles.actionPanel}>
                  <Text style={styles.actionPanelTitle}>Concluir Atendimento</Text>
                  <Text style={styles.actionPanelSub}>
                    A conclusão dará baixa nos avisos relacionados a este compromisso.
                  </Text>
                  <DomusInput
                    label="Observação de Conclusão"
                    placeholder="Cliente gostou da visita, vai conversar com a família..."
                    value={obsConclusao}
                    onChangeText={setObsConclusao}
                    multiline
                    numberOfLines={3}
                    testID="input-conclusao-obs"
                  />

                  <View style={styles.sheetBtnRow}>
                    <DomusButton
                      label="Cancelar"
                      variant="secondary"
                      onPress={() => setModoAcaoSheet('visualizar')}
                      style={styles.sheetBtnCol}
                    />
                    <DomusButton
                      label="Confirmar Conclusão"
                      variant="primary"
                      onPress={handleConcluirAtendimento}
                      loading={executandoAcao}
                      loadingLabel="Concluindo..."
                      testID="btn-concluir-atendimento"
                      style={styles.sheetBtnCol}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
  metricCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: DOMUS_SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metricIconWrapTotal: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconWrapPendentes: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconWrapSemData: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: DOMUS_THEME.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: DOMUS_SPACING.md,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
  },
  filterPillTextActive: {
    color: '#C2410C',
    fontWeight: '700',
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
    textAlign: 'center',
  },
  atendimentoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: DOMUS_SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardConcluido: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusCirclePendente: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusCircleConcluido: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginTop: 1,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  badgeTipo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeTipoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeVisita: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  badgeVisitaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  badgeRetorno: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  badgeRetornoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  badgeAtendimento: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  badgeAtendimentoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  cardImovelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  cardImovelText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dataMetaText: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    fontWeight: '500',
  },
  dataMetaSemData: {
    color: '#D97706',
    fontWeight: '600',
  },
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeStatusPendente: {
    backgroundColor: '#FFFBEB',
  },
  badgeStatusTextPendente: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeStatusConcluido: {
    backgroundColor: '#F0FDF4',
  },
  badgeStatusTextConcluido: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  btnVisualizar: {
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
  btnVisualizarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  // Modal / Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  bottomSheetCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: DOMUS_THEME.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: DOMUS_THEME.surface,
    minHeight: 28,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: DOMUS_THEME.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingVertical: DOMUS_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.border,
  },
  sheetHeaderLeft: {
    flex: 1,
    marginRight: DOMUS_SPACING.sm,
  },
  sheetHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  sheetHeaderSub: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
  },
  sheetCloseBtn: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 22,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    padding: DOMUS_SPACING.lg,
  },
  sheetFeedback: {
    padding: 10,
    borderRadius: 8,
    marginBottom: DOMUS_SPACING.md,
  },
  sheetFeedbackSuccess: {
    backgroundColor: DOMUS_THEME.successSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.successBorder,
  },
  sheetFeedbackError: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
  },
  sheetFeedbackText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sheetFeedbackTextSuccess: {
    color: DOMUS_THEME.success,
  },
  sheetFeedbackTextError: {
    color: DOMUS_THEME.danger,
  },
  detailsGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: DOMUS_SPACING.lg,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  detailValue: {
    fontSize: 13,
    color: DOMUS_THEME.textPrimary,
    fontWeight: '500',
  },
  detailValueBlock: {
    fontSize: 13,
    color: DOMUS_THEME.textPrimary,
    marginTop: 2,
  },
  sheetActionsContainer: {
    gap: 10,
    marginBottom: DOMUS_SPACING.xxl,
  },
  actionPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: DOMUS_SPACING.xxl,
  },
  actionPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
    marginBottom: 6,
  },
  actionPanelSub: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginBottom: 12,
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  sheetBtnCol: {
    flex: 1,
  },
  btnVisualizarPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  filterPillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  sheetCloseBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
});

export default AtendimentosScreen;