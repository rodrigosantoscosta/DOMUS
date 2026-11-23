import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DomusHeader } from './src/components/DomusHeader';
import { DomusNavBar } from './src/components/DomusNavBar';
import { DomusToast } from './src/components/DomusToast';
import { ClientesScreen } from './src/screens/ClientesScreen';
import { ImoveisScreen } from './src/screens/ImoveisScreen';
import { AgendarScreen } from './src/screens/AgendarScreen';
import { AtendimentosScreen } from './src/screens/AtendimentosScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DomusProvider, useDomus } from './src/context/DomusContext';
import { DOMUS_THEME, DOMUS_SPACING, DOMUS_RADIUS } from './src/theme/tokens';
import { Cliente, Imovel } from './src/types/domus';

export const DomusAppContent: React.FC = () => {
  const {
    inicializando,
    usuario,
    erro,
    logout,
    recarregarDados,
    abaAtiva,
    setAbaAtiva,
    toast,
    fecharToast,
  } = useDomus();

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

  const handleLogout = async () => {
    setClientePreSelecionadoId(undefined);
    setImovelPreSelecionadoId(undefined);
    await logout();
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
  }, [abaAtiva, clientePreSelecionadoId, imovelPreSelecionadoId, setAbaAtiva]);

  if (inicializando) {
    return (
      <SafeAreaView style={styles.loadingContainer} testID="app-loading-session">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={DOMUS_THEME.primary} />
        <Text style={styles.loadingText}>Verificando sessão...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container} testID="app-auth-container">
        <StatusBar barStyle="dark-content" />
        <LoginScreen />
        <DomusToast
          visivel={!!toast}
          mensagem={toast?.texto || null}
          tipo={toast?.tipo}
          onDismiss={fecharToast || (() => {})}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="app-main-container">
      <StatusBar barStyle="dark-content" />

      {/* Header Superior Fixo em Linha Unica */}
      <DomusHeader
        titulo="DOMUS"
        usuarioNome={usuario.nome}
        onLogout={handleLogout}
      />

      {/* Banner Nao-Bloqueante de Erro de Conexao com a API */}
      {erro ? (
        <View
          style={styles.apiErrorBanner}
          testID="app-api-error-banner"
          accessibilityRole="alert"
        >
          <View style={styles.apiErrorRow}>
            <Ionicons name="cloud-offline-outline" size={18} color={DOMUS_THEME.danger} />
            <Text style={styles.apiErrorText}>{erro}</Text>
          </View>
          <Pressable
            onPress={() => recarregarDados()}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.apiErrorBtn,
              pressed && styles.pressedFeedback,
            ]}
            testID="btn-app-retry"
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.apiErrorBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Centro: Conteudo Dinamico das 4 Abas */}
      <View style={styles.content}>{telaAtiva}</View>

      {/* Bottom Tab Bar Nativa iOS HIG Posicionada na Parte Inferior */}
      <DomusNavBar abaAtiva={abaAtiva} onSelectTab={setAbaAtiva} />

      {/* Toast Global */}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOMUS_SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
  },
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderBottomWidth: 1,
    borderBottomColor: DOMUS_THEME.dangerBorder,
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingVertical: DOMUS_SPACING.sm,
    gap: DOMUS_SPACING.md,
  },
  apiErrorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOMUS_SPACING.sm,
  },
  apiErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: DOMUS_THEME.danger,
  },
  apiErrorBtn: {
    minHeight: 44,
    paddingHorizontal: DOMUS_SPACING.md,
    borderRadius: DOMUS_RADIUS.md,
    backgroundColor: DOMUS_THEME.surface,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiErrorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: DOMUS_THEME.danger,
  },
  pressedFeedback: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  content: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
});
