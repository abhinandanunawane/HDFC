import { storage } from "../lib/storage.js";
import { el, toast } from "../lib/dom.js";
import { inr, clamp } from "../lib/format.js";
import { refreshGoldPriceFromApiIfPossible } from "../lib/goldApi.js";

export function renderHome(root) {
  const s = storage.load();
  refreshGoldPriceFromApiIfPossible().then(() => {
    // After API updates, this page can be revisited or refreshed to see the new rate.
  });

  const hero = el("section", { class: "hero" }, [
    el("div", { class: "hero__banner" }, [
      el("div", { class: "hero__row" }, [
        el("div", {}, [
          el("h1", { class: "hero__headline", text: "HDFC Gold Loan — fast, transparent, guided" }),
          el("div", {
            class: "muted",
            text: "Demo website with chat support, application steps, gold valuation and EMI calculator.",
          }),
          el("div", { class: "hero__kpis" }, [
            el("div", { class: "pill" }, [
              el("div", { class: "pill__dot" }),
              el("div", {}, [
                el("div", { class: "pill__label", text: "Eligible loan (demo)" }),
                el("div", { class: "pill__value", text: `${s.loanToValuePct}% of gold value` }),
              ]),
            ]),
            el("div", { class: "pill" }, [
              el("div", { class: "pill__dot", style: "background: var(--warning); box-shadow: 0 0 0 6px rgba(255,204,102,.14)" }),
              el("div", {}, [
                el("div", { class: "pill__label", text: "24K price (demo)" }),
                el("div", { class: "pill__value", text: inr(s.goldPricePerGram24k) + " / gram" }),
              ]),
            ]),
          ]),
        ]),
        el("div", { style: "min-width:260px; flex:0 0 auto" }, [
          el(
            "a",
            { class: "btn btn--primary", href: "#/apply", style: "display:inline-block; width:100%; text-align:center" },
            ["Start application"]
          ),
          el("div", { style: "height:10px" }),
          el(
            "a",
            {
              class: "btn",
              href: "#/calculator",
              style: "display:inline-block; width:100%; text-align:center",
            },
            ["Try EMI calculator"]
          ),
        ]),
      ]),
    ]),
  ]);

  const configCard = el("section", { class: "grid grid--2" }, [
    el("div", { class: "card" }, [
      el("div", { class: "card__inner" }, [
        el("h2", { class: "card__title", text: "Demo valuation settings" }),
        el("p", {
          class: "card__subtitle",
          text: "These are used for the gold estimation step. Update to match current market price / policy for a realistic demo.",
        }),
        el("div", { class: "form" }, [
          el("div", { class: "statgrid" }, [
            stat("24K price (per gram)", inr(s.goldPricePerGram24k)),
            stat("22K price (per gram)", inr(Math.round(s.goldPricePerGram24k * (22 / 24)))),
            stat("20K price (per gram)", inr(Math.round(s.goldPricePerGram24k * (20 / 24)))),
            stat("18K price (per gram)", inr(Math.round(s.goldPricePerGram24k * (18 / 24)))),
          ]),
          el("div", { class: "muted" }, [
            s.goldApi?.source === "goldpricez"
              ? `Updated automatically from gold API on ${s.goldApi.lastUpdatedDate || "latest"}`
              : "Currently using manual demo value bundled with the app. Configure API key in code to fetch live rates.",
          ]),
          el("label", {}, [
            "Loan-to-value (LTV) %",
            el("input", {
              type: "number",
              min: "1",
              max: "90",
              step: "1",
              value: String(s.loanToValuePct),
              onInput: (e) => {
                const v = clamp(Number(e.target.value || 0), 1, 90);
                storage.update((st) => {
                  st.loanToValuePct = v;
                  return st;
                });
              },
            }),
          ]),
          el("div", { class: "actions" }, [
            el("button", {
              class: "btn btn--danger",
              type: "button",
              onClick: () => {
                storage.reset();
                toast("Reset demo data");
                location.reload();
              },
              text: "Reset demo data",
            }),
          ]),
        ]),
      ]),
    ]),
    el("div", { class: "card" }, [
      el("div", { class: "card__inner" }, [
        el("h2", { class: "card__title", text: "What you can do here" }),
        el("p", { class: "card__subtitle", text: "A guided experience similar to a real gold loan journey." }),
        el("div", { class: "statgrid" }, [
          stat("AI chat (demo)", "Ask FAQs → start application flow"),
          stat("OTP (demo)", "OTP is shown for testing"),
          stat("4-step wizard", "Financial → eKYC → Gold photos → Estimation"),
          stat("EMI calculator", "Sliders for amount, rate, tenure"),
        ]),
        el("div", { class: "hr" }),
        el("div", { class: "muted" }, [
          "Note: This demo is offline and does not call real bank systems. For production, connect to verified data sources and secure OTP/KYC providers.",
        ]),
      ]),
    ]),
  ]);

  root.appendChild(hero);
  root.appendChild(configCard);
}

function stat(k, v) {
  return el("div", { class: "stat" }, [
    el("div", { class: "stat__k", text: k }),
    el("div", { class: "stat__v", text: v }),
  ]);
}

