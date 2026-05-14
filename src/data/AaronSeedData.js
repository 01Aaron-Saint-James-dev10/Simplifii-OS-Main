/**
 * AaronSeedData.js
 *
 * Pre-seeded MRes data for Aaron Saint-James.
 * Applied once on first launch of the research workspace (guarded by a
 * localStorage flag). All strings use Australian English. No em-dashes.
 *
 * Real research context:
 *   Project: UDL 3.0 Adoption Across Australian Universities
 *   Supervisor: Prof Terry Cumming
 *   Institution: UNSW Sydney
 *   Phase 1 (2026-2027): Institutional Mapping
 *     Strand 1: National Policy and Resource Audit (38 universities)
 *     Strand 2: UNSW Staff Survey and Cross-institution Interviews
 */

// Fixed IDs so the seed is idempotent across runs
const PROJECT_ID = 'proj_aaron_mres_2026';
const PHASE_1_ID = 'phase_mres_2026';
const PHASE_2_ID = 'phase_phd_2027';
const PHASE_3_ID = 'phase_postdoc_2030';
const STRAND_1_ID = 'strand_audit_2026';
const STRAND_2_ID = 'strand_interviews_2026';
const CH_INTRO_ID   = 'ch_1_intro';
const CH_LIT_ID     = 'ch_2_litreview';
const CH_METH_ID    = 'ch_3_methodology';
const CH_FIND1_ID   = 'ch_4_findings_audit';
const CH_FIND2_ID   = 'ch_5_findings_interviews';
const CH_DISC_ID    = 'ch_6_discussion';
const CH_CONC_ID    = 'ch_7_conclusion';

export const AARON_PROJECT = {
  projectId: PROJECT_ID,
  userId: 'local',
  title: 'UDL 3.0 Adoption Across Australian Universities',
  shortTitle: 'UDL Adoption Audit',
  institution: 'UNSW Sydney',
  supervisor: 'Prof Terry Cumming',
  supervisorEmail: null,
  ethicsNumber: null,
  positionalityStatement:
    'I am a UNSW staff member with lived experience of disability and neurodivergence. ' +
    'This dual positionality (researcher and practitioner) is both a methodological asset ' +
    'and a source of tension that I address explicitly in Chapter 3. I acknowledge my advocacy ' +
    'investment in UDL adoption and have documented strategies to maintain analytical rigour throughout.',
  theoreticalFramework:
    'Universal Design for Learning 3.0 (CAST, 2024) as the primary framework, situated within ' +
    'critical disability studies and institutional theory. The audit draws on Braun and Clarke ' +
    'reflexive thematic analysis for qualitative strands and descriptive statistics for the ' +
    'national audit strand.',
  status: 'active',
  startYear: 2026,
  targetYear: 2027,
  addedAt: '2026-01-15T09:00:00.000Z',
  updatedAt: '2026-05-14T09:00:00.000Z',
};

export const AARON_PHASES = [
  {
    phaseId: PHASE_1_ID,
    projectId: PROJECT_ID,
    title: 'Phase 1: MRes (2026-2027)',
    type: 'mres',
    description: 'Institutional Mapping. National audit of 38 Australian universities plus UNSW interviews.',
    startYear: 2026,
    endYear: 2027,
    status: 'active',
    order: 0,
    addedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    phaseId: PHASE_2_ID,
    projectId: PROJECT_ID,
    title: 'Phase 2: PhD (2027-2030)',
    type: 'phd',
    description: 'Disability-Led Co-Production. Lived experience co-research, implementation case studies, framework development.',
    startYear: 2027,
    endYear: 2030,
    status: 'placeholder',
    order: 1,
    addedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    phaseId: PHASE_3_ID,
    projectId: PROJECT_ID,
    title: 'Phase 3: Postdoc / Academic (2030+)',
    type: 'postdoc',
    description: 'Sector Transformation. Publishing the framework. National dissemination.',
    startYear: 2030,
    endYear: null,
    status: 'placeholder',
    order: 2,
    addedAt: '2026-01-15T09:00:00.000Z',
  },
];

