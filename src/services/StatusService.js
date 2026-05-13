/**
 * StatusService.js
 *
 * Pure function deriving task status from a due date.
 * Spec: docs/PRODUCT_SPEC_STATUS_AND_PREFERENCES.md Section 1.2
 *
 * Returns a status object consumed by StatusPill and every surface
 * that shows task urgency. Zero side effects. Unit-testable.
 */

/**
 * Derive the three-state pill status for a task.
 *
 * @param {string|Date} dueDate  - task due date (ISO string or Date)
 * @param {Date}        [now]    - reference time (defaults to user's local clock)
 * @returns {{
 *   state: 'overdue'|'due-this-week'|'on-track',
 *   pill: 'red'|'amber'|'green',
 *   glyph: 'triangle'|'ring'|'dot',
 *   label: string,
 *   daysToDue: number,
 *   daysOverdue?: number,
 *   urgency: 'critical'|'urgent'|'soon'|'this-week'|'comfortable'|'plenty',
 *   countdownText: string
 * }}
 */
export function getTaskStatus(dueDate, now = new Date()) {
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToDue = Math.floor((due - now) / msPerDay);

  if (daysToDue < 0) {
    return {
      state: 'overdue',
      pill: 'red',
      glyph: 'triangle',
      label: 'Overdue',
      daysToDue,
      daysOverdue: Math.abs(daysToDue),
      urgency: 'critical',
      countdownText: `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? '' : 's'} late`
    };
  }

  if (daysToDue <= 7) {
    let urgency;
    if (daysToDue <= 1) urgency = 'urgent';
    else if (daysToDue <= 3) urgency = 'soon';
    else urgency = 'this-week';

    return {
      state: 'due-this-week',
      pill: 'amber',
      glyph: 'ring',
      label: 'Due this week',
      daysToDue,
      urgency,
      countdownText: daysToDue === 0 ? 'Due today' : daysToDue === 1 ? 'Due tomorrow' : `in ${daysToDue} days`
    };
  }

  let urgency;
  if (daysToDue >= 15) urgency = 'plenty';
  else urgency = 'comfortable';

  return {
    state: 'on-track',
    pill: 'green',
    glyph: 'dot',
    label: 'On track',
    daysToDue,
    urgency,
    countdownText: `in ${daysToDue} days`
  };
}
