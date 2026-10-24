import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { DOMUS_THEME, DOMUS_SPACING } from '../theme/tokens';
import { useSafeState } from '../utils/safeHooks';

export interface DomusInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const DomusInput: React.FC<DomusInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  style,
  testID,
  placeholderTextColor = DOMUS_THEME.textMuted,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focado, setFocado] = useSafeState<boolean>(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} testID={testID ? `${testID}-label` : undefined}>
          {label}
        </Text>
      ) : null}

      <TextInput
        style={[
          styles.input,
          focado && styles.inputFocado,
          error ? styles.inputError : null,
          inputStyle,
          style,
        ]}
        placeholderTextColor={placeholderTextColor}
        testID={testID}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
        {...rest}
      />

      {error ? (
        <Text
          style={styles.errorText}
          testID={testID ? `${testID}-error` : undefined}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DOMUS_SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 15,
    color: '#0F172A',
  },
  inputFocado: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EA580C',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
});

export default DomusInput;
