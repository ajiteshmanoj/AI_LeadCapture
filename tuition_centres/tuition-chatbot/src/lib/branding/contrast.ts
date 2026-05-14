// WCAG 2.1 relative luminance + contrast ratio helpers.
// Used to auto-derive on_primary text colour so we don't ask the admin to pick it.

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = toLinear(parseInt(full.slice(0, 2), 16));
  const g = toLinear(parseInt(full.slice(2, 4), 16));
  const b = toLinear(parseInt(full.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Returns "#ffffff" or "#111827" depending on which gives better contrast on the background.
export function autoOnPrimary(bgHex: string): string {
  const vsWhite = contrastRatio(bgHex, "#ffffff");
  return vsWhite >= 4.5 ? "#ffffff" : "#111827";
}

// Returns true if the colour passes WCAG AA against white (contrast ≥ 4.5).
export function passesContrastOnWhite(hex: string): boolean {
  return contrastRatio(hex, "#ffffff") >= 4.5;
}
