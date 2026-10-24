import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';

export interface DomusHeaderProps {
  titulo?: string;
  usuarioNome?: string;
  modoOffline?: boolean;
  onLogout?: () => void;
  onResetDemo?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DomusHeader: React.FC<DomusHeaderProps> = ({
  titulo = 'DOMUS',
  usuarioNome,
  modoOffline = true,
  onLogout,
  onResetDemo,
  style,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container} testID="domus-header">
        <View style={styles.brandRow}>
          <View style={styles.brandGroup}>
            <Ionicons
              name="home"
              size={24}
              color={DOMUS_COLORS.headerText}
              style={styles.brandIcon}
              testID="icon-brand-home"
            />
            <Text style={styles.title} testID="header-title">
              {titulo}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              modoOffline ? styles.statusBadgeOffline : styles.statusBadgeOnline,
            ]}
            testID="header-status-badge"
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: modoOffline
                    ? DOMUS_COLORS.statusWarning
                    : DOMUS_COLORS.statusSuccess,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {modoOffline ? 'Modo Demo Local' : 'API Online'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {usuarioNome ? (
            <View style={styles.userBadge} testID="header-user-badge">
              <Ionicons
                name="person-circle-outline"
                size={16}
                color={DOMUS_COLORS.textDark}
              />
              <Text style={styles.userText} numberOfLines={1}>
                {usuarioNome}
              </Text>
            </View>
          ) : null}

          {onResetDemo ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onResetDemo}
              testID="btn-header-reset-demo"
              accessibilityLabel="Resetar dados de demonstração"
              accessibilityRole="button"
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={DOMUS_COLORS.textDark}
              />
              <Text style={styles.actionButtonText}>Reset Demo</Text>
            </TouchableOpacity>
          ) : null}

          {onLogout ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={onLogout}
              testID="btn-header-logout"
              accessibilityLabel="Sair do aplicativo"
              accessibilityRole="button"
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={DOMUS_COLORS.textDark}
              />
              <Text style={styles.actionButtonText}>Sair</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: DOMUS_COLORS.headerBg,
  },
  container: {
    backgroundColor: DOMUS_COLORS.headerBg,
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingTop: DOMUS_SPACING.sm,
    paddingBottom: DOMUS_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_COLORS.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: DOMUS_SPACING.sm,
  },
  title: {
    ...DOMUS_TYPOGRAPHY.title,
    color: DOMUS_COLORS.headerText,
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: 3,
    borderRadius: DOMUS_RADIUS.pill,
  },
  statusBadgeOffline: {
    backgroundColor: '#FFE8CC',
  },
  statusBadgeOnline: {
    backgroundColor: '#D1E7DD',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_COLORS.textDark,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: DOMUS_SPACING.xs,
    gap: DOMUS_SPACING.sm,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
    gap: 4,
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    color: DOMUS_COLORS.textDark,
    maxWidth: 120,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: DOMUS_SPACING.sm,
    paddingVertical: 4,
    borderRadius: DOMUS_RADIUS.sm,
    gap: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_COLORS.textDark,
  },
});

export default DomusHeader;
