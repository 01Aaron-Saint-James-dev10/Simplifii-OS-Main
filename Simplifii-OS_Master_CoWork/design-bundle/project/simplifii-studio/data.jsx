/* global React */
// ============================================================
// BABS1201 Ground Truth data
// ============================================================

const PILLARS = [
  {
    id: "lit-review",
    num: "01",
    name: "Literature Review",
    weight: 25,
    due: "Wk 6",
    status: "active",
    wordTarget: 2000,
    rubric: [
      { marks: 10, title: "Source Quality and Breadth", criteria: "At least four peer-reviewed primary studies plus one synthesis review. Sources balanced across the four currents of the field, current within the last decade." },
      { marks: 15, title: "Critical Synthesis and Argument", criteria: "Weighs competing positions rather than cataloguing them. Names disagreements explicitly. Builds a defensible position grounded in cited evidence." }
    ],
    blocks: [
      { id: "foundation", name: "Foundation", target: 500, desc: "Frame the question, scope the field, name the four pillars you'll defend." },
      { id: "core",       name: "Core",       target: 1200, desc: "Synthesise across the literature. Weigh competing claims. Cite explicitly." },
      { id: "polish",     name: "Polish",     target: 300, desc: "Resolve open questions, gather threads, sharpen the references list." }
    ]
  },
  {
    id: "test-1",
    num: "02",
    name: "Test 1",
    weight: 30,
    due: "Wk 4",
    status: "done",
    wordTarget: 0,
    rubric: [
      { marks: 18, title: "Recall and Application", criteria: "Multiple choice plus short answer covering Weeks 1 to 3. Lab technique recall and conceptual application." },
      { marks: 12, title: "Quantitative Reasoning", criteria: "Numerical problems on enzyme kinetics and dilution series." }
    ],
    blocks: [
      { id: "study", name: "Study Plan", target: 0, desc: "Sat under the Foundation slot before this pillar was closed." }
    ]
  },
  {
    id: "sci-comm",
    num: "03",
    name: "Science Communication",
    weight: 25,
    due: "Wk 10",
    status: "queued",
    wordTarget: 1200,
    rubric: [
      { marks: 12, title: "Audience and Voice", criteria: "Translate one primary study for a non-specialist reader without losing accuracy." },
      { marks: 13, title: "Narrative Architecture", criteria: "Open with stakes. Land the finding. Close with the open question." }
    ],
    blocks: [
      { id: "hook",   name: "Hook",   target: 200, desc: "Open on a stake the reader already cares about." },
      { id: "body",   name: "Body",   target: 800, desc: "Explain the study. One idea per paragraph. No jargon without a gloss." },
      { id: "land",   name: "Landing", target: 200, desc: "Where this leaves the field. The honest open question." }
    ]
  },
  {
    id: "test-2",
    num: "04",
    name: "Test 2",
    weight: 20,
    due: "Wk 12",
    status: "queued",
    wordTarget: 0,
    rubric: [
      { marks: 14, title: "Integration", criteria: "Synthesises material from across the semester, not only the back half." },
      { marks: 6,  title: "Method Detail", criteria: "Identify and justify a chosen lab method against an alternative." }
    ],
    blocks: [
      { id: "study", name: "Study Plan", target: 0, desc: "Awaits Pillar 03 closure." }
    ]
  }
];

const SOURCE_DOCS = [
  {
    id: "outline",
    name: "CO_BABS1201_Course_Outline.pdf",
    abbr: "CO",
    tag: "MASTER SOURCE",
    tagClass: "tag-master",
    cluster: "methodology",
    pages: 24,
    opened: "2 hours ago",
    annotations: 38
  },
  {
    id: "brief",
    name: "Literature_Review_Brief.pdf",
    abbr: "LR",
    tag: "ACTIVE SPRINT",
    tagClass: "tag-active",
    cluster: "evidence",
    pages: 4,
    opened: "12 minutes ago",
    annotations: 17
  },
  {
    id: "akira-2024",
    name: "Akira_signalling_2024.pdf",
    abbr: "AK",
    tag: "PRIMARY",
    tagClass: "",
    cluster: "evidence",
    pages: 14,
    opened: "1 hour ago",
    annotations: 9
  },
  {
    id: "rubric",
    name: "Marking_Rubric_LitReview.pdf",
    abbr: "MR",
    tag: "REFERENCED",
    tagClass: "",
    cluster: "rubric",
    pages: 2,
    opened: "Yesterday",
    annotations: 6
  }
];

