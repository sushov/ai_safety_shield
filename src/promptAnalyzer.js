// src/promptAnalyzer.js

// Simple utility: normalize text for pattern checks
function normalize(text) {
  return text.toLowerCase();
}

// Returns an analysis object with:
// - riskScore: 0–100
// - categories: [{ id, label, severity, triggered, examples }]
// - suggestions: string[]
export function analyzePrompt(prompt, useCase = "general") {
  const text = normalize(prompt || "");
  const categories = [];

  // Helper to push a category result
  const addCategory = (id, label, severity, triggered, examples = []) => {
    categories.push({ id, label, severity, triggered, examples });
  };

  // --- 1) Jailbreak & safety bypass attempts ---
  const jailbreakPatterns = [
    "ignore previous instructions",
    "disregard previous instructions",
    "without any restrictions",
    "bypass safety",
    "override your safety",
    "act as an unfiltered model",
    "no limitations",
  ];
  const jailbreakHits = jailbreakPatterns.filter((p) => text.includes(p));

  addCategory(
    "jailbreak",
    "Jailbreak / Safety Bypass Attempts",
    "high",
    jailbreakHits.length > 0,
    jailbreakHits
  );

  // --- 2) Self-harm / harm to others (very rough heuristic) ---
  const selfHarmPatterns = [
    "suicide",
    "self-harm",
    "kill myself",
    "hurt myself",
  ];
  const violencePatterns = [
    "kill him",
    "kill her",
    "how to hurt",
    "seriously injure",
  ];

  const selfHarmHits = selfHarmPatterns.filter((p) => text.includes(p));
  const violenceHits = violencePatterns.filter((p) => text.includes(p));

  addCategory(
    "self_harm",
    "Self-harm / Harm to others",
    "critical",
    selfHarmHits.length > 0 || violenceHits.length > 0,
    [...selfHarmHits, ...violenceHits]
  );

  // --- 3) Illegal activities / evasion ---
  const illegalPatterns = [
    "how to hack",
    "bypass authentication",
    "evade law enforcement",
    "buy illegal",
    "counterfeit",
    "fraudulently",
  ];
  const illegalHits = illegalPatterns.filter((p) => text.includes(p));

  addCategory(
    "illegal",
    "Illegal Activity / Evasion",
    "high",
    illegalHits.length > 0,
    illegalHits
  );

  // --- 4) Sensitive personal data / privacy ---
  const emailRegex = /\b[\w.-]+@[\w.-]+\.\w+\b/;
  const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
  const ssnLikeRegex = /\b\d{3}-\d{2}-\d{4}\b/;

  const sensitiveHits = [];
  if (emailRegex.test(prompt)) sensitiveHits.push("email-like pattern");
  if (phoneRegex.test(prompt)) sensitiveHits.push("phone-number-like pattern");
  if (ssnLikeRegex.test(prompt)) sensitiveHits.push("SSN-like pattern");

  addCategory(
    "privacy",
    "Sensitive Personal Data / Privacy",
    "medium",
    sensitiveHits.length > 0,
    sensitiveHits
  );

  // --- 5) Hate / harassment (very conservative heuristic) ---
  // NOTE: This is intentionally minimal & generic; real systems are far more nuanced.
  const harassmentPatterns = ["you are useless", "you are worthless"];
  const harassmentHits = harassmentPatterns.filter((p) => text.includes(p));

  addCategory(
    "harassment",
    "Harassment / Targeted Insults",
    "medium",
    harassmentHits.length > 0,
    harassmentHits
  );

  // --- 6) Use-case alignment / ambiguity ---
  const isVeryShort = prompt.trim().length < 10;
  const isEmpty = prompt.trim().length === 0;

  addCategory(
    "low_context",
    "Low Context / Underspecified Prompt",
    "low",
    !isEmpty && isVeryShort,
    []
  );

  // --- Compute a simple risk score ---
  let riskScore = 0;
  categories.forEach((cat) => {
    if (!cat.triggered) return;
    switch (cat.severity) {
      case "critical":
        riskScore += 60;
        break;
      case "high":
        riskScore += 35;
        break;
      case "medium":
        riskScore += 20;
        break;
      case "low":
        riskScore += 10;
        break;
    }
  });
  if (riskScore > 100) riskScore = 100;

  // --- Suggestions: basic, interpretable guidance ---
  const suggestions = [];

  if (categories.find((c) => c.id === "jailbreak" && c.triggered)) {
    suggestions.push(
      "Avoid asking the model to bypass or ignore safety instructions. Instead, clearly describe the helpful outcome you want."
    );
  }

  if (categories.find((c) => c.id === "self_harm" && c.triggered)) {
    suggestions.push(
      "If this prompt is about self-harm or harm to others, consider reframing it toward seeking support, prevention, or general information instead of instructions."
    );
  }

  if (categories.find((c) => c.id === "illegal" && c.triggered)) {
    suggestions.push(
      "Remove requests for advice on illegal activities. Focus on legal, ethical alternatives."
    );
  }

  if (categories.find((c) => c.id === "privacy" && c.triggered)) {
    suggestions.push(
      "Avoid including real emails, phone numbers, or highly sensitive identifiers in prompts. Use placeholders like <EMAIL> or <PHONE> instead."
    );
  }

  if (categories.find((c) => c.id === "harassment" && c.triggered)) {
    suggestions.push(
      "Rephrase any targeted insults or harassment into neutral or constructive language."
    );
  }

  if (categories.find((c) => c.id === "low_context" && c.triggered)) {
    suggestions.push(
      "Add more context about what you’re trying to achieve so the model can respond safely and helpfully."
    );
  }

  if (suggestions.length === 0 && !isEmpty) {
    suggestions.push(
      "This prompt does not trigger any obvious safety rules in this simple heuristic. A more advanced system would still run deeper checks."
    );
  }

  if (isEmpty) {
    suggestions.push("Enter a prompt to analyze.");
  }

  return {
    riskScore,
    categories,
    suggestions,
    useCase,
  };
}
