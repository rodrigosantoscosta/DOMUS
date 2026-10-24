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
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export interface DomusButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
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
  icon,
  testID,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const buttonText = title || label || '';
  const isBloqueado = disabled || loading;

  const getContainerStyle = () => {
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
    switch (variant) {
      case 'danger':
        return DOMUS_COLORS.white;
      case 'outline':
        return DOMUS_COLORS.primaryOrange;
      default:
        return DOMUS_COLORS.primaryButtonText;
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
        style,
      ]}
      onPress={handlePress}
      disabled={isBloqueado}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || buttonText}
      accessibilityState={{ disabled: isBloqueado, busy: loading }}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIndicatorColor()}
          testID={testID ? `${testID}-loading` : undefined}
        />
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
    paddingVertical: DOMUS_SPACING.md,
    paddingHorizontal: DOMUS_SPACING.lg,
    borderRadius: DOMUS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: DOMUS_SPACING.sm,
  },
  primaryContainer: {
    backgroundColor: DOMUS_COLORS.primaryOrange,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  secondaryContainer: {
    backgroundColor: DOMUS_COLORS.surfaceInput,
  },
  dangerContainer: {
    backgroundColor: DOMUS_COLORS.statusDanger,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: DOMUS_COLORS.primaryOrange,
  },
  disabledContainer: {
    opacity: 0.55,
  },
  baseText: {
    ...DOMUS_TYPOGRAPHY.button,
  },
  primaryText: {
    color: DOMUS_COLORS.primaryButtonText,
  },
  secondaryText: {
    color: DOMUS_COLORS.textDark,
  },
  dangerText: {
    color: DOMUS_COLORS.white,
  },
  outlineText: {
    color: DOMUS_COLORS.primaryOrange,
  },
});

export default DomusButton;
