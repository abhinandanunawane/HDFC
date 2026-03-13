import { el } from "../lib/dom.js";
import { storage } from "../lib/storage.js";
import { inr, clamp, round2, pct } from "../lib/format.js";

function calcEmi(principal, annualRatePct, months) {
  const P = Number(principal);
  const n = Number(months);
  const r = Number(annualRatePct) / 12 / 100;
  if (!(P > 0) || !(n > 0)) return { emi: 0, total: 0, interest: 0 };
  if (r === 0) {
    const emi = P / n;
    return { emi, total: P, interest: 0 };
  }
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;
  return { emi, total, interest };
}

export function renderCalculator(root) {
  const state = storage.load();
  const est = state.application?.estimation;
  const lockedFromEstimate = Boolean(state.application?.emiLockedFromEstimate && est?.eligibleLoan > 0);

  let amount = lockedFromEstimate ? est.eligibleLoan : 200000;
  let rate = 12.5;
  let tenure = 12;

  const outputEmi = el("div", { class: "calc__value" });
  const outputInterest = el("div", { class: "stat__v" });
  const outputTotal = el("div", { class: "stat__v" });

  function rerender() {
    const { emi, interest, total } = calcEmi(amount, rate, tenure);
    outputEmi.textContent = inr(Math.round(emi));
    outputInterest.textContent = inr(Math.round(interest));
    outputTotal.textContent = inr(Math.round(total));
  }

  const amountControl = lockedFromEstimate
    ? el("div", { class: "rangeRow" }, [
        el("div", { class: "rangeRow__top" }, [
          el("div", { text: "Loan amount (from estimation)", style: "font-weight:800" }),
          el("div", { class: "muted", text: inr(amount) }),
        ]),
        el("div", {
          class: "muted",
          text: "Amount is locked to the eligible loan calculated in Step 4. To change it, restart from Step 1.",
        }),
      ])
    : rangeControl({
        label: "Loan amount",
        min: 10000,
        max: 1500000,
        step: 1000,
        initial: amount,
        format: (v) => inr(v),
        onChange: (v) => {
          amount = v;
          rerender();
        },
      });

  const page = el("section", { class: "grid grid--2", style: "padding: 18px 0" }, [
    el("div", { class: "card" }, [
      el("div", { class: "card__inner" }, [
        el("h2", { class: "card__title", text: "EMI Calculator" }),
        el("p", {
          class: "card__subtitle",
          text: "Slide the values to estimate EMI and total interest (demo).",
        }),
        el("div", { class: "calc__grid" }, [
          amountControl,
          rangeControl({
            label: "Interest rate (annual)",
            min: 6,
            max: 24,
            step: 0.1,
            initial: rate,
            format: (v) => pct(round2(v)),
            onChange: (v) => {
              rate = v;
              rerender();
            },
          }),
          rangeControl({
            label: "Tenure (months)",
            min: 3,
            max: 60,
            step: 1,
            initial: tenure,
            format: (v) => `${v} months`,
            onChange: (v) => {
              tenure = v;
              rerender();
            },
          }),
        ]),
      ]),
    ]),
    el("div", { class: "card" }, [
      el("div", { class: "card__inner" }, [
        el("h2", { class: "card__title", text: "Result" }),
        el("p", { class: "card__subtitle", text: "Approximate monthly EMI (rounded)." }),
        el("div", { class: "muted", text: "Monthly EMI" }),
        outputEmi,
        el("div", { class: "hr" }),
        el("div", { class: "statgrid" }, [
          el("div", { class: "stat" }, [
            el("div", { class: "stat__k", text: "Total interest" }),
            outputInterest,
          ]),
          el("div", { class: "stat" }, [
            el("div", { class: "stat__k", text: "Total repayment" }),
            outputTotal,
          ]),
        ]),
        el("div", { class: "hr" }),
        el("div", { class: "muted" }, [
          "For production accuracy, use lender-specific rate tables, rounding rules, and fee/tax inclusion.",
        ]),
      ]),
    ]),
  ]);

  root.appendChild(page);
  rerender();
}

function rangeControl({ label, min, max, step, initial, format, onChange }) {
  const val = el("div", { class: "muted" });
  const input = el("input", {
    type: "range",
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(initial),
    onInput: (e) => {
      const v = clamp(Number(e.target.value), min, max);
      val.textContent = format(v);
      onChange(v);
    },
  });
  val.textContent = format(initial);
  return el("div", { class: "rangeRow" }, [
    el("div", { class: "rangeRow__top" }, [el("div", { text: label, style: "font-weight:800" }), val]),
    input,
  ]);
}

