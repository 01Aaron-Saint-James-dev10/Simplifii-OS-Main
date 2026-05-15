/**
 * /api/generate-sections
 *
 * AI generates the section structure for an assessment based on the
 * uploaded brief content. Returns dynamic sections (not hardcoded
 * Intro/Body/Conclusion) tailored to the actual assessment type.
 *
 * POST { briefText, assessmentTitle, assessmentType, tier, wordCount }
 * Returns { success, sections: [{ type, label, targetWords, guidance }] }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only.' });

  const { briefText, assessmentTitle, assessmentType, tier, wordCount } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API key not configured.' });
  if (!briefText || briefText.length < 20) return res.status(400).json({ success: false, error: 'briefText required.' });

  const systemPrompt = `You are a section structure generator inside Simplifii-OS. Australian English. No em-dashes.

Analyse this assessment brief and generate the OPTIMAL section structure for this specific assessment type.

DO NOT default to Introduction/Body/Conclusion for everything. Match the assessment type:
- Essay: Introduction, Argument sections (named by topic), Conclusion
- Lab Report: Title, Abstract, Introduction, Method, Results, Discussion, Conclusion, References
- Literature Review: Introduction, Theme sections (named by theme), Synthesis, Conclusion
- Case Study: Executive Summary, Background, Analysis, Recommendations, Conclusion
- Research Proposal: Background, Research Questions, Methodology, Timeline, References
- Reflective Journal: Context, Experience, Reflection, Action Plan
- Oral Presentation: Hook, Key Points, Evidence, Call to Action
- Portfolio: Introduction, Evidence sections, Reflection
- For anything else: analyse the brief and create appropriate sections

Return ONLY valid JSON (no markdown, no explanation). Format:
{
  "sections": [
    { "type": "section_1", "label": "Section Name", "targetWords": 300, "guidance": "One sentence: what goes here" },
    { "type": "section_2", "label": "Section Name", "targetWords": 400, "guidance": "One sentence" }
  ]
}

RULES:
- Each section type must be a unique lowercase_snake_case identifier
- targetWords should sum to approximately ${wordCount || 2000}
- guidance must be specific to THIS assessment, not generic
- 3-8 sections (fewer for short tasks, more for complex ones)
- ${tier === 'secondary' ? 'Student is Year 10-12. Keep guidance in plain language.' : ''}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 800, system: systemPrompt,
        messages: [{ role: 'user', content: `Assessment: "${assessmentTitle || 'Untitled'}"\nType: ${assessmentType || 'unknown'}\nWord count: ${wordCount || 2000}\n\nBrief:\n${briefText.slice(0, 4000)}` }],
      }),
    });

    if (!response.ok) return res.status(502).json({ success: false, error: `Claude returned ${response.status}` });
    const data = await response.json();
    const raw = data?.content?.[0]?.text || '';

    // Parse JSON from response (Claude may wrap in markdown code block)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ success: true, sections: getDefaultSections(wordCount) });

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return res.status(200).json({ success: true, sections: getDefaultSections(wordCount) });
    }

    return res.status(200).json({ success: true, sections: parsed.sections });
  } catch (err) {
    return res.status(200).json({ success: true, sections: getDefaultSections(wordCount), fallback: true });
  }
}

function getDefaultSections(wordCount) {
  const wc = wordCount || 2000;
  return [
    { type: 'introduction', label: 'Introduction', targetWords: Math.round(wc * 0.15), guidance: 'Set the context and state your thesis.' },
    { type: 'body_1', label: 'Body Section 1', targetWords: Math.round(wc * 0.25), guidance: 'First main argument with evidence.' },
    { type: 'body_2', label: 'Body Section 2', targetWords: Math.round(wc * 0.25), guidance: 'Second main argument with evidence.' },
    { type: 'body_3', label: 'Body Section 3', targetWords: Math.round(wc * 0.20), guidance: 'Third argument or counterargument.' },
    { type: 'conclusion', label: 'Conclusion', targetWords: Math.round(wc * 0.15), guidance: 'Summarise and restate significance.' },
  ];
}
