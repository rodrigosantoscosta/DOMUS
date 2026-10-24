import React from 'react';
import { SafeAreaView, StyleSheet, View, StatusBar } from 'react-native';
import { DomusHeader } from './src/components/DomusHeader';
import { DomusNavBar } from './src/components/DomusNavBar';
import { ClientesScreen } from './src/screens/ClientesScreen';
import { DomusProvider } from './src/context/DomusContext';
import { DOMUS_COLORS } from './src/theme/tokens';

export default function App() {
  return (
    <DomusProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={DOMUS_COLORS.headerBg} />
        <DomusHeader
          titulo="DOMUS"
          usuarioNome="Junior (Corretor Autônomo)"
          modoOffline={true}
        />
        <DomusNavBar abaAtiva="Clientes" />
        <View style={styles.content}>
          <ClientesScreen />
        </View>
      </SafeAreaView>
    </DomusProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DOMUS_COLORS.headerBg,
  },
  content: {
    flex: 1,
    backgroundColor: DOMUS_COLORS.canvasBg,
  },
});
