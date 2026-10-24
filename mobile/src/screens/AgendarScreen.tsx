import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DOMUS_THEME } from '../theme/tokens';
import { DomusContextData } from '../context/DomusContext';

export interface AgendarScreenProps {
  context?: DomusContextData;
  clientePreSelecionadoId?: number;
  imovelPreSelecionadoId?: number;
}

export const AgendarScreen: React.FC<AgendarScreenProps> = () => {
  return <View style={styles.container} testID="agendar-screen" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
});

export default AgendarScreen;