export const AARON_STRANDS = [
  {
    strandId: STRAND_1_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    title: 'Strand 1: National Policy and Resource Audit',
    description:
      'Systematic audit of UDL policy documents, resource pages, and staff capability statements ' +
      'across 38 Australian universities (revised from 42 after South Australian institutional mergers).',
    methodology: 'audit',
    status: 'active',
    order: 0,
    addedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    strandId: STRAND_2_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    title: 'Strand 2: UNSW Staff Survey and Cross-institution Interviews',
    description:
      'Online survey of UNSW academic staff regarding UDL awareness and implementation barriers, ' +
      'followed by semi-structured interviews with staff from high-adoption and low-adoption institutions.',
    methodology: 'mixed',
    status: 'active',
    order: 1,
    addedAt: '2026-02-01T09:00:00.000Z',
  },
];

export const AARON_CHAPTERS = [
  {
    chapterId: CH_INTRO_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: null,
    number: 1,
    title: 'Chapter 1: Introduction',
    type: 'introduction',
    status: 'revising',
    wordCountGoal: 3000,
    order: 0,
    addedAt: '2026-01-15T09:00:00.000Z',
    lastEditedAt: '2026-04-10T14:30:00.000Z',
  },
  {
    chapterId: CH_LIT_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: null,
    number: 2,
    title: 'Chapter 2: Literature Review',
    type: 'literature_review',
    status: 'revising',
    wordCountGoal: 6000,
    order: 1,
    addedAt: '2026-01-15T09:00:00.000Z',
    lastEditedAt: '2026-04-28T11:00:00.000Z',
  },
  {
    chapterId: CH_METH_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: null,
    number: 3,
    title: 'Chapter 3: Methodology',
    type: 'methodology',
    status: 'drafting',
    wordCountGoal: 5000,
    order: 2,
    addedAt: '2026-01-15T09:00:00.000Z',
    lastEditedAt: '2026-05-01T10:00:00.000Z',
  },
  {
    chapterId: CH_FIND1_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: STRAND_1_ID,
    number: 4,
    title: 'Chapter 4: Findings - National Audit',
    type: 'findings',
    status: 'drafting',
    wordCountGoal: 8000,
    order: 3,
    addedAt: '2026-03-01T09:00:00.000Z',
    lastEditedAt: '2026-05-12T16:00:00.000Z',
  },
  {
    chapterId: CH_FIND2_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: STRAND_2_ID,
    number: 5,
    title: 'Chapter 5: Findings - Survey and Interviews',
    type: 'findings',
    status: 'drafting',
    wordCountGoal: 8000,
    order: 4,
    addedAt: '2026-03-01T09:00:00.000Z',
    lastEditedAt: '2026-05-14T09:00:00.000Z',
  },
  {
    chapterId: CH_DISC_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: null,
    number: 6,
    title: 'Chapter 6: Discussion',
    type: 'discussion',
    status: 'not_started',
    wordCountGoal: 6000,
    order: 5,
    addedAt: '2026-01-15T09:00:00.000Z',
    lastEditedAt: null,
  },
  {
    chapterId: CH_CONC_ID,
    projectId: PROJECT_ID,
    phaseId: PHASE_1_ID,
    strandId: null,
    number: 7,
    title: 'Chapter 7: Conclusion',
    type: 'conclusion',
    status: 'not_started',
    wordCountGoal: 3000,
    order: 6,
    addedAt: '2026-01-15T09:00:00.000Z',
    lastEditedAt: null,
  },
];

