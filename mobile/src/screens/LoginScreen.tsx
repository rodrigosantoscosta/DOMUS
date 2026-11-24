import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import DomusContext, {
  DomusContextData,
  criarDomusContextFallback,
} from '../context/DomusContext';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
  DOMUS_RADIUS,
  DOMUS_SHADOWS,
} from '../theme/tokens';
import { formatarCpfCnpj } from '../utils/formatters';
import {
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
  triggerLightImpact,
} from '../utils/haptics';

const domusLogo = require('../../assets/logo.png');

const DEFAULT_LOGIN_CONTEXT_FALLBACK = criarDomusContextFallback('Clientes');

function validarEmailSimples(valor: string): boolean {
  if (!valor || /\s/.test(valor)) return false;
  const arroba = valor.indexOf('@');
  if (arroba <= 0 || arroba !== valor.lastIndexOf('@')) return false;
  const dominio = valor.slice(arroba + 1);
  const ponto = dominio.indexOf('.');
  return ponto > 0 && ponto < dominio.length - 1;
}

export interface LoginScreenProps {
  context?: DomusContextData;
}

type ModoAuth = 'entrar' | 'cadastro';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  context,
}) => {
  const contextFromHook = React.useContext(DomusContext);
  const domus = context || contextFromHook || DEFAULT_LOGIN_CONTEXT_FALLBACK;

  const [modo, setModo] = useState<ModoAuth>('entrar');
  const [logoErro, setLogoErro] = useState<boolean>(false);
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  // Campos de Login
  const [identificador, setIdentificador] = useState<string>('');
  const [senhaLogin, setSenhaLogin] = useState<string>('');

  // Campos de Cadastro
  const [nome, setNome] = useState<string>('');
  const [loginUsuario, setLoginUsuario] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [senhaCadastro, setSenhaCadastro] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  const submetendoRef = useRef<boolean>(false);

  const alternarModo = (novoModo: ModoAuth) => {
    if (novoModo === modo) return;
    void triggerSelectionHaptic();
    setModo(novoModo);
    setErroLocal(null);
  };

  const handleToggleSenha = () => {
    void triggerLightImpact();
    setMostrarSenha((prev) => !prev);
  };

  const handleLogin = async () => {
    if (submetendoRef.current || enviando) return;
    setErroLocal(null);

    const idLimpo = identificador.trim();
    if (!idLimpo) {
      void triggerErrorHaptic();
      setErroLocal('Informe seu usuário ou e-mail para entrar.');
      return;
    }

    if (!senhaLogin) {
      void triggerErrorHaptic();
      setErroLocal('Informe sua senha.');
      return;
    }

    submetendoRef.current = true;
    setEnviando(true);
    try {
      await domus.login({
        loginOuEmail: idLimpo,
        senha: senhaLogin,
      });
      void triggerSuccessHaptic();
    } catch (err: any) {
      void triggerErrorHaptic();
      setErroLocal(err?.message || 'Não foi possível realizar o login.');
    } finally {
      setEnviando(false);
      submetendoRef.current = false;
    }
  };

  const handleCadastro = async () => {
    if (submetendoRef.current || enviando) return;
    setErroLocal(null);

    const nomeLimpo = nome.trim();
    const loginLimpo = loginUsuario.trim().toLowerCase();
    const emailLimpo = email.trim().toLowerCase();
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (!nomeLimpo) {
      void triggerErrorHaptic();
      setErroLocal('Informe seu nome completo.');
      return;
    }

    if (!loginLimpo) {
      void triggerErrorHaptic();
      setErroLocal('Informe um nome de usuário (login).');
      return;
    }

    if (!validarEmailSimples(emailLimpo)) {
      void triggerErrorHaptic();
      setErroLocal('Informe um e-mail válido.');
      return;
    }

    if (cpfLimpo && cpfLimpo.length !== 11) {
      void triggerErrorHaptic();
      setErroLocal('Se informado, o CPF deve conter 11 dígitos numéricos.');
      return;
    }

    if (!senhaCadastro || senhaCadastro.length < 6) {
      void triggerErrorHaptic();
      setErroLocal('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senhaCadastro !== confirmarSenha) {
      void triggerErrorHaptic();
      setErroLocal('A confirmação da senha não confere com a senha informada.');
      return;
    }

    submetendoRef.current = true;
    setEnviando(true);
    try {
      await domus.cadastrarUsuario({
        nome: nomeLimpo,
        login: loginLimpo,
        email: emailLimpo,
        cpf: cpfLimpo || undefined,
        senha: senhaCadastro,
        confirmarSenha,
        perfis: ['CORRETOR'],
      });

      try {
        await domus.login({
          loginOuEmail: loginLimpo,
          senha: senhaCadastro,
        });
        void triggerSuccessHaptic();
      } catch (loginErr: any) {
        void triggerErrorHaptic();
        setModo('entrar');
        setIdentificador(loginLimpo);
        setSenhaLogin('');
        setErroLocal(
          loginErr?.message ||
            'Conta criada, mas não foi possível autenticar automaticamente. Tente entrar novamente.'
        );
      }
    } catch (err: any) {
      void triggerErrorHaptic();
      setErroLocal(err?.message || 'Não foi possível criar sua conta.');
    } finally {
      setEnviando(false);
      submetendoRef.current = false;
    }
  };

  const toggleSenhaButton = (testId: string) => (
    <Pressable
      onPress={handleToggleSenha}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [styles.eyeButton, pressed && styles.pressedFeedback]}
      testID={testId}
      accessibilityRole="button"
      accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
    >
      <Ionicons
        name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={DOMUS_THEME.textSecondary}
      />
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID="login-screen"
    >
      <View style={styles.centerContainer}>
        {/* Cabecalho Institucional da Autenticacao */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrapper}>
            {!logoErro ? (
              <Image
                source={domusLogo}
                style={styles.logoImage}
                resizeMode="contain"
                testID="login-logo"
                onError={() => setLogoErro(true)}
                accessibilityRole="image"
                accessibilityLabel="Logotipo DOMUS"
              />
            ) : (
              <Ionicons
                name="home"
                size={28}
                color={DOMUS_THEME.primary}
                testID="login-icon-fallback"
              />
            )}
          </View>
          <Text style={styles.brandTitle} testID="login-brand-title">
            DOMUS
          </Text>
          <Text style={styles.brandSubtitle}>
            Gestão de Clientes, Imóveis e Atendimentos
          </Text>
        </View>

        {/* Cartao Principal de Login / Cadastro */}
        <View style={styles.card}>
          {/* Seletor Segmentado */}
          <View style={styles.segmentedRow}>
            <Pressable
              onPress={() => alternarModo('entrar')}
              style={({ pressed }) => [
                styles.segmentedButton,
                modo === 'entrar' && styles.segmentedButtonActive,
                pressed && styles.pressedFeedback,
              ]}
              testID="login-tab-entrar"
              accessibilityRole="button"
              accessibilityState={{ selected: modo === 'entrar' }}
            >
              <Text
                style={[
                  styles.segmentedText,
                  modo === 'entrar' && styles.segmentedTextActive,
                ]}
              >
                Entrar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => alternarModo('cadastro')}
              style={({ pressed }) => [
                styles.segmentedButton,
                modo === 'cadastro' && styles.segmentedButtonActive,
                pressed && styles.pressedFeedback,
              ]}
              testID="login-tab-cadastro"
              accessibilityRole="button"
              accessibilityState={{ selected: modo === 'cadastro' }}
            >
              <Text
                style={[
                  styles.segmentedText,
                  modo === 'cadastro' && styles.segmentedTextActive,
                ]}
              >
                Criar Conta
              </Text>
            </Pressable>
          </View>

          {/* Caixa de Erro Inline */}
          {erroLocal ? (
            <View
              style={styles.errorBox}
              testID="login-error-box"
              accessibilityRole="alert"
            >
              <View style={styles.errorHeaderRow}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={DOMUS_THEME.danger}
                />
                <Text style={styles.errorText}>{erroLocal}</Text>
              </View>
            </View>
          ) : null}

          {modo === 'entrar' ? (
            <View testID="login-form-entrar">
              <DomusInput
                label="Usuário ou E-mail"
                placeholder="Digite seu usuário ou e-mail"
                value={identificador}
                onChangeText={(text) => {
                  setIdentificador(text);
                  if (erroLocal) setErroLocal(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-login-identificador"
              />

              <DomusInput
                label="Senha"
                placeholder="Digite sua senha"
                value={senhaLogin}
                onChangeText={(text) => {
                  setSenhaLogin(text);
                  if (erroLocal) setErroLocal(null);
                }}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                rightElement={toggleSenhaButton('btn-toggle-senha')}
                testID="input-login-senha"
              />

              <DomusButton
                label="Entrar"
                loadingLabel="Autenticando..."
                onPress={handleLogin}
                loading={enviando}
                disabled={enviando}
                variant="primary"
                testID="btn-fazer-login"
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View testID="login-form-cadastro">
              <DomusInput
                label="Nome Completo"
                placeholder="Seu nome completo"
                value={nome}
                onChangeText={(text) => {
                  setNome(text);
                  if (erroLocal) setErroLocal(null);
                }}
                testID="input-cadastro-nome"
              />

              <DomusInput
                label="Login"
                placeholder="ex: maria.corretora"
                value={loginUsuario}
                onChangeText={(text) => {
                  setLoginUsuario(text);
                  if (erroLocal) setErroLocal(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-cadastro-login"
              />

              <DomusInput
                label="E-mail"
                placeholder="nome@dominio.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (erroLocal) setErroLocal(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                testID="input-cadastro-email"
              />

              <DomusInput
                label="CPF (opcional)"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(text) => {
                  setCpf(formatarCpfCnpj(text).slice(0, 14));
                  if (erroLocal) setErroLocal(null);
                }}
                keyboardType="numeric"
                testID="input-cadastro-cpf"
              />

              <DomusInput
                label="Senha"
                placeholder="Mínimo de 6 caracteres"
                value={senhaCadastro}
                onChangeText={(text) => {
                  setSenhaCadastro(text);
                  if (erroLocal) setErroLocal(null);
                }}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                rightElement={toggleSenhaButton('btn-toggle-senha-cadastro')}
                testID="input-cadastro-senha"
              />

              <DomusInput
                label="Confirmar Senha"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChangeText={(text) => {
                  setConfirmarSenha(text);
                  if (erroLocal) setErroLocal(null);
                }}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-cadastro-confirmar-senha"
              />

              <Text style={styles.roleNote}>
                Contas públicas são cadastradas com perfil Corretor.
              </Text>

              <DomusButton
                label="Criar Conta e Entrar"
                loadingLabel="Criando conta..."
                onPress={handleCadastro}
                loading={enviando}
                disabled={enviando}
                variant="primary"
                testID="btn-criar-conta"
                style={styles.submitButton}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: DOMUS_THEME.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: DOMUS_SPACING.lg,
    paddingVertical: DOMUS_SPACING.xxl,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: DOMUS_SPACING.xl,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: DOMUS_THEME.primarySoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DOMUS_SPACING.md,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: DOMUS_THEME.textPrimary,
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: DOMUS_THEME.textSecondary,
    textAlign: 'center',
    marginTop: DOMUS_SPACING.xs,
  },
  card: {
    backgroundColor: DOMUS_THEME.surface,
    borderRadius: DOMUS_RADIUS.xl,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    padding: DOMUS_SPACING.lg,
    ...DOMUS_SHADOWS.md,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: DOMUS_THEME.surfaceSubtle,
    borderRadius: DOMUS_RADIUS.lg,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    padding: 4,
    marginBottom: DOMUS_SPACING.lg,
    gap: 4,
  },
  segmentedButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: DOMUS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: DOMUS_THEME.surface,
    borderWidth: 1,
    borderColor: DOMUS_THEME.border,
    ...DOMUS_SHADOWS.sm,
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '600',
    color: DOMUS_THEME.textSecondary,
  },
  segmentedTextActive: {
    color: DOMUS_THEME.primary,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: DOMUS_THEME.dangerSoft,
    borderWidth: 1,
    borderColor: DOMUS_THEME.dangerBorder,
    borderRadius: DOMUS_RADIUS.md,
    padding: DOMUS_SPACING.md,
    marginBottom: DOMUS_SPACING.md,
    gap: DOMUS_SPACING.sm,
  },
  errorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DOMUS_SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: DOMUS_THEME.danger,
    lineHeight: 18,
  },
  eyeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleNote: {
    fontSize: 12,
    color: DOMUS_THEME.textSecondary,
    marginBottom: DOMUS_SPACING.md,
  },
  submitButton: {
    marginTop: DOMUS_SPACING.xs,
  },
  pressedFeedback: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});

export default LoginScreen;
