import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  MENSAGEM_BANNER_AVISOS,
} from '../theme/tokens';
import { triggerLightImpact } from '../utils/haptics';

export interface AvisoBannerProps {
  visivel?: boolean;
  mensagem?: string;
  totalProximos?: number;
  totalAtrasados?: number;
  totalSemData?: number;
  onFechar?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const AvisoBanner: React.FC<AvisoBannerProps> = ({
  visivel = true,
  mensagem = MENSAGEM_BANNER_AVISOS,
  totalProximos = 0,
  totalAtrasados = 0,
  totalSemData = 0,
  onFechar,
  style,
  testID = 'aviso-banner',
}) => {
  if (!visivel) return null;

  const handleFechar = () => {
    triggerLightImpact();
    onFechar?.();
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.topRow}>
        <View style={styles.iconWrapper}>
          <Ionicons name="notifications-outline" size={18} color="#D97706" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>Avisos e Lembretes</Text>
          <Text style={styles.bannerMessage}>{mensagem}</Text>
        </View>
        {onFechar ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleFechar}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="btn-fechar-aviso"
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
          >
            <Ionicons name="close" size={18} color="#92400E" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.pillsRow}>
        <View style={[styles.pill, styles.pillProximos]}>
          <Ionicons name="time-outline" size={12} color="#B45309" />
          <Text style={styles.pillProximosText}>
            {`${totalProximos} ${totalProximos === 1 ? 'Próximo' : 'Próximos'}`}
          </Text>
        </View>

        {totalAtrasados > 0 && (
          <View style={[styles.pill, styles.pillAtrasados]}>
            <Ionicons name="alert-circle-outline" size={12} color="#DC2626" />
            <Text style={styles.pillAtrasadosText}>
              {`${totalAtrasados} ${totalAtrasados === 1 ? 'Atrasado' : 'Atrasados'}`}
            </Text>
          </View>
        )}

        {totalSemData > 0 && (
          <View style={[styles.pill, styles.pillSemData]}>
            <Ionicons name="help-circle-outline" size={12} color="#475569" />
            <Text style={styles.pillSemDataText}>
              {`${totalSemData} Sem data`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DOMUS_SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: DOMUS_SPACING.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  pillProximos: {
    backgroundColor: '#FEF3C7',
  },
  pillProximosText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pillAtrasados: {
    backgroundColor: '#FEE2E2',
  },
  pillAtrasadosText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  pillSemData: {
    backgroundColor: '#F1F5F9',
  },
  pillSemDataText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});

export default AvisoBanner;
