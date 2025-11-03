const PASSWORD_RULES = [
    { id: "length", msg: "8-16 Zeichen", test: v => v.length >= 8 && v.length <= 16},
    { id: "upper", msg: "mind. 1 Grossbuchstabe", test: v => /[A-Z]/.test(v) },
    { id: "lower", msg: "mind. 1 Kleinbuchstabe", test: v => /[a-z]/.test(v) },
    { id: "digit", msg: "mind. 1 Zahl", test: v => /\d/.test(v) },
    { id: "special", msg: "mind. 1 Sonderzeichen", test: v => /[^\w\s:]/.test(v) },
    { id: "nowhite", msg: "keine Leerzeichen", test: v => !/\s/.test(v) },
];

function validatePassword(value) {
    const results = Object.fromEntries(PASSWORD_RULES.map(r => [r.id, !!r.test(value)]));
    const valid = Object.values(results).every(Boolean);
    const missing = PASSWORD_RULES.filter(r => !results[r.id]).map(r => r.msg);
    return { valid, results, missing };
}

// Export für Node.js und Browser:
if (typeof module !== "undefined" && module.exports) {
    module.exports = { PASSWORD_RULES, validatePassword };
} else {
    window.PASSWORD_RULES = PASSWORD_RULES;
    window.validatePassword = validatePassword;
}