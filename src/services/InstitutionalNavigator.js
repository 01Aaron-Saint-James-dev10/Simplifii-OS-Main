/**
 * InstitutionalNavigator.js
 *
 * Provides AURA with institutional navigation knowledge.
 * Templates for extension requests, LMS guidance, disability service
 * registration, and email scaffolds for lecturers.
 *
 * Generic Australian education system knowledge. Not institution-specific.
 * The learner fills in their institution's details.
 */

const EXTENSION_TEMPLATE = `Subject: Extension Request: [UNIT CODE] [ASSESSMENT TITLE]

Dear [LECTURER NAME / UNIT COORDINATOR],

I am writing to request an extension for [ASSESSMENT TITLE] in [UNIT CODE], currently due on [DUE DATE].

[CHOOSE ONE REASON:]
- I have been experiencing health issues that have affected my ability to complete the work on time.
- I have had unexpected personal circumstances that have impacted my study schedule.
- I am registered with the disability/accessibility service and require additional time as part of my adjustments.

I am requesting an extension of [NUMBER] days, which would make my new submission date [NEW DATE].

I have completed approximately [PERCENTAGE]% of the assessment and am confident I can submit high-quality work with this additional time.

I am happy to provide supporting documentation if required.

Thank you for your consideration.

Kind regards,
[YOUR NAME]
[STUDENT ID]`;

const SPECIAL_CONSIDERATION_TEMPLATE = `Subject: Special Consideration Application: [UNIT CODE]

Dear Student Services / Special Consideration Office,

I am writing to apply for special consideration for [ASSESSMENT TITLE] in [UNIT CODE].

My circumstances: [BRIEF DESCRIPTION]

Impact on my studies: [HOW IT AFFECTED YOUR ABILITY TO COMPLETE WORK]

Supporting documentation: [LIST WHAT YOU CAN PROVIDE: medical certificate, counsellor letter, statutory declaration]

I am requesting: [EXTENSION / DEFERRED EXAM / SUPPLEMENTARY ASSESSMENT / OTHER]

Student details:
- Name: [YOUR NAME]
- Student ID: [ID]
- Unit: [UNIT CODE]
- Assessment: [ASSESSMENT TITLE]

Kind regards,
[YOUR NAME]`;

const DISABILITY_REGISTRATION_GUIDE = `How to register with your institution's disability or accessibility service:

1. Find the office: Search your institution's website for "disability service", "accessibility service", or "equity and diversity". Most Australian universities have a dedicated office.

2. What you need: A letter or report from your treating professional (GP, psychologist, psychiatrist, occupational therapist). It should name the condition and describe how it affects your study.

3. What happens: You will meet with an adviser who creates an Academic Adjustment Plan (AAP) or Reasonable Adjustment Plan. This is confidential. Your lecturers see the adjustments (extra time, alternative formats) but NOT the diagnosis.

4. Common adjustments: Extra exam time (usually 10-15 min per hour), separate exam room, extensions without penalty, lecture recordings, assistive technology, note-taking support.

5. Timeline: Register as early as possible. Most services need 2-4 weeks to process. Mid-semester registrations are possible but adjustments may not apply retroactively.

6. Your rights: Under the Disability Discrimination Act 1992 and the Disability Standards for Education 2005, Australian institutions must provide reasonable adjustments. You are not asking for a favour. You are accessing a legal entitlement.`;

const LMS_SUBMISSION_GUIDE = `Common submission steps across Australian LMS platforms:

TURNITIN (via Canvas, Moodle, or Blackboard):
1. Navigate to the assessment in your unit.
2. Click "Submit Assignment" or the Turnitin submission link.
3. Upload your file (PDF or DOCX, check the brief for format requirements).
4. Wait for the upload to process. You will see a digital receipt.
5. CRITICAL: Download your digital receipt. Screenshot it. This is your proof of submission.
6. Check the similarity report 24 hours later. Under 15% is typically fine.

CANVAS:
1. Go to Assignments in your unit.
2. Click the assessment title.
3. Click "Submit Assignment".
4. Choose "File Upload" and select your file.
5. Click "Submit Assignment" (you must click this, not just upload).
6. You will see a confirmation message and a submission ID.

MOODLE:
1. Go to the assessment link in your unit.
2. Click "Add submission".
3. Drag your file into the upload area or click to browse.
4. Click "Save changes".
5. Then click "Submit assignment" to finalise (if required).

GOOGLE CLASSROOM:
1. Go to the assignment in your class.
2. Click "Your work".
3. Click "Add or create" and upload your file.
4. Click "Turn in".

ALWAYS: Check file size limits (usually 20-40MB). Check accepted formats. Submit at least 2 hours before the deadline to allow for technical issues.`;

