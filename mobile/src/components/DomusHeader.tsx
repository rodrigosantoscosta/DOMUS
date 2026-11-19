import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StyleProp,
  ViewStyle,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import { useSafeState } from '../utils/safeHooks';

const domusLogo = require('../../assets/logo.png');

export interface DomusHeaderProps {
  titulo?: string;
  usuarioNome?: string;
  apiOnline?: boolean;
  onLogout?: () => void;
  onPressStatus?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DomusHeader: React.FC<DomusHeaderProps> = ({
  titulo = 'DOMUS',
  usuarioNome,
  apiOnline = true,
  onLogout,
  onPressStatus,
  style,
}) => {
  const [logoErro, setLogoErro] = useSafeState<boolean>(false);

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container} testID="domus-header">
        {/* Linha Superior: Marca e Status */}
        <View style={styles.topRow}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIconWrapper}>
              {!logoErro ? (
                <Image
                  source={domusLogo}
                  style={styles.brandLogo}
                  resizeMode="contain"
                  testID="domus-header-logo"
                  onError={() => setLogoErro(true)}
                  accessibilityRole="image"
                  accessibilityLabel="Logotipo DOMUS"
                />
              ) : (
                <Ionicons
                  name="home"
                  size={20}
                  color={DOMUS_THEME.primary}
                  testID="icon-brand-home"
                />
              )}
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.title} testID="header-title">
                {titulo}
              </Text>
              {usuarioNome ? (
                <View style={styles.userBadge} testID="header-user-badge">
                  <Ionicons
                    name="person-circle-outline"
                    size={14}
                    color={DOMUS_THEME.textSecondary}
                  />
                  <Text style={styles.userText} numberOfLines={1}>
                    {usuarioNome}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.statusBadge,
              apiOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline,
              pressed && onPressStatus ? styles.statusBadgePressed : null,
            ]}
            onPress={onPressStatus}
            disabled={!onPressStatus}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            testID="header-status-badge"
            accessibilityRole="button"
            accessibilityLabel={`Status: ${apiOnline ? 'API Online' : 'API Offline'}`}
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
            <Text
              style={[
                styles.statusText,
                {
                  color: apiOnline
                    ? DOMUS_THEME.success
                    : DOMUS_THEME.danger,
                },
              ]}
            >
              {apiOnline ? 'API Online' : 'API Offline'}
            </Text>
          </Pressable>
        </View>

        {/* Linha Inferior: Botao de Acao (Sair) */}
        {onLogout ? (
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.logoutButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={onLogout}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              testID="btn-header-logout"
              accessibilityLabel="Sair do aplicativo"
              accessibilityRole="button"
            >
              <Ionicons
                name="log-out-outline"
                size={15}
                color={DOMUS_THEME.danger}
              />
              <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
                Sair
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: DOMUS_THEME.surface,
  },
  container: {
    backgroundColor: DOMUS_THEME.surface,
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingTop: DOMUS_SPACING.sm,
    paddingBottom: DOMUS_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOMUS_SPACING.sm,
    flex: 1,
    marginRight: DOMUS_SPACING.sm,
  },
  brandIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DOMUS_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: DOMUS_THEME.textPrimary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: DOMUS_SPACING.md,
    paddingVertical: 4,
    borderRadius: DOMUS_RADIUS.pill,
    borderWidth: 1,
  },
  statusBadgeOffline: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderColor: DOMUS_THEME.dangerBorder,
  },
  statusBadgeOnline: {
    backgroundColor: DOMUS_THEME.successSoft,
    borderColor: DOMUS_THEME.successBorder,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: DOMUS_SPACING.xs + 2,
    gap: DOMUS_SPACING.sm,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    color: DOMUS_THEME.textSecondary,
    maxWidth: 160,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    backgroundColor: DOMUS_THEME.surfaceElevated,
    paddingHorizontal: DOMUS_SPACING.md,
    paddingVertical: DOMUS_SPACING.xs,
    borderRadius: DOMUS_RADIUS.pill,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    gap: 6,
  },
  logoutButton: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderColor: DOMUS_THEME.dangerBorder,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
  },
  logoutButtonText: {
    color: DOMUS_THEME.danger,
  },
  statusBadgePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});

export default DomusHeader;
