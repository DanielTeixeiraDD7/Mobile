export const BANNER_THEME: Record<string, { from: string; to: string; glow: string }> = {
  night: { from: '#2a1640', to: '#0b0710', glow: '#a45cf0' },
  blood: { from: '#6a0a1c', to: '#12020a', glow: '#e0315a' },
  abyss: { from: '#0b3a4a', to: '#02090f', glow: '#5ff2d2' },
};
export const themeOf = (t: string) => BANNER_THEME[t] ?? BANNER_THEME.night!;
