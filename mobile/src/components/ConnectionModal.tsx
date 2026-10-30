import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { DomusInput } from './DomusInput';
import { DomusButton } from './DomusButton';
import { useDomus } from '../context/DomusContext';
import { domusApi } from '../services/domusApi';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import { projectVelocity, rubberband } from '../utils/motion';
import {
  triggerLightImpact,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from '../utils/haptics';

export interface ConnectionModalProps {
  visivel: boolean;
  onFechar: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  visivel,
  onFechar,
}) => {
  const { modoOffline, configurarModo, recarregarDados } = useDomus();
  const [urlInput, setUrlInput] = useState<string>(domusApi.baseUrl);
  const [testando, setTestando] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemFeedback, setMensagemFeedback] = useState<{
    tipo: 'sucesso' | 'erro' | 'info';
    texto: string;
  } | null>(null);

  const SHEET_HEIGHT = 560;
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const dragContext = useSharedValue(0);
  const timerFecharRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerFecharRef.current) {
        clearTimeout(timerFecharRef.current);
        timerFecharRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visivel) {
      translateY.set(0);
      dragContext.set(0);
      triggerLightImpact();
    }
  }, [visivel, translateY, dragContext]);

  const fecharComHaptica = useCallback(() => {
    triggerLightImpact();
    onFechar();
  }, [onFechar]);

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
                  duration: reducedMotion ? 1 : 300,
                  dampingRatio: 1,
                  velocity: e.velocityY,
                  overshootClamping: true,
                },
                (finished) => {
                  if (finished !== false) {
                    runOnJS(fecharComHaptica)();
                  }
                }
              )
            );
          } else {
            translateY.set(
              withSpring(0, {
                duration: reducedMotion ? 1 : 300,
                dampingRatio: 0.8,
                velocity: e.velocityY,
              })
            );
            runOnJS(triggerLightImpact)();
          }
        }),
    [dragContext, translateY, reducedMotion, fecharComHaptica]
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

  const handleTestar = async () => {
    setTestando(true);
    setMensagemFeedback(null);
    try {
      const res = await domusApi.testarConexao(urlInput.trim());
      if (res.ok) {
        triggerSuccessHaptic();
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: '[OK] Conexão estabelecida com a API backend na porta 3000!',
        });
      } else {
        triggerErrorHaptic();
        setMensagemFeedback({
          tipo: 'erro',
          texto: `[FALHA] Não foi possível conectar: ${res.mensagem}`,
        });
      }
    } catch (err: any) {
      triggerErrorHaptic();
      setMensagemFeedback({
        tipo: 'erro',
        texto: `[ERRO] ${err.message || 'Falha de comunicação'}`,
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvarEConectar = async () => {
    setSalvando(true);
    setMensagemFeedback(null);
    try {
      await configurarModo({
        baseUrl: urlInput.trim(),
        forcarOffline: false,
      });
      await recarregarDados();
      const offline = domusApi.obterModoOffline();
      if (!offline) {
        triggerSuccessHaptic();
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: '[OK] Conectado à API e dados sincronizados com o banco SQLite!',
        });
        if (timerFecharRef.current) {
          clearTimeout(timerFecharRef.current);
        }
        const timer = setTimeout(() => {
          onFechar();
        }, 800);
        if (timer && typeof timer.unref === 'function') {
          timer.unref();
        }
        timerFecharRef.current = timer;
      } else {
        triggerErrorHaptic();
        setMensagemFeedback({
          tipo: 'erro',
          texto: '[FALHA] Servidor inacessível ou não autenticado na porta 3000. Verifique se o backend NestJS está iniciado com banco populado (npm run prisma:seed).',
        });
      }
    } catch (err: any) {
      triggerErrorHaptic();
      setMensagemFeedback({
        tipo: 'erro',
        texto: `[FALHA] ${err.message || 'Erro ao sincronizar com a API'}`,
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleAtivarOffline = async () => {
    setSalvando(true);
    setMensagemFeedback(null);
    try {
      await configurarModo({
        forcarOffline: true,
      });
      await recarregarDados();
      triggerLightImpact();
      setMensagemFeedback({
        tipo: 'info',
        texto: '[INFO] Modo Demo Local ativado.',
      });
      if (timerFecharRef.current) {
        clearTimeout(timerFecharRef.current);
      }
      const timer = setTimeout(() => {
        onFechar();
      }, 800);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
      timerFecharRef.current = timer;
    } catch (err: any) {
      triggerErrorHaptic();
      setMensagemFeedback({
        tipo: 'erro',
        texto: `[ERRO] ${err.message}`,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      testID="connection-modal"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar modal tocando fora"
        />

        <Animated.View style={[styles.sheetCard, sheetAnimatedStyle]}>
          {/* Alca de arraste (Drag Handle) para gesto de puxar para baixo */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragHandleContainer} testID="drag-handle-container">
              <View style={styles.dragHandle} />
            </View>
          </GestureDetector>

          {/* Cabecalho do Sheet */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={styles.headerIconWrapper}>
                <Ionicons
                  name="server-outline"
                  size={18}
                  color={DOMUS_THEME.primary}
                />
              </View>
              <Text style={styles.title}>Conexão com o Backend</Text>
            </View>
            <TouchableOpacity
              onPress={onFechar}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="btn-fechar-modal-conexao"
              accessibilityRole="button"
              accessibilityLabel="Fechar configuracao de conexao"
            >
              <Ionicons name="close" size={20} color={DOMUS_THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Status Atual */}
            <View
              style={[
                styles.statusBox,
                modoOffline ? styles.statusBoxOffline : styles.statusBoxOnline,
              ]}
              testID="modal-status-box"
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: modoOffline
                      ? DOMUS_THEME.warning
                      : DOMUS_THEME.success,
                  },
                ]}
              />
              <View style={styles.statusTextGroup}>
                <Text style={styles.statusLabel}>
                  {modoOffline
                    ? 'Status: Modo Demo Local (Offline)'
                    : 'Status: API Online (Banco SQLite Ativo)'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {modoOffline
                    ? 'Operando na memória local do dispositivo. Conecte à API para persistência SQLite.'
                    : `Sincronizando em tempo real com ${domusApi.baseUrl}`}
                </Text>
              </View>
            </View>

            {/* Campo da URL */}
            <DomusInput
              label="URL Base da API Backend"
              placeholder="http://192.168.x.x:3000/api ou http://localhost:3000/api"
              value={urlInput}
              onChangeText={(text) => {
                setUrlInput(text);
                setMensagemFeedback(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              testID="input-api-base-url"
            />

            {/* Mensagem Inline de Feedback */}
            {mensagemFeedback ? (
              <View
                style={[
                  styles.feedbackBox,
                  mensagemFeedback.tipo === 'sucesso' && styles.feedbackSuccess,
                  mensagemFeedback.tipo === 'erro' && styles.feedbackError,
                  mensagemFeedback.tipo === 'info' && styles.feedbackInfo,
                ]}
                testID="connection-feedback-box"
              >
                <Text
                  style={[
                    styles.feedbackText,
                    mensagemFeedback.tipo === 'sucesso' && styles.feedbackTextSuccess,
                    mensagemFeedback.tipo === 'erro' && styles.feedbackTextError,
                    mensagemFeedback.tipo === 'info' && styles.feedbackTextInfo,
                  ]}
                >
                  {mensagemFeedback.texto}
                </Text>
              </View>
            ) : null}

            {/* Botoes de Acao */}
            <View style={styles.buttonGroup}>
              <DomusButton
                label="Testar Conexao"
                loadingLabel="Testando..."
                onPress={handleTestar}
                loading={testando}
                disabled={testando || salvando}
                variant="secondary"
                testID="btn-testar-conexao"
              />

              <DomusButton
                label="Conectar a API e Sincronizar"
                loadingLabel="Conectando..."
                onPress={handleSalvarEConectar}
                loading={salvando}
                disabled={testando || salvando}
                variant="primary"
                testID="btn-salvar-conectar"
              />

              <TouchableOpacity
                onPress={handleAtivarOffline}
                style={styles.btnSecondaryText}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                disabled={testando || salvando}
                testID="btn-alternar-offline"
                accessibilityRole="button"
                accessibilityLabel="Usar Modo Demo Local Offline"
              >
                <Text style={styles.btnSecondaryTextLabel}>
                  Usar Modo Demo Local (Offline)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guia Rapido de IPs */}
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>Dicas para Apresentação:</Text>
              <Text style={styles.guideItem}>
                - No Celular via USB: Execute 'adb reverse tcp:3000 tcp:3000' e use http://localhost:3000/api
              </Text>
              <Text style={styles.guideItem}>
                - No Celular via Wi-Fi: Utilize o IP da sua máquina na rede (ex: http://192.168.1.100:3000/api)
              </Text>
              <Text style={styles.guideItem}>
                - No Navegador Web: Utilize http://localhost:3000/api
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetCard: {
    width: '100%',
    maxHeight: '88%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingVertical: DOMUS_SPACING.sm,
    backgroundColor: DOMUS_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.border,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOMUS_SPACING.sm,
  },
  headerIconWrapper: {
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
    fontSize: 17,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 22,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: DOMUS_SPACING.lg,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DOMUS_SPACING.md,
    borderRadius: 12,
    marginBottom: DOMUS_SPACING.lg,
    borderWidth: 1,
  },
  statusBoxOffline: {
    backgroundColor: DOMUS_THEME.warningSoft,
    borderColor: DOMUS_THEME.warningBorder,
  },
  statusBoxOnline: {
    backgroundColor: DOMUS_THEME.successSoft,
    borderColor: DOMUS_THEME.successBorder,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: DOMUS_SPACING.md,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
  },
  statusSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: DOMUS_THEME.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  feedbackBox: {
    padding: DOMUS_SPACING.sm + 2,
    borderRadius: DOMUS_RADIUS.sm,
    marginBottom: DOMUS_SPACING.md,
  },
  feedbackSuccess: {
    backgroundColor: DOMUS_THEME.successSoft,
    borderLeftWidth: 4,
    borderLeftColor: DOMUS_THEME.success,
  },
  feedbackError: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderLeftWidth: 4,
    borderLeftColor: DOMUS_THEME.danger,
  },
  feedbackInfo: {
    backgroundColor: DOMUS_THEME.infoSoft,
    borderLeftWidth: 4,
    borderLeftColor: DOMUS_THEME.info,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '500',
  },
  feedbackTextSuccess: {
    color: DOMUS_THEME.success,
  },
  feedbackTextError: {
    color: DOMUS_THEME.danger,
  },
  feedbackTextInfo: {
    color: DOMUS_THEME.info,
  },
  buttonGroup: {
    gap: DOMUS_SPACING.sm,
    marginTop: DOMUS_SPACING.sm,
  },
  btnSecondaryText: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: DOMUS_SPACING.sm,
  },
  btnSecondaryTextLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
    textDecorationLine: 'underline',
  },
  guideBox: {
    marginTop: DOMUS_SPACING.lg,
    padding: DOMUS_SPACING.md,
    backgroundColor: DOMUS_THEME.surfaceElevated,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: DOMUS_THEME.primary,
    marginBottom: DOMUS_SPACING.xxl,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
    marginBottom: 4,
  },
  guideItem: {
    fontSize: 11,
    fontWeight: '400',
    color: DOMUS_THEME.textSecondary,
    marginBottom: 3,
    lineHeight: 16,
  },
});

export default ConnectionModal;
