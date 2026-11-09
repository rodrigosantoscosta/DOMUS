import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
} from '../theme/tokens';
import {
  validarDataBr,
  validarHora,
  stringBrParaData,
  dataParaStringBr,
  NOMES_MESES_BR,
  gerarDiasCalendarioMes,
  ajustarMinutosHoraBr,
} from '../utils/formatters';
import { triggerLightImpact, triggerSelectionHaptic } from '../utils/haptics';

export interface DomusWebPickerModalProps {
  visivel: boolean;
  tipo: 'date' | 'time';
  valorAtual: string;
  onConfirmar: (novoValor: string) => void;
  onFechar: () => void;
  testIDPrefix?: string;
}

const HORARIOS_COMERCIAIS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00',
];

export const DomusWebPickerModal: React.FC<DomusWebPickerModalProps> = ({
  visivel,
  tipo,
  valorAtual,
  onConfirmar,
  onFechar,
  testIDPrefix = 'web-picker',
}) => {
  const agora = useMemo(() => new Date(), []);
  const hojeStr = useMemo(() => dataParaStringBr(agora), [agora]);

  // Estados locais para Modo Data
  const [dataTemp, setDataTemp] = useState<string>(valorAtual || hojeStr);
  const [ano, setAno] = useState<number>(() => {
    const d = stringBrParaData(valorAtual);
    return d.getFullYear();
  });
  const [mes, setMes] = useState<number>(() => {
    const d = stringBrParaData(valorAtual);
    return d.getMonth();
  });

  // Estado local para Modo Hora
  const [horaTemp, setHoraTemp] = useState<string>(valorAtual || '14:00');

  useEffect(() => {
    if (visivel) {
      if (tipo === 'date') {
        const val = valorAtual && validarDataBr(valorAtual) ? valorAtual : hojeStr;
        setDataTemp(val);
        const d = stringBrParaData(val);
        setAno(d.getFullYear());
        setMes(d.getMonth());
      } else {
        const val = valorAtual && validarHora(valorAtual) ? valorAtual : '14:00';
        setHoraTemp(val);
      }
    }
  }, [visivel, tipo, valorAtual, hojeStr]);

  const handleMesAnterior = useCallback(() => {
    triggerLightImpact();
    setMes((prev) => {
      if (prev === 0) {
        setAno((a) => a - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleProximoMes = useCallback(() => {
    triggerLightImpact();
    setMes((prev) => {
      if (prev === 11) {
        setAno((a) => a + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleSelecionarDia = useCallback((dataBr: string) => {
    triggerSelectionHaptic();
    setDataTemp(dataBr);
  }, []);

  const handleIrParaHoje = useCallback(() => {
    triggerLightImpact();
    setDataTemp(hojeStr);
    setAno(agora.getFullYear());
    setMes(agora.getMonth());
  }, [hojeStr, agora]);

  const handleAjustarHora = useCallback((deltaMin: number) => {
    triggerLightImpact();
    setHoraTemp((prev) => ajustarMinutosHoraBr(prev, deltaMin));
  }, []);

  const handleSelecionarSlotHora = useCallback((slot: string) => {
    triggerSelectionHaptic();
    setHoraTemp(slot);
  }, []);

  const handleConfirmar = useCallback(() => {
    triggerSelectionHaptic();
    if (tipo === 'date') {
      onConfirmar(dataTemp);
    } else {
      onConfirmar(horaTemp);
    }
    onFechar();
  }, [tipo, dataTemp, horaTemp, onConfirmar, onFechar]);

  const diasGrade = useMemo(() => {
    return gerarDiasCalendarioMes(ano, mes);
  }, [ano, mes]);

  if (!visivel) return null;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      testID={`${testIDPrefix}-modal`}
    >
      <Pressable style={styles.backdrop} onPress={onFechar}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
          
          {tipo === 'date' ? (
            /* CONTEUDO DO CALENDARIO */
            <View>
              {/* Cabecalho Mes/Ano */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.subtituloModal}>Selecionar Data</Text>
                  <Text style={styles.tituloModal}>
                    {NOMES_MESES_BR[mes]} de {ano}
                  </Text>
                </View>
                <View style={styles.setasRow}>
                  <Pressable
                    onPress={handleMesAnterior}
                    testID={`${testIDPrefix}-btn-mes-anterior`}
                    style={({ pressed }) => [styles.btnSeta, pressed && styles.pressedScale]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Mês anterior"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={18} color={DOMUS_THEME.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={handleProximoMes}
                    testID={`${testIDPrefix}-btn-proximo-mes`}
                    style={({ pressed }) => [styles.btnSeta, pressed && styles.pressedScale]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Próximo mês"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-forward" size={18} color={DOMUS_THEME.textPrimary} />
                  </Pressable>
                </View>
              </View>

              {/* Dias da Semana */}
              <View style={styles.semanaRow}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((letra, i) => (
                  <Text key={`${letra}-${i}`} style={styles.diaSemanaTexto}>
                    {letra}
                  </Text>
                ))}
              </View>

              {/* Grade de Dias */}
              <View style={styles.diasGrid}>
                {diasGrade.map((item, idx) => {
                  const isSelected = dataTemp === item.dataBr;
                  const isHoje = hojeStr === item.dataBr;

                  return (
                    <Pressable
                      key={`${item.dataBr}-${idx}`}
                      onPress={() => handleSelecionarDia(item.dataBr)}
                      style={({ pressed }) => [
                        styles.diaBotao,
                        isSelected && styles.diaBotaoSelecionado,
                        isHoje && !isSelected && styles.diaBotaoHoje,
                        pressed && styles.pressedScale,
                      ]}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    >
                      <Text
                        style={[
                          styles.diaTexto,
                          !item.mesAtual && styles.diaTextoOutroMes,
                          isSelected && styles.diaTextoSelecionado,
                          isHoje && !isSelected && styles.diaTextoHoje,
                        ]}
                      >
                        {item.dia}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Rodape de Acoes */}
              <View style={styles.footerRow}>
                <Pressable
                  onPress={handleIrParaHoje}
                  style={({ pressed }) => [styles.btnHoje, pressed && styles.pressedScale]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.btnHojeTexto}>Hoje</Text>
                </Pressable>

                <View style={styles.botoesAcaoDireita}>
                  <Pressable
                    onPress={onFechar}
                    style={({ pressed }) => [styles.btnSecundario, pressed && styles.pressedScale]}
                  >
                    <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmar}
                    testID={`${testIDPrefix}-btn-confirmar`}
                    style={({ pressed }) => [styles.btnPrimario, pressed && styles.pressedScale]}
                  >
                    <Text style={styles.btnPrimarioTexto}>Confirmar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            /* CONTEUDO DO RELOGIO / HORARIO */
            <View>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.subtituloModal}>Selecionar Horário</Text>
                  <Text style={styles.tituloModal}>Horário da Visita</Text>
                </View>
                <View style={styles.visorHoraRow}>
                  <Pressable
                    onPress={() => handleAjustarHora(-15)}
                    style={({ pressed }) => [styles.btnAjusteMin, pressed && styles.pressedScale]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.btnAjusteMinTexto}>-15m</Text>
                  </Pressable>
                  <Text style={styles.visorHoraTexto}>{horaTemp}</Text>
                  <Pressable
                    onPress={() => handleAjustarHora(15)}
                    style={({ pressed }) => [styles.btnAjusteMin, pressed && styles.pressedScale]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.btnAjusteMinTexto}>+15m</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.secaoSlotsRotulo}>Horários Comerciais Sugeridos:</Text>
              <View style={styles.slotsGrid}>
                {HORARIOS_COMERCIAIS.map((slot) => {
                  const isSelected = horaTemp === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleSelecionarSlotHora(slot)}
                      style={({ pressed }) => [
                        styles.slotBotao,
                        isSelected && styles.slotBotaoSelecionado,
                        pressed && styles.pressedScale,
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.slotTexto,
                          isSelected && styles.slotTextoSelecionado,
                        ]}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Rodape de Acoes */}
              <View style={[styles.footerRow, { justifyContent: 'flex-end' }]}>
                <Pressable
                  onPress={onFechar}
                  style={({ pressed }) => [styles.btnSecundario, pressed && styles.pressedScale]}
                >
                  <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmar}
                  testID={`${testIDPrefix}-btn-confirmar`}
                  style={({ pressed }) => [styles.btnPrimario, pressed && styles.pressedScale]}
                >
                  <Text style={styles.btnPrimarioTexto}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DOMUS_SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: DOMUS_RADIUS.lg,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    padding: DOMUS_SPACING.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DOMUS_SPACING.sm,
    paddingBottom: DOMUS_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.borderSubtle,
  },
  subtituloModal: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tituloModal: {
    fontSize: 15,
    fontWeight: '700',
    color: DOMUS_THEME.textPrimary,
    marginTop: 1,
  },
  setasRow: {
    flexDirection: 'row',
    gap: 4,
  },
  btnSeta: {
    width: 32,
    height: 32,
    borderRadius: DOMUS_RADIUS.sm,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  diaSemanaTexto: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: DOMUS_THEME.textMuted,
  },
  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 4,
  },
  diaBotao: {
    width: 36,
    height: 34,
    borderRadius: DOMUS_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaBotaoSelecionado: {
    backgroundColor: DOMUS_THEME.primary,
  },
  diaBotaoHoje: {
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
    backgroundColor: DOMUS_THEME.primarySoft,
  },
  diaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: DOMUS_THEME.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  diaTextoOutroMes: {
    color: DOMUS_THEME.textMuted,
    opacity: 0.45,
  },
  diaTextoSelecionado: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  diaTextoHoje: {
    color: DOMUS_THEME.primary,
    fontWeight: '700',
  },
  visorHoraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
  },
  btnAjusteMin: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    borderRadius: 4,
  },
  btnAjusteMinTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: DOMUS_THEME.textSecondary,
  },
  visorHoraTexto: {
    fontSize: 15,
    fontWeight: '800',
    color: DOMUS_THEME.primary,
    paddingHorizontal: 2,
    fontVariant: ['tabular-nums'],
  },
  secaoSlotsRotulo: {
    fontSize: 11,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
    marginBottom: DOMUS_SPACING.xs,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: DOMUS_SPACING.sm,
  },
  slotBotao: {
    flexBasis: '22%',
    flexGrow: 1,
    paddingVertical: 8,
    borderRadius: DOMUS_RADIUS.sm,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBotaoSelecionado: {
    backgroundColor: DOMUS_THEME.primary,
    borderColor: DOMUS_THEME.primary,
  },
  slotTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  slotTextoSelecionado: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DOMUS_SPACING.md,
    paddingTop: DOMUS_SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: DOMUS_THEME.borderSubtle,
  },
  btnHoje: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DOMUS_RADIUS.sm,
    backgroundColor: DOMUS_THEME.primarySoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
  },
  btnHojeTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: DOMUS_THEME.primary,
  },
  botoesAcaoDireita: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecundario: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DOMUS_RADIUS.sm,
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
  },
  btnSecundarioTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
  },
  btnPrimario: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: DOMUS_RADIUS.sm,
    backgroundColor: DOMUS_THEME.primary,
  },
  btnPrimarioTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
});

export default DomusWebPickerModal;
