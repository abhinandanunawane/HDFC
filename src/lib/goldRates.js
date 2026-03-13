import { storage } from "./storage.js";

// Demo-only helper.
// In future you can call a real backend API here to fetch live gold prices.
// Right now it just ensures the locally configured rates are present.

const ONE_HOUR = 60 * 60 * 1000;
const META_KEY = "hdfc_gold_loan_demo_rates_meta_v1";

export async function refreshGoldRatesIfStale() {
  try {
    const metaRaw = localStorage.getItem(META_KEY);
    const meta = metaRaw ? JSON.parse(metaRaw) : {};
    const now = Date.now();

    if (meta.lastChecked && now - meta.lastChecked < ONE_HOUR) {
      return;
    }

    // Placeholder: no external API call in this demo.
    // We only mark that we "checked" so the app doesn't retry too often.
    localStorage.setItem(
      META_KEY,
      JSON.stringify({
        lastChecked: now,
      })
    );

    // Ensure defaults exist; do not change user-configured prices.
    storage.ensureDefaults();
  } catch {
    // Swallow all errors; pricing remains whatever the user configured.
  }
}

