// NOTE: This file is superseded by TierService.js for all new code.
// TierService.js is the canonical source of tier definitions, capability maps,
// and facet gating. TierParameters remains here because existing services
// (BriefService, ScaffoldingService, etc.) still import it directly.
// Do not add new tiers or facets here. Removal is a separate cleanup sprint.
export const TierParameters = {
  Undergrad: {
    heuristics: {
      words: /(?:word count|limit|maximum)\s*[:\-]?\s*(\d+)/i,
      rubric: /(?:High Distinction|Marking Criteria)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      outcomes: /(?:LO|Outcome|CLO)\s*\d*[:\-]?\s*([A-Za-z0-9\s,]+)/gi
    },
    structure: 'sectional'
  },
  Honours: {
    heuristics: {
      methodology: /(?:methodology|methods|rigor)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      ethics: /(?:ethics|approval|committee)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      analysis: /(?:data analysis|statistical|qualitative)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi
    },
    structure: 'chapters'
  },
  Tertiary: {
    heuristics: {
      gap: /(?:research gap|gap in literature)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      framework: /(?:theoretical framework|conceptual framework)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      synthesis: /(?:literature synthesis|synthesis)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi
    },
    structure: 'nodes'
  },
  PhD: {
    heuristics: {
      publication: /(?:publication standard|journal)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      grant: /(?:grant allocation|funding)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi,
      milestones: /(?:multi-year|milestones)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi
    },
    structure: 'sprints'
  }
};
