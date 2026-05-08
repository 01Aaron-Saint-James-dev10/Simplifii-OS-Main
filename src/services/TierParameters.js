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