export const AARON_METHODOLOGY_LOG = [
  {
    entryId: 'meth_001',
    projectId: PROJECT_ID,
    type: 'pivot',
    content:
      'South Australian institutional mergers reduced the national university count from 42 to 38. ' +
      'Revised audit scope accordingly. Updated Chapter 3 framing to reflect the revised N and ' +
      'note the structural change in the higher education landscape as a contextual factor.',
    chapterId: CH_METH_ID,
    date: '2026-03-10',
    addedAt: '2026-03-10T11:30:00.000Z',
  },
  {
    entryId: 'meth_002',
    projectId: PROJECT_ID,
    type: 'method_change',
    content:
      'Broadened Strand 2 from UNSW-only survey to include cross-institution semi-structured interviews. ' +
      'Rationale: UNSW survey data alone would not allow comparison between high-adoption and low-adoption ' +
      'contexts. Added purposive sampling of 3 high-adoption and 3 low-adoption universities.',
    chapterId: CH_METH_ID,
    date: '2026-02-15',
    addedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    entryId: 'meth_003',
    projectId: PROJECT_ID,
    type: 'decision',
    content:
      'Chose Braun and Clarke (2006, revised 2021) reflexive thematic analysis for qualitative data. ' +
      'Rejected grounded theory as the study has a defined theoretical framework (UDL 3.0) and is not ' +
      'developing new theory from scratch. Reflexive TA allows positionality to be explicit rather than bracketed.',
    chapterId: CH_METH_ID,
    date: '2026-02-01',
    addedAt: '2026-02-01T14:00:00.000Z',
  },
  {
    entryId: 'meth_004',
    projectId: PROJECT_ID,
    type: 'ethics_amendment',
    content:
      'Initial ethics application covered UNSW staff only. Amendment submitted to expand participant scope ' +
      'to include staff from 6 additional institutions. Amendment approved. New participant information ' +
      'sheet and consent form versions circulated.',
    chapterId: null,
    date: '2026-03-25',
    addedAt: '2026-03-25T10:00:00.000Z',
  },
  {
    entryId: 'meth_005',
    projectId: PROJECT_ID,
    type: 'reflection',
    content:
      'Realised the initial audit framework was too focused on formal policy documents and missed informal ' +
      'implementation signals (staff capability pages, LMS templates, accessibility guides). Expanded the ' +
      'audit instrument to include these sources. This is methodologically significant: policy and practice diverge.',
    chapterId: CH_FIND1_ID,
    date: '2026-04-02',
    addedAt: '2026-04-02T16:00:00.000Z',
  },
];

export const AARON_REFLEXIVITY_LOG = [
  {
    entryId: 'reflex_001',
    projectId: PROJECT_ID,
    type: 'dual_role',
    content:
      'I am both a UNSW staff member and a researcher auditing UNSW. This creates genuine tension: ' +
      'I have access and insider knowledge that aids data collection, but I also have an advocacy investment ' +
      'in the outcome. Strategy: member-checking with a critical friend outside UNSW; separate memos ' +
      'flagging where insider knowledge is shaping interpretation.',
    date: '2026-01-20',
    addedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    entryId: 'reflex_002',
    projectId: PROJECT_ID,
    type: 'lived_experience',
    content:
      'My lived experience of disability and neurodivergence is a methodological asset: I understand the ' +
      'significance of access barriers in a way that a non-disabled researcher would have to learn through data. ' +
      'But it also means I must be vigilant about over-interpreting absence of UDL as intentional exclusion ' +
      'when institutional inertia may be the more accurate explanation.',
    date: '2026-01-22',
    addedAt: '2026-01-22T11:00:00.000Z',
  },
  {
    entryId: 'reflex_003',
    projectId: PROJECT_ID,
    type: 'power_dynamic',
    content:
      'Interview participants are academic staff with institutional power relative to students with disability, ' +
      'but relative to me as researcher they are also potentially exposed (their institution audited, their ' +
      'gaps documented). Addressed in consent form: participation is voluntary, institutions not named in ' +
      'published work without explicit consent, data aggregated at sector level.',
    date: '2026-03-28',
    addedAt: '2026-03-28T14:00:00.000Z',
  },
  {
    entryId: 'reflex_004',
    projectId: PROJECT_ID,
    type: 'positionality',
    content:
      'First-in-family PhD pathway. No generational academic capital. The hidden curriculum of academia ' +
      'is not hidden from me because I am learning it in real time. This makes my research on the hidden ' +
      'curriculum of UDL implementation both more urgent and more personally charged than standard academic work.',
    date: '2026-02-10',
    addedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    entryId: 'reflex_005',
    projectId: PROJECT_ID,
    type: 'tension',
    content:
      'Tension noticed between the Braun and Clarke TA requirement for openness to data and my pre-existing ' +
      'theoretical framework (UDL 3.0). Am I doing reflexive TA or am I doing framework analysis dressed as TA? ' +
      'Decision: be transparent in Chapter 3 that this is a theoretically informed TA and the framework ' +
      'shapes but does not determine the analytic process.',
    date: '2026-04-15',
    addedAt: '2026-04-15T09:00:00.000Z',
  },
];

