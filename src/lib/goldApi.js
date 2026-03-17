import { storage } from "./storage.js";

// NOTE: For a real deployment, keep API keys server-side.
// This demo tries keyless public endpoints first (works on GitHub Pages),
// and falls back to an optional GoldPricez API-key flow if you add a key.
const GOLDPRICEZ_API_KEY = ""; // Optional: set your GoldPricez API key

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function refreshGoldPriceFromApiIfPossible() {
  const state = storage.load();
  const last = state.goldApi?.lastUpdatedDate;
  const today = todayStr();
  if (last === today) return;

  try {
    const OZ_TO_GRAMS = 31.1034768;

    const fetchJson = async (url) => {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    };

    const fetchUsdToInr = async () => {
      // Try multiple free FX endpoints (some may be down/blocked).
      const urls = [
        "https://open.er-api.com/v6/latest/USD",
        "https://api.exchangerate.host/latest?base=USD&symbols=INR",
      ];

      let lastErr;
      for (const url of urls) {
        try {
          const data = await fetchJson(url);
          const rate = Number(data?.rates?.INR ?? data?.conversion_rates?.INR ?? 0) || 0;
          if (Number.isFinite(rate) && rate > 0) return rate;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error("FX rate unavailable");
    };

    const fetchGoldUsdPerOz = async () => {
      // metals.live typically returns: [["gold", <usd_per_oz>, <ts>]]
      const data = await fetchJson("https://api.metals.live/v1/spot/gold");
      const row = Array.isArray(data) ? data[0] : null;
      const price = Number(row?.[1] ?? 0) || 0;
      if (!Number.isFinite(price) || price <= 0) throw new Error("Gold spot unavailable");
      return price;
    };

    const tryRefreshFromKeylessSources = async () => {
      const [usdToInr, goldUsdPerOz] = await Promise.all([fetchUsdToInr(), fetchGoldUsdPerOz()]);
      const inrPerGram24k = (goldUsdPerOz * usdToInr) / OZ_TO_GRAMS;
      if (!Number.isFinite(inrPerGram24k) || inrPerGram24k <= 0) throw new Error("Computed gram rate invalid");
      return Math.round(inrPerGram24k);
    };

    const tryRefreshFromGoldpricez = async () => {
      if (!GOLDPRICEZ_API_KEY) return null;
      const res = await fetch("https://goldpricez.com/api/rates/currency/inr/measure/gram", {
        method: "GET",
        headers: {
          "X-API-KEY": GOLDPRICEZ_API_KEY,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const gramInInr =
        Number(data.gram_in_inr ?? data.gram_inr ?? data.gram_inr_price ?? data.gram_price_inr ?? 0) || 0;
      if (!Number.isFinite(gramInInr) || gramInInr <= 0) return null;
      return Math.round(gramInInr);
    };

    let gramInInr = 0;
    try {
      gramInInr = await tryRefreshFromKeylessSources();
    } catch {
      gramInInr = (await tryRefreshFromGoldpricez()) || 0;
    }
    if (!Number.isFinite(gramInInr) || gramInInr <= 0) return;

    storage.update((s) => {
      s.goldPricePerGram24k = Math.round(gramInInr);
      s.goldApi = {
        lastUpdatedDate: today,
        source: gramInInr ? (GOLDPRICEZ_API_KEY ? "goldpricez" : "metals.live+fx") : s.goldApi?.source,
      };
      return s;
    });
  } catch {
    // ignore errors, keep last stored value
  }
}

