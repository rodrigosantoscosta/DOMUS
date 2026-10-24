import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';
import { triggerLightImpact } from '../utils/haptics';
import { EASE_OUT, projectVelocity } from '../utils/motion';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface DomusToastProps {
  visivel: boolean;
  mensagem: string | null;
  tipo?: ToastTipo;
  onDismiss: () => void;
  durationMs?: number;
  testID?: string;
}

export const DomusToast: React.FC<DomusToastProps> = ({
  visivel,
  mensagem,
  tipo = 'info',
  onDismiss,
  durationMs = 3200,
  testID = 'domus-toast',
}) => {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(visivel ? 0 : -80);
  const scale = useSharedValue(visivel ? 1 : 0.95);
  const opacity = useSharedValue(visivel ? 1 : 0);
  const dragContext = useSharedValue(0);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const limparTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    limparTimer();
    const exitDuration = reducedMotion ? 1 : 180;
    translateY.set(
      withTiming(-80, { duration: exitDuration, easing: EASE_OUT }, () => {
        runOnJS(onDismiss)();
      })
    );
    scale.set(withTiming(0.95, { duration: exitDuration, easing: EASE_OUT }));
    opacity.set(withTiming(0, { duration: exitDuration, easing: EASE_OUT }));
  }, [limparTimer, onDismiss, reducedMotion, translateY, scale, opacity]);

  useEffect(() => {
    limparTimer();

    if (visivel && mensagem) {
      translateY.set(
        withSpring(0, { duration: reducedMotion ? 1 : 300, dampingRatio: 0.85 })
      );
      scale.set(
        withTiming(1, { duration: reducedMotion ? 1 : 200, easing: EASE_OUT })
      );
      opacity.set(
        withTiming(1, { duration: reducedMotion ? 1 : 200, easing: EASE_OUT })
      );

      const timer = setTimeout(() => {
        handleDismiss();
      }, durationMs);

      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
      dismissTimerRef.current = timer;
    } else {
      translateY.set(withTiming(-80, { duration: 180, easing: EASE_OUT }));
      scale.set(withTiming(0.95, { duration: 180, easing: EASE_OUT }));
      opacity.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
    }

    return () => {
      limparTimer();
    };
  }, [visivel, mensagem, durationMs, limparTimer, handleDismiss, reducedMotion, translateY, scale, opacity]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onStart(() => {
          'worklet';
          dragContext.set(translateY.get());
        })
        .onUpdate((e) => {
          'worklet';
          const next = dragContext.get() + e.translationY;
          if (next < 0) {
            translateY.set(next);
          }
        })
        .onEnd((e) => {
          'worklet';
          const projected = translateY.get() + projectVelocity(e.velocityY);
          if (projected < -24 || e.velocityY < -300) {
            translateY.set(
              withTiming(-80, { duration: 150, easing: EASE_OUT }, () => {
                runOnJS(onDismiss)();
              })
            );
            opacity.set(withTiming(0, { duration: 150, easing: EASE_OUT }));
          } else {
            translateY.set(
              withSpring(0, { duration: 250, dampingRatio: 0.85, velocity: e.velocityY })
            );
          }
        }),
    [dragContext, translateY, opacity, onDismiss]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
      opacity: opacity.get(),
    };
  });

  if (!visivel || !mensagem) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (tipo) {
      case 'sucesso':
        return '#1B5E20';
      case 'erro':
        return '#B71C1C';
      case 'info':
      default:
        return '#0D47A1';
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (tipo) {
      case 'sucesso':
        return 'checkmark-circle';
      case 'erro':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  return (
    <View
      style={[styles.outerContainer, { top: Math.max(insets.top + 8, 48) }]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.toastCard,
            { backgroundColor: getBackgroundColor() },
            animatedStyle,
          ]}
          testID={testID}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.contentRow}>
            <Ionicons
              name={getIconName()}
              size={20}
              color={DOMUS_COLORS.white}
              style={styles.icon}
            />
            <Text style={styles.messageText} numberOfLines={3}>
              {mensagem}
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerLightImpact();
                handleDismiss();
              }}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              testID={`${testID}-btn-fechar`}
            >
              <Ionicons name="close" size={18} color={DOMUS_COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 50,
    left: DOMUS_SPACING.md,
    right: DOMUS_SPACING.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 500,
    minHeight: 48,
    borderRadius: DOMUS_RADIUS.md,
    paddingHorizontal: DOMUS_SPACING.md,
    paddingVertical: DOMUS_SPACING.sm + 2,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: DOMUS_SPACING.sm,
  },
  messageText: {
    ...DOMUS_TYPOGRAPHY.body,
    color: DOMUS_COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: DOMUS_SPACING.xs,
  },
});

export default DomusToast;