export const AARON_SUPERVISOR_FEEDBACK = [
  {
    feedbackId: 'sup_001',
    projectId: PROJECT_ID,
    source: 'meeting',
    content:
      'Supervisor (Terry): Chapter 2 literature review is solid but the section on institutional theory ' +
      'needs to engage more critically with its limits. Do not just describe the theory; show how it is ' +
      'insufficient and why UDL 3.0 requires it to be supplemented.',
    status: 'in_progress',
    priority: 'high',
    suggestedChapter: CH_LIT_ID,
    date: '2026-04-28',
    addedAt: '2026-04-28T15:00:00.000Z',
    updatedAt: '2026-05-02T09:00:00.000Z',
  },
  {
    feedbackId: 'sup_002',
    projectId: PROJECT_ID,
    source: 'paste',
    content:
      'The methodology chapter does not adequately justify the choice of 38 universities as the N. ' +
      'You need to explain why this is the full population (not a sample) and what that means for ' +
      'your analysis (census-level data, not inferential statistics).',
    status: 'addressed',
    priority: 'high',
    suggestedChapter: CH_METH_ID,
    date: '2026-05-01',
    addedAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-08T14:00:00.000Z',
  },
  {
    feedbackId: 'sup_003',
    projectId: PROJECT_ID,
    source: 'meeting',
    content:
      'Consider adding a brief section in the Introduction on why Australian universities specifically. ' +
      'The international audience will not understand TEQSA, the Bradley Review legacy, or why 38 is ' +
      'a meaningful census of the entire sector.',
    status: 'unaddressed',
    priority: 'normal',
    suggestedChapter: CH_INTRO_ID,
    date: '2026-05-10',
    addedAt: '2026-05-10T11:00:00.000Z',
    updatedAt: '2026-05-10T11:00:00.000Z',
  },
];

export const AARON_CORPUS_SEEDS = [
  {
    authors: ['Terry Cumming'],
    year: 2024,
    title: 'UDL Adoption Across Australian Universities',
    doi: null,
    type: 'pdf',
    tags: ['UDL', 'Australian HE', 'audit'],
    verified: true,
  },
  {
    authors: ['Rose Thorpe'],
    year: 2025,
    title: 'Disability Disclosure in Higher Education: Institutional Barriers and Enablers',
    doi: null,
    type: 'pdf',
    tags: ['disability', 'disclosure', 'HE'],
    verified: true,
  },
  {
    authors: ['ADCET'],
    year: 2022,
    title: 'Universal Design for Learning in Australian Higher Education',
    doi: null,
    type: 'url',
    tags: ['UDL', 'ADCET', 'resource'],
    verified: true,
  },
  {
    authors: ['CAST'],
    year: 2024,
    title: 'Universal Design for Learning Guidelines 3.0',
    doi: null,
    type: 'url',
    tags: ['UDL 3.0', 'framework'],
    verified: true,
  },
  {
    authors: ['Virginia Braun', 'Victoria Clarke'],
    year: 2021,
    title: 'Thematic Analysis: A Practical Guide',
    doi: '10.4135/9781529095562',
    type: 'pdf',
    tags: ['methodology', 'TA', 'qualitative'],
    verified: true,
  },
  {
    authors: ['Aimi Hamraie'],
    year: 2019,
    title: 'Building Access: Universal Design and the Politics of Disability',
    doi: null,
    type: 'pdf',
    tags: ['disability studies', 'UD', 'politics'],
    verified: false,
  },
  {
    authors: ['Alison Hamilton'],
    year: 2023,
    title: 'Reflexive Positionality in Disability Research: A Practitioner Guide',
    doi: null,
    type: 'pdf',
    tags: ['reflexivity', 'methodology', 'disability'],
    verified: false,
  },
];

export const AARON_PROJECT_ID = PROJECT_ID;
export const AARON_ACTIVE_CHAPTER_ID = CH_FIND2_ID;
