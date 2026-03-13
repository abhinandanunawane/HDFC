const bullets = (xs) => xs.map((x) => `- ${x}`).join("\n");

export function answerGoldLoanFaq(q, ctx) {
  const query = String(q || "").trim().toLowerCase();
  const price = ctx?.goldPricePerGram24k ?? 7000;
  const ltv = ctx?.loanToValuePct ?? 75;

  const common = `\n\nIf you want, I can start your HDFC-style gold loan journey now and get you an instant online estimate.`;

  if (!query) {
    return "Ask me anything about HDFC Gold Loan: online process, interest rates, eligibility, charges, timelines, repayment options or documents.";
  }

  if (/(interest|rate|roi|apr)/.test(query)) {
    return (
      `HDFC Gold Loan interest rates depend on multiple factors like loan amount, tenure, scheme and customer profile.\n\n` +
      `Common factors that influence your final rate:\n` +
      bullets([
        "Loan-to-value (LTV) and gold purity/valuation",
        "Tenure and repayment type",
        "Promotional schemes / special offers",
        "Customer relationship / risk checks",
      ]) +
      `\n\nIn this demo, the Gold Loan EMI Planner lets you try different rates and tenures to see how your EMI changes.` +
      common
    );
  }

  if (/(process|apply|application|steps|timeline|time|how long)/.test(query)) {
    return (
      `Typical digital‑plus‑branch HDFC Gold Loan journey:\n` +
      bullets([
        "Share basic details online and verify your mobile with OTP",
        "Provide simple financial information and eKYC details",
        "Upload gold jewellery photos and invoice (where available) for an early view on eligibility (demo)",
        "Get an indicative valuation and eligible gold loan estimate",
        "Visit the HDFC branch with your gold for final verification and disbursal",
      ]) +
      `\n\nIn this demo, you can experience a similar guided flow in the Apply section.` +
      common
    );
  }

  if (/(charges|fee|fees|processing|penal|foreclosure|prepay|late)/.test(query)) {
    return (
      `Charges vary by HDFC Gold Loan scheme and branch. Typical charge types include:\n` +
      bullets([
        "Processing fee (sometimes promotional/waived)",
        "Documentation / app charges (where applicable)",
        "Stamp duty (as applicable by state)",
        "Late payment / penal interest (if EMI overdue)",
        "Part-prepayment / foreclosure charges (scheme-dependent)",
      ]) +
      `\n\nIf you tell me your city and approximate gold loan amount, I can guide what to clarify with the branch for an accurate quote.` +
      common
    );
  }

  if (/(eligib|eligible|who can|requirements|age|documents)/.test(query)) {
    return (
      `High‑level HDFC Gold Loan eligibility:\n` +
      bullets([
        "You own gold jewellery/coins accepted by the lender",
        "Sufficient purity/weight after valuation",
        "Valid KYC (ID + address proof) and basic checks",
        "Age and residency as per policy",
      ]) +
      `\n\nDocuments commonly requested (may vary by scheme):\n` +
      bullets(["Photo ID (Aadhaar/PAN/etc.)", "Address proof", "Recent photo", "Gold purchase invoice (if available)"]) +
      common
    );
  }

  if (/(ltv|loan to value|75%|how much loan|amount)/.test(query)) {
    return (
      `In this demo, your indicative HDFC-style gold loan eligibility is calculated as:\n` +
      `Evaluated gold value = (gold weight in grams) × (purity factor) × (current price per gram)\n` +
      `Indicative eligible loan = ${ltv}% of evaluated gold value\n\n` +
      `Current demo 24K price is ₹${Number(price).toLocaleString("en-IN")} per gram (driven by the gold rate section on Home).` +
      common
    );
  }

  if (/(emi|calculator|monthly|repay|repayment)/.test(query)) {
    return (
      `You can plan EMIs from the Gold Loan EMI Planner.\n\n` +
      `It shows an estimated monthly EMI, total interest and total repayment for your chosen amount, interest rate and tenure.\n` +
      `When you come from the estimate flow, the loan amount is auto‑picked from your gold loan estimate.` +
      common
    );
  }

  return (
    `I can help with HDFC Gold Loan FAQs like interest rates, online process, charges, documents, valuation, and EMI planning.\n\n` +
    `Try asking:\n` +
    bullets([
      "What is the online process for HDFC Gold Loan?",
      "What charges can apply on a gold loan?",
      "How do you estimate my gold loan amount?",
      "How do I calculate my gold loan EMI?",
    ]) +
    common
  );
}

