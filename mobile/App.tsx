import React, { useState, useMemo } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DomusHeader } from './src/components/DomusHeader';
import { DomusNavBar } from './src/components/DomusNavBar';
import { DomusToast } from './src/components/DomusToast';
import { ConnectionModal } from './src/components/ConnectionModal';
import { ClientesScreen } from './src/screens/ClientesScreen';
import { ImoveisScreen } from './src/screens/ImoveisScreen';
import { AgendarScreen } from './src/screens/AgendarScreen';
import { AtendimentosScreen } from './src/screens/AtendimentosScreen';
import { DomusProvider, useDomus } from './src/context/DomusContext';
import { DOMUS_THEME } from './src/theme/tokens';
import { Cliente, Imovel } from './src/types/domus';

export const DomusAppContent: React.FC = () => {
  const {
    modoOffline,
    usuario,
    resetarDemo,
    logout,
    abaAtiva,
    setAbaAtiva,
    toast,
    fecharToast,
  } = useDomus();

  const [modalConexaoVisivel, setModalConexaoVisivel] = useState<boolean>(false);
  const [clientePreSelecionadoId, setClientePreSelecionadoId] = useState<number | undefined>(undefined);
  const [imovelPreSelecionadoId, setImovelPreSelecionadoId] = useState<number | undefined>(undefined);

  const handleAgendarCliente = (cliente: Cliente) => {
    setClientePreSelecionadoId(cliente.id);
    setAbaAtiva('Agendar');
  };

  const handleAgendarImovel = (imovel: Imovel) => {
    setImovelPreSelecionadoId(imovel.id);
    setAbaAtiva('Agendar');
  };

  const telaAtiva = useMemo(() => {
    switch (abaAtiva) {
      case 'Clientes':
        return <ClientesScreen onAgendarCliente={handleAgendarCliente} />;
      case 'Imoveis':
        return <ImoveisScreen onAgendarImovel={handleAgendarImovel} />;
      case 'Agendar':
        return (
          <AgendarScreen
            clientePreSelecionadoId={clientePreSelecionadoId}
            imovelPreSelecionadoId={imovelPreSelecionadoId}
          />
        );
      case 'Atendimentos':
        return <AtendimentosScreen onNovoAgendamento={() => setAbaAtiva('Agendar')} />;
      default:
        return <ClientesScreen onAgendarCliente={handleAgendarCliente} />;
    }
  }, [abaAtiva, clientePreSelecionadoId, imovelPreSelecionadoId]);

  return (
    <SafeAreaView style={styles.container} testID="app-main-container">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Superior Fixo */}
      <DomusHeader
        titulo="DOMUS"
        usuarioNome={usuario?.nome || 'Junior (Corretor Autônomo)'}
        modoOffline={modoOffline}
        confirmarResetEmDoisToques={true}
        onResetDemo={resetarDemo}
        onLogout={logout}
        onPressStatus={() => setModalConexaoVisivel(true)}
      />

      {/* Centro: Conteúdo Dinâmico das 4 Abas */}
      <View style={styles.content}>{telaAtiva}</View>

      {/* Bottom Tab Bar Nativa iOS HIG Posicionada na Parte Inferior */}
      <DomusNavBar abaAtiva={abaAtiva} onSelectTab={setAbaAtiva} />

      {/* Modais e Toasts Globais */}
      <ConnectionModal
        visivel={modalConexaoVisivel}
        onFechar={() => setModalConexaoVisivel(false)}
      />
      <DomusToast
        visivel={!!toast}
        mensagem={toast?.texto || null}
        tipo={toast?.tipo}
        onDismiss={fecharToast || (() => {})}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.rootView}>
      <SafeAreaProvider>
        <DomusProvider>
          <DomusAppContent />
        </DomusProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
});
