export const DOMUS_COLORS = {
  headerBg: '#FFE099',
  headerText: '#1A1A1A',
  navBarBg: '#262626',
  navBarText: '#E5E5E5',
  navBarActive: '#FFA347',
  canvasBg: '#A6A6A6',
  surfaceInput: '#D9D9D9',
  cardBg: '#D9D9D9',
  checkboxBg: '#F5F5F5',
  primaryOrange: '#FFA347',
  primaryButtonText: '#111111',
  alertBannerBg: '#B8C8E8',
  alertBannerText: '#111111',
  statusDanger: '#C62828',
  statusWarning: '#EF6C00',
  statusSuccess: '#2E7D32',
  border: '#C4C4C4',
  white: '#FFFFFF',
  mutedText: '#666666',
  textDark: '#1A1A1A',
} as const;

export const DOMUS_THEME = {
  background: '#F2F2F7',        // iOS Grouped Background (substitui o cinza cimento)
  surface: '#FFFFFF',           // Cards brancos puros
  surfaceElevated: '#F8FAFC',   // Superficie secundaria sutil
  surfaceSubtle: '#F1F5F9',     // Pills inativas e badges neutros
  inputBg: '#F8FAFC',           // Fundo de input em repouso
  inputFocusBg: '#FFFFFF',      // Fundo de input focado
  inputBorder: '#E2E8F0',       // Borda fina de input (1.5px)
  inputFocusBorder: '#EA580C',  // Borda de input em foco
  primary: '#EA580C',           // Laranja terracota moderno de alto contraste
  primaryHover: '#C2410C',
  primarySoft: '#FFF7ED',       // Fundo de chip/item selecionado
  primaryBorder: '#FDBA74',     // Borda de chip selecionado
  primaryText: '#FFFFFF',       // Texto branco nitido sobre botao primario
  accentAmber: '#F59E0B',
  textPrimary: '#0F172A',       // Slate 900
  textSecondary: '#475569',     // Slate 600
  textMuted: '#94A3B8',         // Slate 400 (placeholders)
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  success: '#16A34A',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  infoBorder: '#BFDBFE',
} as const;

export const DOMUS_SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const MENSAGEM_BANNER_AVISOS =
  'Você tem agendamentos proximo do dias marcados';

export const DOMUS_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const DOMUS_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const DOMUS_TYPOGRAPHY = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
} as const;
