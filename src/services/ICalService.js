/**
 * ICalService
 *
 * Generates .ics calendar files from Simplifii course data.
 * Each assessment with a parseable due date becomes a VEVENT.
 */

/**
 * Try to parse a due date string into a Date object.
 * Handles ISO dates, "Friday Week 5" (relative), and common formats.
 * Returns null if unparseable.
 */
function parseDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Format a Date as iCal VALUE=DATE (YYYYMMDD).
 */
function formatICalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generate a .ics file string from the courses object.
 * @param {Object} courses - keyed by courseId, each with { name, assessmentBriefs }
 * @returns {string} iCal file content
 */
export function generateICalFromCourses(courses) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Simplifii-OS//Assessment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Simplifii Assessments',
  ];

  const now = new Date();
  const stamp = formatICalDate(now) + 'T' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + '00Z';

  Object.entries(courses || {}).forEach(([courseId, course]) => {
    const briefs = course.assessmentBriefs || [];
    briefs.forEach((brief, i) => {
      const date = parseDueDate(brief.dueDate);
      if (!date) return;

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const uid = `${courseId}-${i}-${formatICalDate(date)}@simplifii`;
      const summary = (brief.title || 'Assessment').replace(/[,;\\]/g, ' ');
      const description = [
        course.name || '',
        brief.weight ? `Weight: ${brief.weight}` : '',
        brief.wordCountGoal ? `Word count: ${brief.wordCountGoal}` : '',
      ].filter(Boolean).join(' | ').replace(/[,;\\]/g, ' ');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART;VALUE=DATE:${formatICalDate(date)}`);
      lines.push(`DTEND;VALUE=DATE:${formatICalDate(nextDay)}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of the .ics file.
 */
export function downloadICal(courses) {
  const content = generateICalFromCourses(courses);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simplifii-schedule.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
