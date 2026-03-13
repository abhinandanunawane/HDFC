import { storage } from "../lib/storage.js";
import { el, toast, clear } from "../lib/dom.js";
import { inr, clamp } from "../lib/format.js";

const PURITY_FACTOR = {
  24: 1.0,
  22: 22 / 24,
  20: 20 / 24,
  18: 18 / 24,
};

export function renderApply(root) {
  const s = storage.load();

  const header = el("section", { class: "hero", style: "padding-bottom: 0" }, [
    el("div", { class: "hero__banner" }, [
      el("div", { class: "hero__row" }, [
        el("div", {}, [
          el("h1", { class: "hero__headline", text: "Apply for Gold Loan (Demo)" }),
          el("div", {
            class: "muted",
            text: "Complete the 4 steps. The final estimation uses current gold price and 75% LTV (configurable).",
          }),
        ]),
        el("div", { style: "min-width:260px; flex:0 0 auto" }, [
          el("div", { class: "muted", text: "24K price (demo)" }),
          el("div", { class: "calc__value", text: inr(s.goldPricePerGram24k) + " / gram" }),
          el("div", { style: "height:10px" }),
          el("a", { class: "btn", href: "#/", style: "display:inline-block; width:100%; text-align:center" }, [
            "Update demo settings",
          ]),
        ]),
      ]),
    ]),
  ]);

  const wrap = el("section", { class: "grid grid--2", style: "padding: 18px 0" });
  const left = el("div", { class: "card" }, [el("div", { class: "card__inner" })]);
  const right = el("div", { class: "card" }, [el("div", { class: "card__inner" })]);
  wrap.appendChild(left);
  wrap.appendChild(right);

  root.appendChild(header);
  root.appendChild(wrap);

  function setStep(next) {
    storage.update((st) => {
      st.application.started = true;
      st.application.step = clamp(next, 0, 3);
      return st;
    });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function actions({ canPrev, canNext, nextLabel = "Next", onNext }) {
    return el("div", { class: "actions" }, [
      el(
        "button",
        { class: "btn", type: "button", disabled: !canPrev, onClick: () => setStep(storage.load().application.step - 1) },
        ["Previous"]
      ),
      el(
        "button",
        {
          class: "btn btn--primary",
          type: "button",
          disabled: !canNext,
          onClick: () => (onNext ? onNext() : setStep(storage.load().application.step + 1)),
        },
        [nextLabel]
      ),
    ]);
  }

  function stepsBar(step) {
    const labels = ["Financial details", "eKYC", "Gold pictures", "Get estimation"];
    const kids = [];
    for (let i = 0; i < labels.length; i++) {
      kids.push(
        el("div", { class: `step ${i === step ? "step--active" : ""}` }, [
          el("div", { class: "step__num", text: String(i + 1) }),
          el("div", { class: "step__label", text: labels[i] }),
        ])
      );
      if (i !== labels.length - 1) kids.push(el("div", { class: "step__sep" }));
    }
    return el("div", { class: "steps" }, kids);
  }

  function renderRightSummary() {
    const s2 = storage.load();
    const fin = s2.application.financial;
    const est = s2.application.estimation;
    const lead = s2.chat.state.lead;

    const purityFactor = PURITY_FACTOR[Number(fin.purityKarat)] ?? (Number(fin.purityKarat) / 24);
    const weight = Number(fin.goldWeightGrams || 0);
    const evaluated = weight > 0 ? weight * purityFactor * Number(s2.goldPricePerGram24k) : 0;
    const eligible = evaluated > 0 ? (Number(s2.loanToValuePct) / 100) * evaluated : 0;

    const inner = right.firstChild;
    clear(inner);
    inner.appendChild(el("h2", { class: "card__title", text: "Summary" }));
    inner.appendChild(el("p", { class: "card__subtitle", text: "This updates as you fill the steps." }));
    inner.appendChild(
      el("div", { class: "statgrid" }, [
        stat("Applicant", lead?.name ? lead.name : "Not provided (chat)"),
        stat("Mobile", lead?.mobile ? `••••••${String(lead.mobile).slice(-4)}` : "Not verified"),
        stat("Gold weight", weight ? `${weight} g` : "—"),
        stat("Purity", fin.purityKarat ? `${fin.purityKarat}K` : "—"),
      ])
    );
    inner.appendChild(el("div", { class: "hr" }));
    inner.appendChild(el("div", { class: "muted", text: "Estimated gold value (demo)" }));
    inner.appendChild(el("div", { class: "calc__value", text: inr(Math.round(evaluated)) }));
    inner.appendChild(el("div", { class: "muted", style: "margin-top:10px", text: `Eligible loan (${s2.loanToValuePct}% LTV)` }));
    inner.appendChild(el("div", { class: "calc__value", text: inr(Math.round(eligible)) }));

    if (est?.checks?.length) {
      inner.appendChild(el("div", { class: "hr" }));
      inner.appendChild(el("div", { class: "muted", text: "Verification checks" }));
      inner.appendChild(
        el(
          "div",
          { class: "form" },
          est.checks.map((c) => el("div", { class: "muted", text: `- ${c}` }))
        )
      );
    }
  }

  function renderStep0(inner) {
    const s2 = storage.load();
    const fin = s2.application.financial;
    inner.appendChild(el("h2", { class: "card__title", text: "Step 1 — Financial details" }));
    inner.appendChild(el("p", { class: "card__subtitle", text: "Provide basic information to calculate initial eligibility (demo)." }));

    const form = el("div", { class: "form" }, [
      el("div", { class: "row" }, [
        labelInput("City", fin.city, (v) => setFin({ city: v })),
        labelSelect(
          "Employment",
          fin.employment,
          ["Salaried", "Self-employed", "Student", "Retired", "Other"],
          (v) => setFin({ employment: v })
        ),
      ]),
      el("div", { class: "row" }, [
        labelInput("Monthly income (₹)", fin.monthlyIncome, (v) => setFin({ monthlyIncome: digitsOnly(v) })),
        labelInput("Requested loan amount (₹)", fin.requestedAmount, (v) => setFin({ requestedAmount: digitsOnly(v) })),
      ]),
      el("div", { class: "row" }, [
        labelInput("Gold weight (grams)", fin.goldWeightGrams, (v) => setFin({ goldWeightGrams: digitsDot(v) })),
        labelSelect("Purity (Karat)", String(fin.purityKarat), ["24", "22", "20", "18"], (v) =>
          setFin({ purityKarat: Number(v) })
        ),
      ]),
      el("label", {}, [
        "Requested tenure (months)",
        el("input", {
          type: "range",
          min: "3",
          max: "36",
          step: "1",
          value: String(fin.requestedTenureMonths ?? 12),
          onInput: (e) => setFin({ requestedTenureMonths: Number(e.target.value) }),
        }),
        el("div", { class: "muted", text: `${fin.requestedTenureMonths ?? 12} months` }),
      ]),
    ]);

    inner.appendChild(form);
    const act = actions({
      canPrev: false,
      canNext: isStep0Valid(storage.load()),
    });
    const btns = act.querySelectorAll("button");
    if (btns[1]) btns[1].dataset.step = "0-next";
    inner.appendChild(act);
  }

  function renderStep1(inner) {
    const s2 = storage.load();
    const ekyc = s2.application.ekyc;
    inner.appendChild(el("h2", { class: "card__title", text: "Step 2 — eKYC" }));
    inner.appendChild(
      el("p", {
        class: "card__subtitle",
        text: "Enter KYC details (demo). In production, do this via secure eKYC providers and consent flows.",
      })
    );

    const form = el("div", { class: "form" }, [
      el("div", { class: "row" }, [
        labelSelect("ID type", ekyc.idType, ["Aadhaar", "PAN", "Passport", "Driving License"], (v) => setKyc({ idType: v })),
        labelInput("ID number", ekyc.idNumber, (v) => setKyc({ idNumber: v.trim() })),
      ]),
      el("label", {}, [
        "Address",
        el("textarea", {
          value: ekyc.address,
          onInput: (e) => setKyc({ address: e.target.value }),
        }),
      ]),
    ]);

    inner.appendChild(form);
    const act = actions({
      canPrev: true,
      canNext: isStep1Valid(storage.load()),
    });
    const btns = act.querySelectorAll("button");
    if (btns[1]) btns[1].dataset.step = "1-next";
    inner.appendChild(act);
  }

  function renderStep2(inner) {
    const s2 = storage.load();
    const gp = s2.application.goldPhotos;
    inner.appendChild(el("h2", { class: "card__title", text: "Step 3 — Gold pictures & guidelines" }));
    inner.appendChild(
      el("p", {
        class: "card__subtitle",
        text: "Upload clear photos so purity/hallmarks/invoice can be verified (demo).",
      })
    );

    inner.appendChild(el("div", { class: "stat" }, [
      el("div", { class: "stat__k", text: "Photo guidelines" }),
      el("div", { class: "muted", style: "margin-top:6px" }, [
        el("div", { text: "1) Take 3–4 angles: front, back, side, clasp/chain." }),
        el("div", { text: "2) Take a close-up of the hallmark stamp (very clear)." }),
        el("div", { text: "3) Use good lighting, plain background, no blur, no filters." }),
        el("div", { text: "4) Include the invoice image if available." }),
      ]),
    ]));

    const fileInput = el("input", {
      type: "file",
      accept: "image/*",
      multiple: "multiple",
      onChange: (e) => {
        const files = Array.from(e.target.files || []);
        storage.update((st) => {
          st.application.goldPhotos.files = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
          return st;
        });
        toast(`${files.length} image(s) selected`);
        render();
      },
    });

    const form = el("div", { class: "form" }, [
      el("label", {}, ["Upload gold images", fileInput]),
      el("label", {}, [
        el("span", { text: "Invoice provided?" }),
        el("select", {
          onChange: (e) => setGoldPhotos({ invoiceProvided: e.target.value === "Yes" }),
        }, [
          el("option", { value: "No", selected: gp.invoiceProvided ? null : "selected" }, ["No"]),
          el("option", { value: "Yes", selected: gp.invoiceProvided ? "selected" : null }, ["Yes"]),
        ]),
      ]),
      el("label", {}, [
        "Notes (optional)",
        el("textarea", { value: gp.notes, onInput: (e) => setGoldPhotos({ notes: e.target.value }) }),
      ]),
    ]);
    inner.appendChild(form);

    const fileList = (gp.files?.length ?? 0)
      ? el("div", { class: "stat", style: "margin-top:12px" }, [
          el("div", { class: "stat__k", text: "Selected files" }),
          el("div", { class: "muted", style: "margin-top:6px" }, [
            ...gp.files.map((f) => el("div", { text: `- ${f.name}` })),
          ]),
        ])
      : el("div", { class: "muted", style: "margin-top:10px", text: "No images selected yet." });
    inner.appendChild(fileList);

    const act = actions({
      canPrev: true,
      canNext: isStep2Valid(storage.load()),
      nextLabel: "Get estimation",
    });
    const btns = act.querySelectorAll("button");
    if (btns[1]) btns[1].dataset.step = "2-next";
    inner.appendChild(act);
  }

  function renderStep3(inner) {
    const s2 = storage.load();
    const fin = s2.application.financial;
    const ekyc = s2.application.ekyc;
    const gp = s2.application.goldPhotos;

    inner.appendChild(el("h2", { class: "card__title", text: "Step 4 — Estimation" }));
    inner.appendChild(el("p", { class: "card__subtitle", text: "We verify details (demo) and calculate eligible loan amount." }));

    const checks = [];
    if (fin.city) checks.push("Financial details captured");
    if (ekyc.idNumber && ekyc.address) checks.push("eKYC fields completed (demo)");
    if ((gp.files?.length ?? 0) >= 3) checks.push("Gold photos received (3+ images)");
    if (gp.invoiceProvided) checks.push("Invoice provided");
    if (!gp.invoiceProvided) checks.push("Invoice not provided (acceptable in some cases)");

    const purityFactor = PURITY_FACTOR[Number(fin.purityKarat)] ?? (Number(fin.purityKarat) / 24);
    const weight = Number(fin.goldWeightGrams || 0);
    const evaluatedValue = Math.max(0, weight * purityFactor * Number(s2.goldPricePerGram24k));
    const eligibleLoan = Math.max(0, (Number(s2.loanToValuePct) / 100) * evaluatedValue);

    storage.update((st) => {
      st.application.estimation = {
        evaluatedValue,
        eligibleLoan,
        checks,
      };
      st.application.emiLockedFromEstimate = false;
      return st;
    });

    inner.appendChild(el("div", { class: "statgrid" }, [
      stat("Current 24K gold price", inr(s2.goldPricePerGram24k) + " / gram"),
      stat("Purity factor used", `${(purityFactor * 100).toFixed(2)}% of 24K`),
      stat("Evaluated gold value", inr(Math.round(evaluatedValue))),
      stat(`Eligible loan (${s2.loanToValuePct}% of value)`, inr(Math.round(eligibleLoan))),
    ]));

    inner.appendChild(el("div", { class: "hr" }));
    inner.appendChild(el("div", { class: "muted", text: "Verification checks" }));
    inner.appendChild(el("div", { class: "form" }, checks.map((c) => el("div", { class: "muted", text: `- ${c}` }))));

    inner.appendChild(el("div", { class: "hr" }));
    inner.appendChild(
      el("div", { class: "actions" }, [
        el("button", { class: "btn", type: "button", onClick: () => setStep(2) }, ["Previous"]),
        el(
          "button",
          {
            class: "btn btn--primary",
            type: "button",
            onClick: () => {
              storage.update((st) => {
                st.application.emiLockedFromEstimate = true;
                return st;
              });
              location.hash = "#/calculator";
            },
          },
          ["Calculate EMI"]
        ),
      ])
    );
  }

  function render() {
    const step = storage.load().application.step ?? 0;
    const inner = left.firstChild;
    clear(inner);
    inner.appendChild(stepsBar(step));
    inner.appendChild(el("div", { style: "height: 14px" }));

    if (step === 0) renderStep0(inner);
    else if (step === 1) renderStep1(inner);
    else if (step === 2) renderStep2(inner);
    else renderStep3(inner);

    renderRightSummary();
  }

  function setFin(patch) {
    storage.update((st) => {
      st.application.financial = { ...st.application.financial, ...patch };
      return st;
    });
    renderRightSummary();
    const next = document.querySelector('button[data-step="0-next"]');
    if (next) next.disabled = !isStep0Valid(storage.load());
  }

  function setKyc(patch) {
    storage.update((st) => {
      st.application.ekyc = { ...st.application.ekyc, ...patch };
      return st;
    });
    renderRightSummary();
    const next = document.querySelector('button[data-step="1-next"]');
    if (next) next.disabled = !isStep1Valid(storage.load());
  }

  function setGoldPhotos(patch) {
    storage.update((st) => {
      st.application.goldPhotos = { ...st.application.goldPhotos, ...patch };
      return st;
    });
    renderRightSummary();
    const next = document.querySelector('button[data-step="2-next"]');
    if (next) next.disabled = !isStep2Valid(storage.load());
  }

  render();
}

function labelInput(label, value, onChange) {
  return el("label", {}, [
    label,
    el("input", { value: value ?? "", onInput: (e) => onChange(e.target.value) }),
  ]);
}

function labelSelect(label, value, options, onChange) {
  return el("label", {}, [
    label,
    el(
      "select",
      { onChange: (e) => onChange(e.target.value) },
      options.map((o) =>
        el("option", { value: o, selected: String(o) === String(value) ? "selected" : null }, [String(o)])
      )
    ),
  ]);
}

function digitsOnly(s) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function digitsDot(s) {
  return String(s ?? "").replace(/[^\d.]/g, "");
}

function isStep0Valid(state) {
  const fin = state.application.financial;
  const weight = Number(fin.goldWeightGrams || 0);
  const income = Number(fin.monthlyIncome || 0);
  return Boolean(fin.city && income > 0 && weight > 0 && fin.purityKarat);
}

function isStep1Valid(state) {
  const k = state.application.ekyc;
  return Boolean(k.idType && k.idNumber && k.address && k.address.trim().length >= 10);
}

function isStep2Valid(state) {
  const gp = state.application.goldPhotos;
  return (gp.files?.length ?? 0) >= 3;
}

function stat(k, v) {
  return el("div", { class: "stat" }, [
    el("div", { class: "stat__k", text: k }),
    el("div", { class: "stat__v", text: v }),
  ]);
}

