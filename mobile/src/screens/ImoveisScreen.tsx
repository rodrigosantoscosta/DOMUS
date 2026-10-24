import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DOMUS_THEME } from '../theme/tokens';
import { Imovel } from '../types/domus';
import { DomusContextData } from '../context/DomusContext';

export interface ImoveisScreenProps {
  context?: DomusContextData;
  onAgendarImovel?: (imovel: Imovel) => void;
}

export const ImoveisScreen: React.FC<ImoveisScreenProps> = () => {
  return <View style={styles.container} testID="imoveis-screen" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
});

export default ImoveisScreen;
