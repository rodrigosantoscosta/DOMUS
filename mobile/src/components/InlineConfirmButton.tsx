import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';
import { triggerLightImpact, triggerMediumImpact } from '../utils/haptics';
import { useSafeState, useSafeRef, useSafeEffect } from '../utils/safeHooks';

export type InlineConfirmVariant = 'danger' | 'warning' | 'neutral';

export interface InlineConfirmButtonProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: InlineConfirmVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  timeoutMs?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const InlineConfirmButton: React.FC<InlineConfirmButtonProps> = ({
  label,
  confirmLabel = 'Toque para confirmar',
  onConfirm,
  variant = 'danger',
  iconName,
  timeoutMs = 3500,
  testID,
  style,
  accessibilityLabel,
}) => {
  const [confirming, setConfirming] = useSafeState<boolean>(false);
  const timerRef = useSafeRef<NodeJS.Timeout | null>(null);

  const limparTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useSafeEffect(() => {
    return () => {
      limparTimer();
    };
  }, []);

  const handlePress = () => {
    if (!confirming) {
      limparTimer();
      setConfirming(true);
      triggerLightImpact();
      const timer = setTimeout(() => {
        setConfirming(false);
      }, timeoutMs);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
      timerRef.current = timer;
    } else {
      limparTimer();
      setConfirming(false);
      triggerMediumImpact();
      onConfirm();
    }
  };

  const getContainerStyle = () => {
    if (confirming) {
      return styles.confirmingContainer;
    }
    switch (variant) {
      case 'warning':
        return styles.warningContainer;
      case 'neutral':
        return styles.neutralContainer;
      case 'danger':
      default:
        return styles.dangerContainer;
    }
  };

  const getTextColor = () => {
    if (confirming) {
      return DOMUS_COLORS.white;
    }
    switch (variant) {
      case 'neutral':
        return DOMUS_COLORS.textDark;
      case 'warning':
      case 'danger':
      default:
        return DOMUS_COLORS.white;
    }
  };

  const currentIcon: keyof typeof Ionicons.glyphMap | undefined = confirming
    ? 'alert-circle'
    : iconName;

  return (
    <TouchableOpacity
      style={[styles.baseButton, getContainerStyle(), style]}
      onPress={handlePress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (confirming ? confirmLabel : label)
      }
      accessibilityState={{ selected: confirming }}
      activeOpacity={0.85}
    >
      <View style={styles.contentRow}>
        {currentIcon ? (
          <Ionicons
            name={currentIcon}
            size={16}
            color={getTextColor()}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.label, { color: getTextColor() }]}>
          {confirming ? confirmLabel : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: DOMUS_SPACING.md,
    paddingVertical: DOMUS_SPACING.sm,
    borderRadius: DOMUS_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: DOMUS_SPACING.xs,
  },
  label: {
    ...DOMUS_TYPOGRAPHY.button,
    fontSize: 13,
    fontWeight: '600',
  },
  dangerContainer: {
    backgroundColor: DOMUS_COLORS.statusDanger,
  },
  warningContainer: {
    backgroundColor: DOMUS_COLORS.statusWarning,
  },
  neutralContainer: {
    backgroundColor: DOMUS_COLORS.surfaceInput,
    borderWidth: 1,
    borderColor: DOMUS_COLORS.border,
  },
  confirmingContainer: {
    backgroundColor: '#B71C1C',
  },
});

export default InlineConfirmButton;