const STARTER_DRAFTS = {
  "lit-review": {
    foundation:
`The capacity of vertebrate immune systems to mount a proportional response to novel pathogens has occupied biologists for over a century. This review examines four currents in that literature: innate signalling cascades, adaptive memory, microbiome modulation, and tolerance thresholds. Each pillar contributes a distinct vocabulary, yet the most productive recent work sits at their intersections. The question this review answers is not whether these systems interact, which is now uncontroversial, but how the timing of their interaction shapes long-term host fitness.

To bound the field, the review treats studies published in the last decade and confines its scope to mammalian models, with reference to comparative work in teleosts only where it clarifies a mechanism. Sources are drawn from primary research articles indexed in PubMed and supplemented by two recent reviews that synthesise the older literature.

The argument develops in three stages. First, the foundation traces the mechanistic basis for each pillar and identifies the points at which the evidence is contested. Second, the core compares competing claims across the four pillars and weighs their explanatory power against shared experimental data. Third, the polish gathers the threads into a working hypothesis: that the timing of cross-talk, more than its magnitude, governs whether tolerance or escalation prevails.

Where the literature is unsettled, the review names the disagreement rather than papering over it. Two open questions structure the analysis. The first concerns whether microbial cues operate as triggers or as modulators of the adaptive response. The second concerns whether tolerance, once established, can be safely renegotiated under sustained pressure.`,
    core:
`The first pillar, innate signalling, has shifted in the last five years from a story about toll-like receptor specificity to a story about signal integration. Recent work from the Akira group reframes the cascade as a noisy averaging process rather than a clean switch.

Set against this, the adaptive memory literature continues to defend a more modular account, in which clonal selection alone is sufficient to explain durable protection. The two positions are rarely set head to head in a single review, which is the gap this section addresses.`,
    polish: ``
  }
};

const AURA_INITIAL = [
  {
    role: "aura",
    text: "I've parsed the Literature Review brief and aligned it against the Course Outline. You're chasing a 2,000 word target across four to six peer-reviewed sources. Want me to walk you through the 10 / 15 mark rubric split before you keep drafting?",
    cites: [
      { label: "Brief p.2", doc: "brief" },
      { label: "Outline p.7", doc: "outline" }
    ]
  },
  {
    role: "user",
    text: "Yes, walk me through it. Where should I tighten Foundation?"
  },
  {
    role: "aura",
    text: "The 10 marks reward source quality and breadth. The marker is looking for at least four primary studies plus one synthesis review, balanced across your four pillars. The 15 marks reward critical synthesis. They want you to weigh positions, not catalogue them. On Foundation, your scoping paragraph is strong but it does not yet name the disagreement. State the gap in one sentence before you list the four pillars.",
    cites: [
      { label: "Rubric p.1", doc: "rubric" },
      { label: "Brief p.3", doc: "brief" }
    ]
  },
  {
    role: "suggestion",
    label: "DRAFT INSERT",
    text: "Add after paragraph one: \"The field disagrees on whether microbial cues trigger or modulate the adaptive response. This review treats that disagreement as productive rather than terminal.\"",
    cites: [{ label: "Outline p.7", doc: "outline" }]
  }
];

window.SIMPLIFII_DATA = { PILLARS, SOURCE_DOCS, STARTER_DRAFTS, AURA_INITIAL };
