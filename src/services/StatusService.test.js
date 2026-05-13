import { getTaskStatus } from './StatusService';

// Fixed reference: Wednesday 14 May 2026 at noon AEST.
// All tests pin "now" so they never drift.
const NOW = new Date('2026-05-14T02:00:00.000Z'); // 12:00 AEST

describe('getTaskStatus', () => {
  // -------------------------------------------------------
  // Overdue
  // -------------------------------------------------------
  test('yesterday returns overdue / red / triangle', () => {
    // May 13 00:00Z to May 14 02:00Z = floor(-1.08 days) = -2 daysToDue
    const status = getTaskStatus('2026-05-13T00:00:00.000Z', NOW);
    expect(status.state).toBe('overdue');
    expect(status.pill).toBe('red');
    expect(status.glyph).toBe('triangle');
    expect(status.label).toBe('Overdue');
    expect(status.daysOverdue).toBe(2);
    expect(status.urgency).toBe('critical');
    expect(status.countdownText).toBe('2 days late');
  });

  // -------------------------------------------------------
  // Due this week: today (urgent)
  // -------------------------------------------------------
  test('today returns due-this-week / amber / ring / Due today', () => {
    const status = getTaskStatus('2026-05-14T23:59:00.000Z', NOW);
    expect(status.state).toBe('due-this-week');
    expect(status.pill).toBe('amber');
    expect(status.glyph).toBe('ring');
    expect(status.urgency).toBe('urgent');
    expect(status.countdownText).toBe('Due today');
  });

  // -------------------------------------------------------
  // Due this week: tomorrow (urgent)
  // -------------------------------------------------------
  test('tomorrow returns due-this-week / urgent / Due tomorrow', () => {
    const status = getTaskStatus('2026-05-15T23:59:00.000Z', NOW);
    expect(status.state).toBe('due-this-week');
    expect(status.urgency).toBe('urgent');
    expect(status.countdownText).toBe('Due tomorrow');
  });

  // -------------------------------------------------------
  // Due this week: +3 days (soon)
  // -------------------------------------------------------
  test('+3 days returns due-this-week / soon / in 3 days', () => {
    const status = getTaskStatus('2026-05-17T12:00:00.000Z', NOW);
    expect(status.state).toBe('due-this-week');
    expect(status.urgency).toBe('soon');
    expect(status.countdownText).toBe('in 3 days');
  });

  // -------------------------------------------------------
  // Due this week: +7 days (this-week)
  // -------------------------------------------------------
  test('+7 days returns due-this-week / this-week / in 7 days', () => {
    const status = getTaskStatus('2026-05-21T12:00:00.000Z', NOW);
    expect(status.state).toBe('due-this-week');
    expect(status.urgency).toBe('this-week');
    expect(status.countdownText).toBe('in 7 days');
  });

  // -------------------------------------------------------
  // On track: +15 days (plenty)
  // -------------------------------------------------------
  test('+15 days returns on-track / green / dot / plenty', () => {
    const status = getTaskStatus('2026-05-29T12:00:00.000Z', NOW);
    expect(status.state).toBe('on-track');
    expect(status.pill).toBe('green');
    expect(status.glyph).toBe('dot');
    expect(status.label).toBe('On track');
    expect(status.urgency).toBe('plenty');
    expect(status.countdownText).toBe('in 15 days');
  });

  // -------------------------------------------------------
  // On track: +10 days (comfortable)
  // -------------------------------------------------------
  test('+10 days returns on-track / comfortable', () => {
    const status = getTaskStatus('2026-05-24T12:00:00.000Z', NOW);
    expect(status.state).toBe('on-track');
    expect(status.urgency).toBe('comfortable');
    expect(status.countdownText).toBe('in 10 days');
  });

  // -------------------------------------------------------
  // Edge: multi-day overdue uses plural
  // -------------------------------------------------------
  test('multi-day overdue returns plural "days late"', () => {
    // May 11 00:00Z to May 14 02:00Z = floor(-3.08 days) = -4 daysToDue
    const status = getTaskStatus('2026-05-11T00:00:00.000Z', NOW);
    expect(status.daysOverdue).toBe(4);
    expect(status.countdownText).toBe('4 days late');
  });

  // -------------------------------------------------------
  // Shape: return object always has required fields
  // -------------------------------------------------------
  test('return object shape includes all required fields', () => {
    const status = getTaskStatus('2026-06-01T00:00:00.000Z', NOW);
    expect(status).toHaveProperty('state');
    expect(status).toHaveProperty('pill');
    expect(status).toHaveProperty('glyph');
    expect(status).toHaveProperty('label');
    expect(status).toHaveProperty('daysToDue');
    expect(status).toHaveProperty('urgency');
    expect(status).toHaveProperty('countdownText');
  });
});
