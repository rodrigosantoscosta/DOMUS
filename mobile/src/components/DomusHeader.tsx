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
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import { triggerLightImpact, triggerMediumImpact } from '../utils/haptics';
import { useSafeState, useSafeRef, useSafeEffect } from '../utils/safeHooks';

export interface DomusHeaderProps {
  titulo?: string;
  usuarioNome?: string;
  modoOffline?: boolean;
  confirmarResetEmDoisToques?: boolean;
  onLogout?: () => void;
  onResetDemo?: () => void;
  onPressStatus?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DomusHeader: React.FC<DomusHeaderProps> = ({
  titulo = 'DOMUS',
  usuarioNome,
  modoOffline = true,
  confirmarResetEmDoisToques = false,
  onLogout,
  onResetDemo,
  onPressStatus,
  style,
}) => {
  const [confirmandoReset, setConfirmandoReset] = useSafeState<boolean>(false);
  const resetTimerRef = useSafeRef<NodeJS.Timeout | null>(null);

  useSafeEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const handlePressResetDemo = () => {
    if (!onResetDemo) return;

    if (!confirmarResetEmDoisToques) {
      onResetDemo();
      return;
    }

    if (!confirmandoReset) {
      setConfirmandoReset(true);
      triggerLightImpact();
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      const timer = setTimeout(() => {
        setConfirmandoReset(false);
      }, 3500);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
      resetTimerRef.current = timer;
    } else {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      setConfirmandoReset(false);
      triggerMediumImpact();
      onResetDemo();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container} testID="domus-header">
        {/* Linha Superior: Marca e Status */}
        <View style={styles.topRow}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIconWrapper}>
              <Ionicons
                name="home"
                size={20}
                color={DOMUS_THEME.primary}
                testID="icon-brand-home"
              />
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

          <TouchableOpacity
            style={[
              styles.statusBadge,
              modoOffline ? styles.statusBadgeOffline : styles.statusBadgeOnline,
            ]}
            onPress={onPressStatus}
            activeOpacity={onPressStatus ? 0.7 : 1}
            disabled={!onPressStatus}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            testID="header-status-badge"
            accessibilityRole="button"
            accessibilityLabel={`Status: ${modoOffline ? 'Modo Demo Local' : 'API Online'}`}
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
            <Text
              style={[
                styles.statusText,
                {
                  color: modoOffline
                    ? DOMUS_THEME.warning
                    : DOMUS_THEME.success,
                },
              ]}
            >
              {modoOffline ? 'Modo Demo Local' : 'API Online'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Linha Inferior: Botoes de Acao (Reset Demo e Sair) */}
        {(onResetDemo || onLogout) && (
          <View style={styles.actionsRow}>
            {onResetDemo ? (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  confirmandoReset && styles.actionButtonConfirming,
                ]}
                onPress={handlePressResetDemo}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                testID="btn-header-reset-demo"
                accessibilityLabel={
                  confirmandoReset
                    ? 'Confirmar Reset?'
                    : 'Resetar dados de demonstracao'
                }
                accessibilityRole="button"
              >
                <Ionicons
                  name={confirmandoReset ? 'alert-circle' : 'refresh-outline'}
                  size={15}
                  color={
                    confirmandoReset
                      ? DOMUS_THEME.primaryText
                      : DOMUS_THEME.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    confirmandoReset && styles.actionButtonTextConfirming,
                  ]}
                >
                  {confirmandoReset ? 'Confirmar Reset?' : 'Reset Demo'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {onLogout ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
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
              </TouchableOpacity>
            ) : null}
          </View>
        )}
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
    backgroundColor: DOMUS_THEME.warningSoft,
    borderColor: DOMUS_THEME.warningBorder,
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
  actionButtonConfirming: {
    backgroundColor: DOMUS_THEME.danger,
    borderColor: DOMUS_THEME.danger,
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
  actionButtonTextConfirming: {
    color: DOMUS_THEME.primaryText,
    fontWeight: '700',
  },
});

export default DomusHeader;
