import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DOMUS_THEME, DOMUS_SPACING } from '../theme/tokens';
import { useSafeState } from '../utils/safeHooks';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export interface DomusButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  success?: boolean;
  successLabel?: string;
  icon?: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const DomusButton: React.FC<DomusButtonProps> = ({
  title,
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingLabel,
  success = false,
  successLabel,
  icon,
  testID,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const [isPressed, setIsPressed] = useSafeState<boolean>(false);
  const buttonText = title || label || '';
  const isBloqueado = disabled || loading;

  const getContainerStyle = () => {
    if (success) {
      return styles.successContainer;
    }
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    if (success) {
      return styles.successLabelText;
    }
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'outline':
        return styles.outlineText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getIndicatorColor = () => {
    if (success) return DOMUS_THEME.surface;
    switch (variant) {
      case 'secondary':
        return DOMUS_THEME.textPrimary;
      case 'outline':
        return DOMUS_THEME.primary;
      case 'danger':
      case 'primary':
      default:
        return DOMUS_THEME.surface;
    }
  };

  const handlePress = () => {
    if (isBloqueado || !onPress) return;
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        isBloqueado && styles.disabledContainer,
        isPressed && !isBloqueado && styles.pressedScale,
        style,
      ]}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isBloqueado}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || buttonText}
      accessibilityState={{ disabled: isBloqueado, busy: loading }}
      activeOpacity={0.88}
    >
      {loading ? (
        loadingLabel ? (
          <View style={styles.contentRow}>
            <ActivityIndicator
              size="small"
              color={getIndicatorColor()}
              testID={testID ? `${testID}-loading` : undefined}
            />
            <Text
              style={[
                styles.baseText,
                getTextStyle(),
                styles.loadingLabelText,
                textStyle,
              ]}
            >
              {loadingLabel}
            </Text>
          </View>
        ) : (
          <ActivityIndicator
            size="small"
            color={getIndicatorColor()}
            testID={testID ? `${testID}-loading` : undefined}
          />
        )
      ) : success ? (
        <View style={styles.contentRow}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={DOMUS_THEME.surface}
            style={styles.iconWrapper}
            testID={testID ? `${testID}-success-icon` : undefined}
          />
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              textStyle,
            ]}
          >
            {successLabel || buttonText}
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {buttonText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    paddingVertical: 12,
    paddingHorizontal: DOMUS_SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: DOMUS_SPACING.sm,
  },
  loadingLabelText: {
    marginLeft: DOMUS_SPACING.sm,
  },
  primaryContainer: {
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  dangerContainer: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  successContainer: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disabledContainer: {
    opacity: 0.55,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#0F172A',
  },
  outlineText: {
    color: '#EA580C',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  successLabelText: {
    color: '#FFFFFF',
  },
});

export default DomusButton;
