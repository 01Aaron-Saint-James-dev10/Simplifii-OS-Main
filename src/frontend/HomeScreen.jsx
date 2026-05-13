import React, { useMemo } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { useRouter } from '../contexts/RouterContext';
import { getTaskStatus } from '../services/StatusService';
import TimelineStrip from './components/TimelineStrip';
import UpNextCard from './components/UpNextCard';
import CourseCard from './components/CourseCard';
import DecisionButton from './components/DecisionButton';
import BodyDoublingLine from './components/BodyDoublingLine';
import TalkToSomeoneLink from './components/TalkToSomeoneLink';
import AddCourseButton from './components/AddCourseButton';
import './HomeScreen.css';

/**
 * HomeScreen (Screen 3)
 *
 * Orchestrator for the course list home view.
 * Layout order per spec Section 2.2:
 *   1. Top nav (logo + Add course + Settings + TalkToSomeoneLink)
 *   2. 7-day timeline strip (toggleable)
 *   3. Up Next hero card (toggleable)
 *   4. Decision row
 *   5. Body doubling line (toggleable)
 *   6. Course grid
 *
 * Reads display preferences from SettingsContext.
 * Reads courses from ProjectContext.
 * Sorts courses by earliest next-due date ascending.
 */

function findEarliestDue(course, now) {
  const briefs = course.extractionData?.assessmentBriefs || [];
  let earliest = Infinity;
  for (const brief of briefs) {
    if (!brief.dueDate) continue;
    const due = new Date(brief.dueDate);
    if (isNaN(due.getTime())) continue;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToDue = Math.floor((due - now) / msPerDay);
    if (daysToDue < earliest) earliest = daysToDue;
  }
  return earliest;
}

function countByState(courses, now) {
  let overdue = 0;
  let thisWeek = 0;
  for (const course of Object.values(courses || {})) {
    const briefs = course.extractionData?.assessmentBriefs || [];
    for (const brief of briefs) {
      if (!brief.dueDate) continue;
      const status = getTaskStatus(brief.dueDate, now);
      if (status.state === 'overdue') overdue++;
      else if (status.state === 'due-this-week') thisWeek++;
    }
  }
  return { overdue, thisWeek };
}

function matchesTerm(course, term) {
  if (!term) return true;
  const ct = course.term || course.extractionData?.term;
  if (!ct) return false;
  return ct.year === term.year && (term.code === null || ct.code === term.code);
}

