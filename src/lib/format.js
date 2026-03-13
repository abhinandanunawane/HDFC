export function inr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function pct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

