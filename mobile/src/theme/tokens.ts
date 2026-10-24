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
