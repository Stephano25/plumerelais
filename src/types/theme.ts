export const colors = {
  bg: '#0E0B1A',
  bg2: '#16112A',
  bg3: '#1E1838',
  bg4: '#2A2245',
  t1: '#F5F0FF',
  t2: '#C4B8E0',
  t3: '#8A7BAA',
  accent: '#E8C547',
  accent2: '#F5E08A',
  green: '#4ECBA0',
  red: '#E85C6A',
  blue: '#5BAEF5',
  primary: '#7C5CBF',
  primary2: '#9B7DE0',
  primary3: '#C4A8F0',
  primary4: '#EDE6FA',
};

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  h2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 22, fontWeight: '700' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 24 },
  bodySerif: { fontSize: 16, lineHeight: 28, fontStyle: 'italic' as const },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};