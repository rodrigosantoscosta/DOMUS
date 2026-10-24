import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DOMUS_THEME } from '../theme/tokens';
import { DomusContextData } from '../context/DomusContext';

export interface AtendimentosScreenProps {
  context?: DomusContextData;
  onNovoAgendamento?: () => void;
}

export const AtendimentosScreen: React.FC<AtendimentosScreenProps> = () => {
  return <View style={styles.container} testID="atendimentos-screen" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
});

export default AtendimentosScreen;
