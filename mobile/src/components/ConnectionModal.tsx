import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
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
  const { apiOnline, usuario, configurarApiUrl } = useDomus();
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
  const submetendoRef = useRef<boolean>(false);

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
      setUrlInput(domusApi.baseUrl);
      setMensagemFeedback(null);
      translateY.set(0);
      dragContext.set(0);
      triggerLightImpact();
    } else if (timerFecharRef.current) {
      clearTimeout(timerFecharRef.current);
      timerFecharRef.current = null;
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
    if (submetendoRef.current || testando || salvando) return;
    submetendoRef.current = true;
    setTestando(true);
    setMensagemFeedback(null);
    try {
      const res = await domusApi.testarConexao(urlInput.trim());
      if (res.ok) {
        triggerSuccessHaptic();
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: '[OK] Conexão estabelecida com a API backend!',
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
      submetendoRef.current = false;
    }
  };

  const handleSalvarEConectar = async () => {
    if (submetendoRef.current || testando || salvando) return;
    submetendoRef.current = true;
    setSalvando(true);
    setMensagemFeedback(null);
    try {
      await configurarApiUrl(urlInput.trim());
      triggerSuccessHaptic();
      setMensagemFeedback({
        tipo: 'sucesso',
        texto: usuario
          ? '[OK] Conectado à API e dados sincronizados com o banco SQLite!'
          : '[OK] Conexão com a API configurada com sucesso!',
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
        texto: `[FALHA] ${err.message || 'Servidor inacessível. Verifique se o backend NestJS está iniciado com banco populado (npm run prisma:seed).'}`,
      });
    } finally {
      setSalvando(false);
      submetendoRef.current = false;
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
        <Pressable
          style={styles.backdropDismiss}
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
            <Pressable
              onPress={onFechar}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressedFeedback,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="btn-fechar-modal-conexao"
              accessibilityRole="button"
              accessibilityLabel="Fechar configuracao de conexao"
            >
              <Ionicons name="close" size={20} color={DOMUS_THEME.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Status Atual */}
            <View
              style={[
                styles.statusBox,
                apiOnline ? styles.statusBoxOnline : styles.statusBoxOffline,
              ]}
              testID="modal-status-box"
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: apiOnline
                      ? DOMUS_THEME.success
                      : DOMUS_THEME.danger,
                  },
                ]}
              />
              <View style={styles.statusTextGroup}>
                <Text style={styles.statusLabel}>
                  {apiOnline
                    ? 'Status: API Online (Banco SQLite Ativo)'
                    : 'Status: API Offline (Sem Conexão)'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {apiOnline
                    ? `Sincronizando em tempo real com ${domusApi.baseUrl}`
                    : 'Não foi possível conectar ao servidor backend. Verifique a URL e a rede.'}
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
            </View>

            {/* Guia Rapido de IPs */}
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>Dicas de Rede:</Text>
              <Text style={styles.guideItem}>
                - No Celular via USB: Execute &apos;adb reverse tcp:3000 tcp:3000&apos; e use http://localhost:3000/api
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderColor: DOMUS_THEME.dangerBorder,
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
    borderWidth: 1,
    borderColor: DOMUS_THEME.successBorder,
  },
  feedbackError: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
  },
  feedbackInfo: {
    backgroundColor: DOMUS_THEME.infoSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.infoBorder,
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
  pressedFeedback: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  guideBox: {
    marginTop: DOMUS_SPACING.lg,
    padding: DOMUS_SPACING.md,
    backgroundColor: DOMUS_THEME.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
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