const LECTURER_EMAIL_TEMPLATES = {
  askForClarification: `Subject: Clarification: [ASSESSMENT TITLE] in [UNIT CODE]

Dear [LECTURER NAME],

I am working on [ASSESSMENT TITLE] and I have a question about [SPECIFIC PART OF THE BRIEF].

The brief says: "[QUOTE THE EXACT WORDING]"

My understanding is: [WHAT YOU THINK IT MEANS]

Could you confirm whether this interpretation is correct, or if I should approach it differently?

Thank you,
[YOUR NAME] ([STUDENT ID])`,

  askForFeedback: `Subject: Request for feedback on draft: [ASSESSMENT TITLE]

Dear [LECTURER NAME],

Would it be possible to get brief feedback on a draft of [ASSESSMENT TITLE]? I have attached [SECTION / INTRODUCTION / OUTLINE] and would appreciate any guidance on whether I am on the right track.

Specifically, I am unsure about: [ONE SPECIFIC THING]

I understand you may not have time for detailed feedback, and even a brief comment would help.

Thank you,
[YOUR NAME] ([STUDENT ID])`,

  reportTechnicalIssue: `Subject: Technical issue with [LMS NAME] submission: [UNIT CODE]

Dear [LECTURER NAME / IT HELPDESK],

I am experiencing a technical issue submitting [ASSESSMENT TITLE] in [UNIT CODE].

The issue: [DESCRIBE WHAT HAPPENED]
When it occurred: [DATE AND TIME]
Browser: [CHROME / SAFARI / FIREFOX]
Error message (if any): [PASTE THE ERROR]

I have attached a screenshot of the error. My work is complete and ready to submit.

Could you advise on how to proceed? I want to ensure my submission is not marked as late due to this technical issue.

Thank you,
[YOUR NAME] ([STUDENT ID])`
};

/**
 * Build institutional navigation context for AURA's system prompt.
 * This gives AURA the knowledge to help learners navigate institutional barriers.
 *
 * @param {string} context - what the learner needs help with
 * @returns {string} relevant navigation knowledge
 */
export function getInstitutionalGuidance(context) {
  if (!context) return '';
  const lower = context.toLowerCase();

  if (lower.includes('extension') || lower.includes('late') || lower.includes('deadline')) {
    return `INSTITUTIONAL KNOWLEDGE (extension requests):\n${EXTENSION_TEMPLATE}\n\nProvide this template to the learner and help them fill in the brackets. Do not send the email for them.`;
  }
  if (lower.includes('special consideration') || lower.includes('medical') || lower.includes('circumstances')) {
    return `INSTITUTIONAL KNOWLEDGE (special consideration):\n${SPECIAL_CONSIDERATION_TEMPLATE}\n\nHelp the learner complete the template. Remind them to gather supporting documentation.`;
  }
  if (lower.includes('disability') || lower.includes('accessibility') || lower.includes('adjustment') || lower.includes('adhd') || lower.includes('dyslexia') || lower.includes('autism')) {
    return `INSTITUTIONAL KNOWLEDGE (disability services):\n${DISABILITY_REGISTRATION_GUIDE}\n\nSurface the relevant steps. Do not diagnose. Do not assume they are not already registered.`;
  }
  if (lower.includes('submit') || lower.includes('turnitin') || lower.includes('upload') || lower.includes('lms') || lower.includes('canvas') || lower.includes('moodle') || lower.includes('blackboard')) {
    return `INSTITUTIONAL KNOWLEDGE (LMS submission):\n${LMS_SUBMISSION_GUIDE}\n\nSurface the relevant platform steps. Ask which LMS they use if not specified.`;
  }
  if (lower.includes('email') || lower.includes('lecturer') || lower.includes('teacher') || lower.includes('clarif')) {
    const templates = Object.values(LECTURER_EMAIL_TEMPLATES).join('\n\n---\n\n');
    return `INSTITUTIONAL KNOWLEDGE (email templates):\n${templates}\n\nHelp the learner choose and fill in the right template. Do not send the email for them.`;
  }
  return '';
}

/**
 * Detect institutional barrier signals in learner messages.
 * @param {string} message
 * @returns {string|null} barrier type or null
 */
export function detectInstitutionalBarrier(message) {
  if (!message) return null;
  const lower = message.toLowerCase();
  const signals = [
    { pattern: /extension|late|deadline|overdue|penalty/i, type: 'extension' },
    { pattern: /special consideration|medical|sick|hospital/i, type: 'special_consideration' },
    { pattern: /disability|accessibility|adjustment|accommodat/i, type: 'disability_services' },
    { pattern: /submit|upload|turnitin|lms|canvas|moodle|blackboard/i, type: 'lms_submission' },
    { pattern: /email.*lecturer|email.*teacher|how do i ask|contact.*marker/i, type: 'email_template' },
    { pattern: /don't understand.*brief|what does.*mean|confused.*rubric/i, type: 'brief_clarification' },
    { pattern: /failed|got.*bad.*mark|disappointing.*grade/i, type: 'grade_recovery' },
  ];
  for (const s of signals) {
    if (s.pattern.test(lower)) return s.type;
  }
  return null;
}
