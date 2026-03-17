import { storage } from "../lib/storage.js";
import { el, toast } from "../lib/dom.js";
import { answerGoldLoanFaq } from "./kb.js";

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sanitizeText(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function isYes(s) {
  return /^(y|yes|yeah|yep|sure|ok|okay|start|proceed|continue)$/i.test(s.trim());
}

function isNo(s) {
  return /^(n|no|nope|not now|later)$/i.test(s.trim());
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function addBotMessage(bodyEl, text, chips = []) {
  const bubble = el("div", { class: "bubble bubble--bot" }, [
    el("div", { text }),
    el("div", { class: "bubble__meta" }, [el("span", { text: `Bot • ${nowTime()}` })]),
  ]);
  if (chips.length) {
    const row = el(
      "div",
      { class: "chiprow" },
      chips.map((c) =>
        el("button", { class: "chip", type: "button", onClick: c.onClick }, [c.label])
      )
    );
    bubble.appendChild(row);
  }
  bodyEl.appendChild(bubble);
  bodyEl.scrollTop = bodyEl.scrollHeight;
}

function addUserMessage(bodyEl, text) {
  const bubble = el("div", { class: "bubble bubble--user" }, [
    el("div", { text }),
    el("div", { class: "bubble__meta" }, [el("span", { text: `You • ${nowTime()}` })]),
  ]);
  bodyEl.appendChild(bubble);
  bodyEl.scrollTop = bodyEl.scrollHeight;
}

function persistMessage(role, text) {
  storage.update((s) => {
    s.chat.messages.push({ role, text, ts: Date.now() });
    s.chat.messages = s.chat.messages.slice(-80);
    return s;
  });
}

function setChatState(patch) {
  storage.update((s) => {
    s.chat.state = { ...s.chat.state, ...patch };
    return s;
  });
}

function updateLead(patch) {
  storage.update((s) => {
    s.chat.state.lead = { ...s.chat.state.lead, ...patch };
    return s;
  });
}

function resetChatForNewLead() {
  storage.update((s) => {
    s.chat.state.phase = "faq";
    s.chat.state.lead = { firstName: "", lastName: "", place: "", dob: "", mobile: "" };
    s.chat.state.otp = null;
    s.chat.state.otpVerified = false;
    s.chat.messages = [];

    // Also reset application entry so the journey restarts cleanly.
    s.application.started = false;
    s.application.step = 0;
    s.application.emiLockedFromEstimate = false;
    return s;
  });
}

function getCtxFromStorage() {
  const s = storage.load();
  return { goldPricePerGram24k: s.goldPricePerGram24k, loanToValuePct: s.loanToValuePct };
}

function sendBot(bodyEl, text, chips = []) {
  addBotMessage(bodyEl, text, chips);
  persistMessage("bot", text);
}

function sendUser(bodyEl, text) {
  addUserMessage(bodyEl, text);
  persistMessage("user", text);
}

function promptStart(bodyEl, onNavigate) {
  // Start intent should appear in message history for consistency.
  handleUserText(bodyEl, onNavigate, "yes");
}

function promptPersonalInfo(bodyEl) {
  setChatState({ phase: "collecting" });
  sendBot(bodyEl, "To generate your Gold Loan Estimate, please share your First Name.");
}

function promptOtp(bodyEl) {
  const otp = randomOtp();
  setChatState({ phase: "otp", otp, otpVerified: false });
  sendBot(
    bodyEl,
    `I sent an OTP to your mobile. Enter the 6-digit OTP to verify.\n\nDemo OTP (for testing): ${otp}`
  );
}

function finishAndRedirect(bodyEl, onNavigate) {
  setChatState({ phase: "verified", otpVerified: true });
  storage.update((s) => {
    const lead = s.chat.state.lead || {};
    s.application.financial.firstName = lead.firstName || "";
    s.application.financial.lastName = lead.lastName || "";
    // Autofill city from chat "Place"
    if (lead.place) s.application.financial.city = lead.place;
    s.application.started = true;
    s.application.step = 0;
    return s;
  });
  sendBot(bodyEl, "Mobile verified. Would you like to start your Gold Loan Estimate now?", [
    {
      label: "Start Gold Loan Estimate",
      onClick: () => onNavigate("/apply"),
    },
  ]);
}

function handleCollecting(bodyEl, text) {
  const s = storage.load();
  const lead = s.chat.state.lead;

  if (!lead.firstName) {
    updateLead({ firstName: text });
    sendBot(bodyEl, "Thanks. Now share your Last Name.");
    return;
  }

  if (!lead.lastName) {
    updateLead({ lastName: text });
    sendBot(bodyEl, "Great. Now share your Place / City.");
    return;
  }

  if (!lead.place) {
    updateLead({ place: text });
    sendBot(bodyEl, "Thanks. Now share your Date of Birth (DD/MM/YYYY).");
    return;
  }

  if (!lead.dob) {
    const ok = /^(\d{2})\/(\d{2})\/(\d{4})$/.test(text);
    if (!ok) {
      sendBot(bodyEl, "Please enter DOB in DD/MM/YYYY format. Example: 09/02/1998");
      return;
    }
    updateLead({ dob: text });
    sendBot(bodyEl, "Got it. Now share your 10-digit mobile number.");
    return;
  }

  if (!lead.mobile) {
    const digits = text.replace(/\D/g, "");
    if (digits.length !== 10) {
      sendBot(bodyEl, "Please enter a valid 10-digit mobile number.");
      return;
    }
    updateLead({ mobile: digits });
    promptOtp(bodyEl);
    return;
  }
}

function handleOtp(bodyEl, onNavigate, text) {
  const s = storage.load();
  const expected = s.chat.state.otp;
  const entered = text.replace(/\D/g, "");
  if (entered.length !== 6) {
    sendBot(bodyEl, "Please enter the 6-digit OTP.");
    return;
  }
  if (entered !== expected) {
    sendBot(bodyEl, "That OTP doesn’t match. Please try again.");
    return;
  }
  finishAndRedirect(bodyEl, onNavigate);
}

function handleUserText(bodyEl, onNavigate, rawText) {
  const text = sanitizeText(rawText);
  if (!text) return;

  sendUser(bodyEl, text);

  const s = storage.load();
  const phase = s.chat.state.phase;

  if (phase === "askStart") {
    if (isYes(text)) {
      promptPersonalInfo(bodyEl);
      return;
    }
    if (isNo(text)) {
      setChatState({ phase: "faq" });
      sendBot(bodyEl, "No problem. Ask me anything about gold loans anytime.");
      return;
    }
    sendBot(bodyEl, "Please reply with Yes or No. Would you like to start the process?");
    return;
  }

  if (phase === "collecting") {
    handleCollecting(bodyEl, text);
    return;
  }

  if (phase === "otp") {
    handleOtp(bodyEl, onNavigate, text);
    return;
  }

  // FAQ mode
  if (isYes(text)) {
    promptPersonalInfo(bodyEl);
    return;
  }
  if (isNo(text)) {
    sendBot(bodyEl, "No problem. Ask me anything about gold loans anytime.");
    return;
  }
  const answer = answerGoldLoanFaq(text, getCtxFromStorage());
  sendBot(bodyEl, answer, [
    { label: "Get Gold Loan Estimate", onClick: () => promptStart(bodyEl, onNavigate) },
    { label: "Gold Loan EMI Calculator", onClick: () => onNavigate("/calculator") },
  ]);
}

export function createChat({ openBtn, closeBtn, overlay, panel, body, form, input, onNavigate }) {
  function open() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    input.focus();
  }
  function close() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  const navigate = (path) => {
    close();
    onNavigate(path);
  };

  openBtn?.addEventListener("click", () => open());
  closeBtn?.addEventListener("click", () => close());
  overlay?.addEventListener("click", () => close());

  const resetBtn = document.getElementById("resetChatBtn");
  resetBtn?.addEventListener("click", () => {
    resetChatForNewLead();
    toast("Chat reset");
    location.hash = "#/";
    location.reload();
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = "";
    handleUserText(body, navigate, text);
  });

  // Initial greeting
  const s = storage.load();
  if (!s.chat.messages.length) {
    sendBot(
      body,
      "Hi! I’m your HDBFS Gold Loan Smart Assistant.\nAsk me anything about the online gold loan process, interest rates, eligibility, charges, timelines, documents or EMIs."
    );
    sendBot(body, "Would you like to get an instant gold loan estimate now?", [
      { label: "Yes, start", onClick: () => handleUserText(body, navigate, "yes") },
      { label: "Not now", onClick: () => handleUserText(body, navigate, "no") },
    ]);
  } else {
    // Rehydrate last chat
    for (const m of s.chat.messages) {
      if (m.role === "user") addUserMessage(body, m.text);
      else addBotMessage(body, m.text);
    }
    body.scrollTop = body.scrollHeight;
  }

  // Utility chips
  const chips = el("div", { class: "chiprow" }, [
    el("button", { class: "chip", type: "button", onClick: () => navigate("/calculator") }, [
      "Open EMI calculator",
    ]),
  ]);
  body.appendChild(chips);

  window.addEventListener("hashchange", close);
}

