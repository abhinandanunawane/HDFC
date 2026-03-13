const bullets = (xs) => xs.map((x) => `- ${x}`).join("\n");

export function answerGoldLoanFaq(q, ctx) {
  const query = String(q || "").trim().toLowerCase();
  const price = ctx?.goldPricePerGram24k ?? 7000;
  const ltv = ctx?.loanToValuePct ?? 75;

  const common = `\n\nIf you want, I can start your application now.`;

  if (!query) {
    return "Ask me anything about gold loan: interest rates, eligibility, process, charges, timeline, repayment, or documents.";
  }

  if (/(interest|rate|roi|apr)/.test(query)) {
    return (
      `Interest rate depends on multiple factors (loan amount, tenure, scheme, customer profile, and branch policies).\n\n` +
      `Typical factors that influence the rate:\n` +
      bullets([
        "Loan-to-value (LTV) and gold purity/valuation",
        "Tenure and repayment type",
        "Promotional schemes / special offers",
        "Customer relationship / risk checks",
      ]) +
      `\n\nIn this demo, the EMI calculator lets you choose an interest rate to see EMI/interest.` +
      common
    );
  }

  if (/(process|apply|application|steps|timeline|time|how long)/.test(query)) {
    return (
      `End-to-end process (typical):\n` +
      bullets([
        "Share basic details and verify mobile via OTP",
        "Provide financial details and eKYC information",
        "Upload gold photos (purity/hallmark/invoice where available)",
        "Valuation and eligibility calculation",
        "Disbursal after verification (timeline varies by branch and document completeness)",
      ]) +
      `\n\nIn this demo, you can complete the full flow in the Apply section.` +
      common
    );
  }

  if (/(charges|fee|fees|processing|penal|foreclosure|prepay|late)/.test(query)) {
    return (
      `Charges vary by product/scheme and branch. Common charge types include:\n` +
      bullets([
        "Processing fee (sometimes promotional/waived)",
        "Documentation / app charges (where applicable)",
        "Stamp duty (as applicable by state)",
        "Late payment / penal interest (if EMI overdue)",
        "Part-prepayment / foreclosure charges (scheme-dependent)",
      ]) +
      `\n\nIf you tell me your city and loan amount, I can guide what to ask your branch for a final quote.` +
      common
    );
  }

  if (/(eligib|eligible|who can|requirements|age|documents)/.test(query)) {
    return (
      `Eligibility (high-level):\n` +
      bullets([
        "You own gold jewellery/coins accepted by the lender",
        "Sufficient purity/weight after valuation",
        "Valid KYC (ID + address proof) and basic checks",
        "Age and residency as per policy",
      ]) +
      `\n\nDocuments commonly requested:\n` +
      bullets(["Photo ID (Aadhaar/PAN/etc.)", "Address proof", "Recent photo", "Gold purchase invoice (if available)"]) +
      common
    );
  }

  if (/(ltv|loan to value|75%|how much loan|amount)/.test(query)) {
    return (
      `In this demo, eligible loan amount is calculated as:\n` +
      `Evaluated gold value = (gold weight in grams) × (purity factor) × (current price per gram)\n` +
      `Eligible loan = ${ltv}% of evaluated gold value\n\n` +
      `Current demo 24K price is ₹${Number(price).toLocaleString("en-IN")} per gram (editable on Home/Apply).` +
      common
    );
  }

  if (/(emi|calculator|monthly|repay|repayment)/.test(query)) {
    return (
      `You can calculate EMI from the EMI Calculator page.\n\n` +
      `It shows monthly EMI and total interest for the chosen amount, interest rate, and tenure.` +
      common
    );
  }

  return (
    `I can help with gold loan FAQs like interest rates, process, charges, documents, valuation, and EMI.\n\n` +
    `Try asking:\n` +
    bullets([
      "What is the process for gold loan?",
      "What charges are applicable?",
      "How is the loan amount calculated?",
      "How do I calculate EMI?",
    ]) +
    common
  );
}

