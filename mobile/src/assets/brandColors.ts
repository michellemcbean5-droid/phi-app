export const PHI_COLORS = {
  royalBlue: '#0057FF',
  sunshineYellow: '#FFD93D',
  charcoalBlack: '#1A1A1A',
  moneyGreen: '#00C853',
  white: '#FFFFFF',
  surface: '#0A1628',
  card: '#0D1F3C',
} as const;

export type PHIColorName = keyof typeof PHI_COLORS;
