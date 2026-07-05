export function fmtNumber(n: number | undefined | null): string {
  if (n == null) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export function escXml(str: string): string {
  return str
    .replace(/&/g, ('&' + 'amp;'))
    .replace(/</g, ('<' + 'lt;'))
    .replace(/>/g, ('>' + 'gt;'));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, Math.max(0, maxLength - 1)) + "\u2026";
}
