export const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128"] as const;

export function getBarcodeCandidates(rawCode: string) {
  const clean = rawCode.trim();
  const digits = clean.replace(/\D/g, "");
  const values = [
    clean,
    digits,
    digits.length === 12 ? `0${digits}` : "",
    digits.length === 13 && digits.startsWith("0") ? digits.slice(1) : "",
  ].filter(Boolean);

  return Array.from(new Set(values));
}
