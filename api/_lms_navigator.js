/**
 * lms_navigator.js
 *
 * LMS navigation knowledge base for AURA Institutional Navigator mode.
 * Contains step-by-step guidance for the major Australian LMS platforms.
 * Imported by the AURA API route when navigator mode activates.
 */

export const LMS_NAVIGATION = {
  moodle: {
    name: 'Moodle',
    find_assignment: 'Go to your course page. Click "Activities" in the left navigation, then "Assignments". If Activities is not visible, click the hamburger menu (three lines) in the top-left corner.',
    submit_work: 'Open the assignment link. Scroll to "Submission status". Click "Add submission". Drag your file into the upload area or click "Add file". Click "Save changes". Then click "Submit assignment" to finalise.',
    find_grades: 'Click "Grades" in the left navigation panel. Or go to your profile and click "Grade Reports".',
    find_rubric: 'Open the assignment. Look for "Grading criteria" or "Rubric" below the assignment description. Some lecturers attach it as a PDF instead.',
    contact_support: 'Look for "Help" or "IT Support" in the top-right menu. Or search your institution website for "IT Service Desk".',
  },
  canvas: {
    name: 'Canvas',
    find_assignment: 'Click "Assignments" in the left course navigation. Or click "Syllabus" to see all assessments with due dates. If the navigation is hidden, click the hamburger menu.',
    submit_work: 'Click the assignment title. Click "Submit Assignment". Choose "File Upload". Select your file. CRITICAL: Click "Submit Assignment" (the button at the bottom). If you only upload without clicking submit, it is NOT submitted.',
    find_grades: 'Click "Grades" in the left navigation. You will see a list of all assessments with scores.',
    find_rubric: 'Open the assignment. Look for "View Rubric" button on the right side. Or check the assignment description for an attached PDF.',
    contact_support: 'Click "Help" in the left navigation (bottom). Or search for your institution\'s "Canvas Support" page.',
  },
  blackboard: {
    name: 'Blackboard / Blackboard Ultra',
    find_assignment: 'Go to your course. Click "Course Content" or "Assessments" in the top menu. Assignments may be inside weekly folders.',
    submit_work: 'Click the assignment. Click "Write Submission" or "Attach Files". Upload your file. Click "Submit". Look for the green confirmation banner.',
    find_grades: 'Click "My Grades" in the left panel. Or look for "Gradebook" in the course menu.',
    find_rubric: 'Open the assignment details. Look for "Grading Rubric" link below the description.',
    contact_support: 'Click "Institution Page" in the top menu. Look for "Help Desk" or "Student Support".',
  },
  brightspace: {
    name: 'Brightspace (D2L)',
    find_assignment: 'Go to your course. Click "Activities" then "Assignments" in the navigation bar. Or check the "Calendar" for due dates.',
    submit_work: 'Click the assignment title. Click "Add a File" or drag your file into the submission area. Click "Submit". Wait for the confirmation message.',
    find_grades: 'Click "Progress" in the navigation bar, then "Grades".',
    find_rubric: 'Open the assignment. Look for "View Rubric" button or check "Assessment" tab.',
    contact_support: 'Look for "Help" in the top-right dropdown menu.',
  },
  google_classroom: {
    name: 'Google Classroom',
    find_assignment: 'Open your class. Click "Classwork" tab at the top. Assignments are listed by topic or date.',
    submit_work: 'Click the assignment. Click "Your work" on the right. Click "Add or create". Upload your file. Click "Turn in". CRITICAL: You must click "Turn in" (not just attach).',
    find_grades: 'Click the assignment, then "Your work". Your grade appears after marking.',
    find_rubric: 'Check the assignment description. Or ask your teacher if a rubric is available.',
    contact_support: 'Contact your teacher directly via the class stream or email.',
  },
};

/**
 * Extension request scaffold questions and template.
 */
export const EXTENSION_SCAFFOLD = {
  questions: [
    { id: 'reason', prompt: 'What is stopping you from submitting on time?', type: 'text' },
    { id: 'time_needed', prompt: 'How much extra time do you need?', options: ['1 day', '3 days', '1 week', 'More than a week'] },
    { id: 'documentation', prompt: 'Do you have any supporting documentation?', options: ['Medical certificate', 'Counsellor letter', 'None yet', 'Other'] },
  ],
  generateDraft: ({ reason, timeNeeded, documentation, assessmentTitle, unitCode, dueDate, learnerName }) => {
    return `Subject: Extension Request: ${unitCode || '[UNIT CODE]'} ${assessmentTitle || '[ASSESSMENT]'}

Dear [Lecturer/Unit Coordinator name],

I am writing to request an extension for ${assessmentTitle || '[assessment title]'} in ${unitCode || '[unit code]'}, currently due on ${dueDate || '[due date]'}.

${reason || '[Your reason: one sentence, factual, not elaborate]'}

I am requesting an extension of ${timeNeeded || '[time needed]'}.${documentation && documentation !== 'None yet' ? ` I can provide a ${documentation.toLowerCase()} as supporting documentation.` : ''}

I am happy to discuss this further if needed.

Kind regards,
${learnerName || '[Your name]'}
[Student ID]`;
  },
};

/**
 * Institutional referral templates.
 */
export const REFERRALS = {
  disability_support: 'Your institution\'s disability or accessibility service can arrange formal adjustments (extra exam time, alternative formats, deadline flexibility). In Australia, most universities call this Student Accessibility Services or Inclusion Services. Search "[your institution name] disability support" to find their page. You are accessing a legal entitlement under the Disability Standards for Education 2005.',
  academic_integrity: 'Your institution has an academic integrity policy that covers AI use. Policies vary between institutions and between courses. Search "[your institution name] academic integrity policy" to read the specific rules. If unsure, ask your unit coordinator directly: "What is your policy on AI-assisted work for this assessment?"',
  student_services: 'Most Australian institutions have free, confidential student support services: counselling, financial hardship, academic skills. Search "[your institution name] student support" or visit your Student Centre.',
  it_helpdesk: 'For login issues, LMS access problems, or technical errors during submission: contact your institution\'s IT Help Desk. Most have 24/7 chat or phone support during assessment periods. Search "[your institution name] IT help desk".',
};

/**
 * Detect which LMS the learner is likely using from their message.
 * @param {string} message
 * @returns {string|null} LMS key or null
 */
export function detectLMS(message) {
  if (!message) return null;
  const lower = message.toLowerCase();
  if (/moodle/i.test(lower)) return 'moodle';
  if (/canvas/i.test(lower)) return 'canvas';
  if (/blackboard|bb ultra/i.test(lower)) return 'blackboard';
  if (/brightspace|d2l/i.test(lower)) return 'brightspace';
  if (/google classroom/i.test(lower)) return 'google_classroom';
  // Common Australian uni LMS aliases
  if (/wattle/i.test(lower)) return 'moodle'; // ANU
  if (/ilearn/i.test(lower)) return 'moodle'; // Macquarie
  if (/vula|vlearn/i.test(lower)) return 'moodle';
  if (/myuni/i.test(lower)) return 'canvas'; // Adelaide
  if (/lms\.unsw/i.test(lower)) return 'moodle'; // UNSW Moodle
  return null;
}
