import tinycolor from "tinycolor2";

export type BrandTheme = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  backgroundSoft: string;
};

export function getTheme(business: any): BrandTheme {
  const primary = business?.theme?.primary || "#FF7D00";
  const accent = business?.theme?.accent || "#78290F";

  const p = tinycolor(primary);
  const a = tinycolor(accent);

  return {
    primary: p.toHexString(),
    primaryLight: p.lighten(18).toHexString(),
    primaryDark: p.darken(18).toHexString(),

    accent: a.toHexString(),
    accentLight: a.lighten(18).toHexString(),
    accentDark: a.darken(18).toHexString(),

    backgroundSoft: p.setAlpha(0.08).toRgbString(),
  };
}

/**
 * Inject CSS variables globally
 */
export function applyThemeToRoot(theme: BrandTheme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--brand-primary", theme.primary);
  root.style.setProperty("--brand-primary-light", theme.primaryLight);
  root.style.setProperty("--brand-primary-dark", theme.primaryDark);

  root.style.setProperty("--brand-accent", theme.accent);
  root.style.setProperty("--brand-accent-light", theme.accentLight);
  root.style.setProperty("--brand-accent-dark", theme.accentDark);

  root.style.setProperty("--brand-bg-soft", theme.backgroundSoft);
}
