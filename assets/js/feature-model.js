(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PortfolioFeatureModel = model;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const normalize = (text) =>
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  function matchesSkill(skill, query, category) {
    if (category !== 'all' && skill.category !== category) return false;
    const text = normalize(skill.label + ' ' + skill.keywords);
    const tokens = text.split(/\s+/);
    return normalize(query)
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => tokens.some((token) => token.startsWith(term)));
  }
  function normalizeSaved(raw, allowedKeys) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw)].filter((key) => typeof key === 'string' && allowedKeys.includes(key));
  }
  function normalizeComparison(raw, allowedKeys) {
    const valid = normalizeSaved(raw, allowedKeys);
    return valid.length >= 2 ? valid : allowedKeys.slice();
  }
  return { matchesSkill, normalizeSaved, normalizeComparison };
});
