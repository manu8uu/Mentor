export const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

// acepta coma o punto decimal; solo cantidades positivas
export function parseAmount(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}