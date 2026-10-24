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
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';

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
  placeholderTextColor = DOMUS_COLORS.mutedText,
  ...rest
}) => {
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
          error ? styles.inputError : null,
          inputStyle,
          style,
        ]}
        placeholderTextColor={placeholderTextColor}
        testID={testID}
        accessibilityLabel={label}
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
    ...DOMUS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: DOMUS_COLORS.textDark,
    marginBottom: DOMUS_SPACING.xs,
  },
  input: {
    backgroundColor: DOMUS_COLORS.surfaceInput,
    borderRadius: DOMUS_RADIUS.md,
    paddingHorizontal: DOMUS_SPACING.md,
    paddingVertical: DOMUS_SPACING.sm + 2,
    fontSize: 15,
    color: DOMUS_COLORS.textDark,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  inputError: {
    borderColor: DOMUS_COLORS.statusDanger,
    backgroundColor: '#FFEAEA',
  },
  errorText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.statusDanger,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    ...DOMUS_TYPOGRAPHY.caption,
    color: DOMUS_COLORS.mutedText,
    marginTop: 4,
  },
});

export default DomusInput;
