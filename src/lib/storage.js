const KEY = "hdfc_gold_loan_demo_v1";

const defaults = {
  goldPricePerGram24k: 7000, // demo default; can be changed in UI (Home/Apply)
  loanToValuePct: 75,
  goldApi: {
    lastUpdatedDate: null,
    source: "manual",
  },
  chat: {
    messages: [],
    state: {
      phase: "faq", // faq | askStart | collecting | otp | verified | applying
      lead: {
        name: "",
        dob: "",
        mobile: "",
      },
      otp: null,
      otpVerified: false,
    },
  },
  application: {
    started: false,
    step: 0,
    financial: {
      city: "",
      employment: "Salaried",
      monthlyIncome: "",
      requestedTenureMonths: 12,
      requestedAmount: "",
      goldWeightGrams: "",
      purityKarat: 22,
    },
    ekyc: {
      idType: "Aadhaar",
      idNumber: "",
      address: "",
    },
    goldPhotos: {
      files: [],
      invoiceProvided: false,
      notes: "",
    },
    estimation: {
      evaluatedValue: 0,
      eligibleLoan: 0,
      checks: [],
    },
    emiLockedFromEstimate: false,
  },
};

function deepMerge(base, patch) {
  if (typeof base !== "object" || base === null) return patch;
  if (typeof patch !== "object" || patch === null) return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      return deepMerge(structuredClone(defaults), parsed);
    } catch {
      return structuredClone(defaults);
    }
  },
  save(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
  },
  update(fn) {
    const curr = storage.load();
    const next = fn(curr);
    storage.save(next);
    return next;
  },
  reset() {
    localStorage.removeItem(KEY);
    return storage.load();
  },
  ensureDefaults() {
    storage.update((s) => s);
  },
};

