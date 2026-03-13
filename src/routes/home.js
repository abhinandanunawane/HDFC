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
          el("h1", {
            class: "hero__headline",
            text: "HDFC Gold Loan – instant online estimate & EMI in minutes",
          }),
          el("div", {
            class: "muted",
            text: "Check your HDFC-style gold loan eligibility online, get a smart gold value estimate, and explore flexible EMIs – all in one guided experience.",
          }),
          el("div", { class: "hero__kpis" }, [
            el("div", { class: "pill" }, [
              el("div", { class: "pill__dot" }),
              el("div", {}, [
                el("div", { class: "pill__label", text: "Indicative loan-to-value" }),
                el("div", {
                  class: "pill__value",
                  text: `${s.loanToValuePct}% of evaluated gold value`,
                }),
              ]),
            ]),
            el("div", { class: "pill" }, [
              el("div", { class: "pill__dot", style: "background: var(--warning); box-shadow: 0 0 0 6px rgba(255,204,102,.14)" }),
              el("div", {}, [
                el("div", { class: "pill__label", text: "Live-linked 24K gold price (demo)" }),
                el("div", { class: "pill__value", text: inr(s.goldPricePerGram24k) + " / gram" }),
              ]),
            ]),
          ]),
        ]),
        el("div", { style: "min-width:260px; flex:0 0 auto" }, [
          el(
            "a",
            {
              class: "btn btn--primary",
              href: "#/apply",
              style: "display:inline-block; width:100%; text-align:center",
            },
            ["Get instant gold loan estimate"]
          ),
          el("div", { style: "height:10px" }),
          el(
            "a",
            {
              class: "btn",
              href: "#/calculator",
              style: "display:inline-block; width:100%; text-align:center",
            },
            ["Explore EMI options"]
          ),
        ]),
      ]),
    ]),
  ]);

  const configCard = el("section", { class: "grid grid--2" }, [
    el("div", { class: "card" }, [
      el("div", { class: "card__inner" }, [
        el("h2", { class: "card__title", text: "Gold valuation – powered by live prices (demo)" }),
        el("p", {
          class: "card__subtitle",
          text: "These indicative prices drive your gold value estimate and eligible loan. In production, this would be wired to HDFC-approved live rate feeds and policies.",
        }),
        el("div", { class: "form" }, [
          el("div", { class: "statgrid" }, [
            stat("24K price per gram (indicative)", inr(s.goldPricePerGram24k)),
            stat("22K price per gram (indicative)", inr(Math.round(s.goldPricePerGram24k * (22 / 24)))),
            stat("20K price per gram (indicative)", inr(Math.round(s.goldPricePerGram24k * (20 / 24)))),
            stat("18K price per gram (indicative)", inr(Math.round(s.goldPricePerGram24k * (18 / 24)))),
          ]),
          el("div", { class: "muted" }, [
            s.goldApi?.source === "goldpricez"
              ? `Rates refreshed automatically from demo gold-price API on ${s.goldApi.lastUpdatedDate || "latest"} (non-production).`
              : "Using bundled demo rates. Connect your own HDFC-approved rate API in code for live production pricing.",
          ]),
          el("label", {}, [
            "Loan-to-value (LTV) % – configurable as per policy",
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
        el("h2", { class: "card__title", text: "Your end‑to‑end HDFC gold loan journey (demo)" }),
        el("p", {
          class: "card__subtitle",
          text: "Experience how a fully digital HDFC Gold Loan flow can look – from discovery and guidance to online estimation and EMI planning.",
        }),
        el("div", { class: "statgrid" }, [
          stat("Smart gold loan chat", "Ask anything about HDFC-style gold loans, then get guided into the journey."),
          stat("Instant online pre‑assessment", "Four clear steps from basic details to estimated eligible amount."),
          stat("Digital gold valuation (demo)", "Use live‑linked rates and purity to estimate your gold value."),
          stat("Gold loan EMI planner", "See EMIs instantly for different tenures and rates before you walk into a branch."),
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

