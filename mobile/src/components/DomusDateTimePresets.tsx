import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import {
  adicionarDiasDataBr,
} from '../utils/formatters';
import { triggerSelectionHaptic } from '../utils/haptics';

export interface DomusDateTimePresetsProps {
  dataAtual?: string;
  horaAtual?: string;
  onSelectData?: (novaData: string) => void;
  onSelectHora?: (novaHora: string) => void;
  testIDPrefix?: string;
  mostrarData?: boolean;
  mostrarHora?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export interface PresetDataOpcao {
  id: string;
  label: string;
  valor: string;
}

const HORARIOS_PRESET_PADRAO = ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00'];



export const DomusDateTimePresets: React.FC<DomusDateTimePresetsProps> = ({
  dataAtual = '',
  horaAtual = '',
  onSelectData,
  onSelectHora,
  testIDPrefix = 'agendar',
  mostrarData = true,
  mostrarHora = true,
  containerStyle,
}) => {
  // Calculo de presets de data relativos ao dia de hoje
  const presetsData = useMemo<PresetDataOpcao[]>(() => {
    return [
      { id: 'hoje', label: 'Hoje', valor: adicionarDiasDataBr(0) },
      { id: 'amanha', label: 'Amanhã', valor: adicionarDiasDataBr(1) },
      { id: '3dias', label: '+3 dias', valor: adicionarDiasDataBr(3) },
      { id: '7dias', label: '+7 dias', valor: adicionarDiasDataBr(7) },
    ];
  }, []);

  const handleToqueData = useCallback(
    (valor: string) => {
      triggerSelectionHaptic();
      onSelectData?.(valor);
    },
    [onSelectData]
  );

  const handleToqueHora = useCallback(
    (valor: string) => {
      triggerSelectionHaptic();
      onSelectHora?.(valor);
    },
    [onSelectHora]
  );

  return (
    <View style={[styles.container, containerStyle]} testID={`${testIDPrefix}-presets-container`}>
      {/* Pilulas de Atalho para Data */}
      {mostrarData && onSelectData && (
        <View style={styles.secao}>
          <Text style={styles.secaoRotulo}>Atalhos de data:</Text>
          <View style={styles.chipsRow}>
            {presetsData.map((item) => {
              const ativo = dataAtual === item.valor;
              return (
                <Pressable
                  key={item.id}
                  testID={`chip-data-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Definir data para ${item.label}`}
                  accessibilityState={{ selected: ativo }}
                  onPress={() => handleToqueData(item.valor)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [
                    styles.chip,
                    ativo && styles.chipAtivo,
                    pressed && styles.pressedScale,
                  ]}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Pilulas de Atalho para Horarios Comerciais */}
      {mostrarHora && onSelectHora && (
        <View style={[styles.secao, mostrarData && styles.secaoEspacada]}>
          <Text style={styles.secaoRotulo}>Horários rápidos:</Text>
          <View style={styles.chipsRow}>
            {HORARIOS_PRESET_PADRAO.map((slot) => {
              const ativo = horaAtual === slot;
              const testIdSlot = slot.replace(':', '-');
              return (
                <Pressable
                  key={slot}
                  testID={`chip-hora-${testIdSlot}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Definir horário para ${slot}`}
                  accessibilityState={{ selected: ativo }}
                  onPress={() => handleToqueHora(slot)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [
                    styles.chip,
                    ativo && styles.chipAtivo,
                    pressed && styles.pressedScale,
                  ]}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: DOMUS_SPACING.xs,
    marginBottom: DOMUS_SPACING.xs,
  },
  secao: {
    gap: 4,
  },
  secaoEspacada: {
    marginTop: DOMUS_SPACING.xs,
  },
  secaoRotulo: {
    fontSize: 11,
    fontWeight: '500',
    color: DOMUS_THEME.textSecondary,
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOMUS_SPACING.xs,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DOMUS_RADIUS.pill,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAtivo: {
    backgroundColor: DOMUS_THEME.primarySoft,
    borderColor: DOMUS_THEME.primaryBorder,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  chipTextoAtivo: {
    color: DOMUS_THEME.primary,
    fontWeight: '700',
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
});

export default DomusDateTimePresets;