export default function HomeScreen() {
  const { courses, terms, activeTerm, setActiveTerm } = useProject();
  const { display, reducedMotion } = useSettings();
  const { navigateToCanvas } = useRouter();
  const now = useMemo(() => new Date(), []);

  const allEntries = Object.entries(courses || {});
  const isEmpty = allEntries.length === 0;

  // Filter by active term
  const courseEntries = useMemo(() => {
    if (!activeTerm) return allEntries;
    return allEntries.filter(([, c]) => matchesTerm(c, activeTerm));
  }, [allEntries, activeTerm]);

  const filteredOut = allEntries.length - courseEntries.length;

  // Sort courses by earliest next-due date ascending (most urgent first)
  const sortedCourses = useMemo(() => {
    return [...courseEntries].sort((a, b) => {
      const aDays = findEarliestDue(a[1], now);
      const bDays = findEarliestDue(b[1], now);
      return aDays - bDays;
    });
  }, [courseEntries, now]);

  const courseCount = courseEntries.length;
  const { overdue: overdueCount, thisWeek: thisWeekCount } = useMemo(() => countByState(courses, now), [courses, now]);

  const activeTermLabel = activeTerm
    ? terms.find(t => t.year === activeTerm.year && t.code === activeTerm.code)?.label || `${activeTerm.code || ''} ${activeTerm.year}`.trim()
    : null;

  return (
    <div className={`home-root ${reducedMotion ? 'home-no-motion' : ''}`}>
      {/* Top nav */}
      <nav className="home-nav" role="navigation" aria-label="Home navigation">
        <div className="home-nav-brand">
          <span className="home-nav-logo">S</span>
          <span className="home-nav-title">Simplifii</span>
        </div>
        <div className="home-nav-actions">
          <AddCourseButton />
          {display.overdueTally && overdueCount > 0 && (
            <span className="home-overdue-badge" aria-label={`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`}>
              {overdueCount}
            </span>
          )}
          <TalkToSomeoneLink />
        </div>
      </nav>

      <main className="home-main">
        {/* Empty state */}
        {isEmpty && (
          <div className="home-empty">
            <h1 className="home-empty-title">No courses yet</h1>
            <p className="home-empty-sub">
              Upload a syllabus PDF to get started. We will extract your assessments, due dates, and rubric criteria automatically.
            </p>
          </div>
        )}

        {/* Populated state */}
        {!isEmpty && (
          <>
            {/* Timeline strip */}
            {display.timeline && (
              <section className="home-section" aria-label="Timeline">
                <div className="home-week-header">
                  <div className="home-week-title-row">
                    <h2 className="home-week-title">Your week</h2>
                    {activeTermLabel && (
                      <span className="home-term-label">{activeTermLabel}</span>
                    )}
                    {terms.length > 1 && (
                      <div className="home-term-switcher" role="group" aria-label="Term filter">
                        <button
                          type="button"
                          className={`home-term-pill ${!activeTerm ? 'home-term-pill-active' : ''}`}
                          onClick={() => setActiveTerm(null)}
                        >
                          All
                        </button>
                        {terms.map(t => {
                          const isActive = activeTerm && activeTerm.year === t.year && activeTerm.code === t.code;
                          return (
                            <button
                              type="button"
                              key={`${t.year}-${t.code}`}
                              className={`home-term-pill ${isActive ? 'home-term-pill-active' : ''}`}
                              onClick={() => setActiveTerm({ year: t.year, code: t.code })}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="home-week-counters">
                    {overdueCount > 0 && (
                      <span className="home-counter home-counter-red">{overdueCount} overdue</span>
                    )}
                    {thisWeekCount > 0 && (
                      <span className="home-counter home-counter-amber">{thisWeekCount} this week</span>
                    )}
                    <span className="home-counter home-counter-muted">{courseCount} course{courseCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <TimelineStrip courses={courses} now={now} />
              </section>
            )}

            {/* Up Next card */}
            {display.upNext && (
              <section className="home-section" aria-label="Up next">
                <UpNextCard
                  courses={courses}
                  now={now}
                  onOpenCanvas={(cId, title) => navigateToCanvas(cId, title)}
                />
              </section>
            )}

            {/* Decision row */}
            <section className="home-section" aria-label="Decision helper">
              <DecisionButton
                onDecide={() => {
                  // TODO: pick most urgent task, navigate to Screen 4 with 15-min timer
                  console.info('[HomeScreen] Decision externalisation triggered');
                }}
              />
            </section>

            {/* Body doubling line */}
            {display.bodyDoubling && (
              <section className="home-section" aria-label="Body doubling">
                <BodyDoublingLine />
              </section>
            )}

            {/* Course grid */}
            <section className="home-section" aria-label="Your courses">
              <div className="home-grid-header">
                <h2 className="home-section-label">Your courses</h2>
                <span className="home-sort-label">Sorted by earliest next-due</span>
              </div>
              <div className={`home-grid ${display.cardDensity === 'compact' ? 'home-grid-compact' : ''}`}>
                {sortedCourses.map(([id, course]) => (
                  <CourseCard
                    key={id}
                    courseId={id}
                    course={course}
                    density={display.cardDensity}
                    now={now}
                    onOpen={(cId) => navigateToCanvas(cId, null)}
                  />
                ))}
              </div>
              {filteredOut > 0 && (
                <button
                  type="button"
                  className="home-view-all"
                  onClick={() => setActiveTerm(null)}
                >
                  View all courses ({filteredOut} hidden by term filter)
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
