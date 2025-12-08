const colors = {
  background: '#FFF7FB',
  backgroundSoft: '#FFEFF9',
  backgroundMuted: '#FFE1F2',
  surface: '#FFFFFF',
  surfaceMuted: '#FFE6F2',
  surfaceTint: '#FFDDED',
  border: '#F8C5DE',
  borderSubtle: '#FFEAF3',
  accent: '#FF87C8',
  accentSoft: '#FFC4E5',
  accentBold: '#FF5AA4',
  accentGlow: '#FFB4DA',
  accentSecondary: '#7DD3FC',
  textPrimary: '#4B1C4F',
  textSecondary: '#7C4F73',
  textMuted: '#A2749A',
  success: '#60D9C2',
  warning: '#F8D477',
  error: '#FF8793',
};

const gradients = {
  hero: ['#FFF7FB', '#FFE1F3'],
  cta: ['#FF9CD4', '#FF7BC2'],
  badge: ['#FFFFFF', '#FFEAF3'],
};

const radii = {
  xl: 28,
  lg: 22,
  md: 16,
  sm: 12,
  pill: 999,
};

const shadow = {
  card: {
    shadowColor: 'rgba(255, 122, 177, 0.45)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },
  floating: {
    shadowColor: 'rgba(124, 59, 126, 0.35)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 32,
    elevation: 12,
  },
};

export const cupidTheme = {
  colors,
  gradients,
  radii,
  shadow,
};

export type CupidTheme = typeof cupidTheme;

export function cardShadow(level: keyof typeof shadow = 'card') {
  return shadow[level];
}
