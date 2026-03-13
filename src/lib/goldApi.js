import { storage } from "./storage.js";

// NOTE: For a real deployment, keep API keys server-side.
// This is a front-end demo only. Get a free key from goldpricez.com
// and paste it here if you want live rates.
const GOLDPRICEZ_API_KEY = ""; // TODO: set your GoldPricez API key for live gold rates (optional)

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function refreshGoldPriceFromApiIfPossible() {
  if (!GOLDPRICEZ_API_KEY) return; // stay in manual mode

  const state = storage.load();
  const last = state.goldApi?.lastUpdatedDate;
  const today = todayStr();
  if (last === today) return;

  try {
    const res = await fetch("https://goldpricez.com/api/rates/currency/inr/measure/gram", {
      method: "GET",
      headers: {
        "X-API-KEY": GOLDPRICEZ_API_KEY,
      },
    });
    if (!res.ok) return;
    const data = await res.json();
    const gramInInr =
      Number(data.gram_in_inr ?? data.gram_inr ?? data.gram_inr_price ?? data.gram_price_inr ?? 0) || 0;
    if (!Number.isFinite(gramInInr) || gramInInr <= 0) return;

    storage.update((s) => {
      s.goldPricePerGram24k = Math.round(gramInInr);
      s.goldApi = {
        lastUpdatedDate: today,
        source: "goldpricez",
      };
      return s;
    });
  } catch {
    // ignore errors, keep last stored value
  }
}

