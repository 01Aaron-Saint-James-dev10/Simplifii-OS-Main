/**
 * RubricTranslatorService.js
 *
 * Tier 1 stub. Translates rubric criteria into plain language
 * with "what the marker wants" for each criterion.
 *
 * Contract: docs/TOOLS_SPEC.md Tool #2
 */

function mockRubricTranslatorOutput(criteria, bands) {
  const bandNames = bands && bands.length > 0 ? bands : ['Excellent', 'Good', 'Satisfactory', 'Unsatisfactory'];
  return {
    plainCriteria: (criteria || []).map(c => ({
      original: c,
      simplified: `In plain terms: ${c.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`,
      whatMarkerWants: `The marker is checking whether you can demonstrate ${c.toLowerCase()}. Use specific examples from your sources.`,
    })),
    bandNames,
  };
}

// TODO: wire to /api/tools/rubric-translator (Anthropic API)
export async function runRubricTranslator({ rubricCriteria, rubricBands }) {
  return mockRubricTranslatorOutput(rubricCriteria, rubricBands);
}
