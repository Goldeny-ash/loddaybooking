import tinycolor from "tinycolor2";

/**
 * Returns the relative luminance of a color (0 = dark, 1 = light)
 */
export function luminance(hex: string): number {
  return tinycolor(hex).getLuminance();
}

/**
 * Returns true if the color is light
 */
export function isLight(hex: string): boolean {
  return luminance(hex) > 0.6;
}

/**
 * Get a readable text color (white on dark, dark on light)
 */
export function getReadableText(base: string): string {
  return isLight(base) ? "#111" : "#fff";
}

/**
 * Glass background depending on theme brightness
 * Automatically adapts for light/dark themes
 */
export function glassFor(base: string): string {
  return isLight(base)
    ? "rgba(255,255,255,0.55)" // frosted glass on light themes
    : "rgba(0,0,0,0.45)";      // smoked glass on dark themes
}

/**
 * Card background depending on theme brightness
 */
export function cardFor(base: string): string {
  return isLight(base)
    ? "rgba(255,255,255,0.75)" // lighter card for light theme
    : "rgba(0,0,0,0.35)";      // darker card for dark theme
}

/**
 * Border color depending on theme brightness
 */
export function borderFor(base: string): string {
  return isLight(base)
    ? "rgba(0,0,0,0.08)"       // subtle border for light
    : "rgba(255,255,255,0.18)";// more visible border for dark
}

/**
 * Shadow depending on theme brightness
 */
export function shadowFor(base: string): string {
  return isLight(base)
    ? "0 20px 50px rgba(0,0,0,0.1)"
    : "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)";
}

/**
 * Mix a base color with alpha (opacity)
 * Example: mix("#FF7D00", 0.3) -> "rgba(255,125,0,0.3)"
 */
export function mix(base: string, alpha: number): string {
  const c = tinycolor(base).toRgb();
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}
