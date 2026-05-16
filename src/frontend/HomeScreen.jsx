import React, { useMemo, useState, useEffect } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../contexts/RouterContext';
import { hydrate } from '../core/SovereignRouter';
import { getTaskStatus } from '../services/StatusService';
import { supabase } from '../lib/supabaseClient';
import TimelineStrip from './components/TimelineStrip';
import UpNextCard from './components/UpNextCard';
import CourseCard from './components/CourseCard';
import DecisionButton from './components/DecisionButton';
import BodyDoublingLine from './components/BodyDoublingLine';
import TalkToSomeoneLink from './components/TalkToSomeoneLink';
import AddCourseButton from './components/AddCourseButton';
import LogoutButton from './auth/LogoutButton';
import EmptyWorkspace from './workspace/EmptyWorkspace';
import TesterWelcomeModal from './components/TesterWelcomeModal';
import DocumentClassifiedModal from './components/DocumentClassifiedModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import { useRealtimeClock } from './hooks/useRealtimeClock';
import AffirmationBanner from './components/AffirmationBanner';
import { ACCENT_BORDER, ACCENT_PULSE, TEXT_MUTED, FONT_DISPLAY } from '../theme/tokens';
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
  let nearestFuture = Infinity;
  let leastOverdue = -Infinity;
  for (const brief of briefs) {
    if (!brief.dueDate) continue;
    const due = new Date(brief.dueDate);
    if (isNaN(due.getTime())) continue;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToDue = Math.floor((due - now) / msPerDay);
    if (daysToDue >= 0 && daysToDue < nearestFuture) nearestFuture = daysToDue;
    else if (daysToDue < 0 && daysToDue > leastOverdue) leastOverdue = daysToDue;
  }
  // Prefer upcoming dates; fall back to overdue if nothing is upcoming
  return nearestFuture < Infinity ? nearestFuture : (leastOverdue > -Infinity ? leastOverdue : Infinity);
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

const AARON_EMAIL = 'aaronbugge@gmail.com';

export default function HomeScreen() {
  const { courses, terms, activeTerm, setActiveTerm, addCourseWithData, upgradeCourseExtraction } = useProject();
  const { display, reducedMotion, activeTier } = useSettings();
  const { user } = useAuth();
  const { navigateToCanvas, navigateToAssessments, navigateToResearch } = useRouter();
  const [profileTier, setProfileTier] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [showTesterWelcome, setShowTesterWelcome] = useState(false);
  const [classifiedDoc, setClassifiedDoc] = useState(null);
  const isAaron = user?.email === AARON_EMAIL;

  // Listen for document classification events from useIngestion
  useEffect(() => {
    const handler = (e) => setClassifiedDoc(e.detail);
    window.addEventListener('simplifii:document-classified', handler);
    return () => window.removeEventListener('simplifii:document-classified', handler);
  }, []);
  const clock = useRealtimeClock();

  const isFirstSession = !sessionStorage.getItem('simplifii_greeted');

  useEffect(() => {
    if (!user || isAaron) return;
    supabase.from('profiles').select('tier, display_name, has_seen_tester_welcome').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.tier) setProfileTier(data.tier);
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.tier === 'secondary' && !data?.has_seen_tester_welcome) {
          setShowTesterWelcome(true);
        }
        sessionStorage.setItem('simplifii_greeted', 'true');
      })
      .catch(() => { /* profile load failed, non-blocking */ });
  }, [user, isAaron]);
  // Pass activeTier into the existing stream system so SovereignRouter
  // can resolve the correct profile. No layout changes in this sprint.
  // eslint-disable-next-line no-unused-vars
  const _stream = useMemo(() => hydrate({ streamId: activeTier }), [activeTier]);
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
          <span className="home-nav-title">Simplifii-OS</span>
        </div>
        <div className="home-nav-actions">
          <AddCourseButton />
          <button
            type="button"
            onClick={navigateToResearch}
            style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${ACCENT_BORDER}`, borderRadius: 6, fontFamily: 'system-ui,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: 'pointer' }}
            aria-label="Open Research Workspace"
          >
            Research
          </button>
          {display.overdueTally && overdueCount > 0 && (
            <span className="home-overdue-badge" aria-label={`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`}>
              {overdueCount}
            </span>
          )}
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => {
              const cur = localStorage.getItem('simplifii_matrix_rain') !== 'false';
              localStorage.setItem('simplifii_matrix_rain', String(!cur));
              window.location.reload();
            }}
            title="Toggle background animation"
            aria-label="Toggle matrix rain animation"
            style={{ background: 'none', border: `1px solid ${ACCENT_BORDER}`, borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: localStorage.getItem('simplifii_matrix_rain') !== 'false' ? ACCENT_PULSE : TEXT_MUTED, minHeight: 28, minWidth: 28 }}
          >
            {localStorage.getItem('simplifii_matrix_rain') !== 'false' ? '\u2603' : '\u2601'}
          </button>
          <TalkToSomeoneLink />
          <LogoutButton />
        </div>
      </nav>

      <main className="home-main">
        {/* Greeting: tier-aware + time-aware + context-aware */}
        {(() => {
          const name = displayName || '';
          const nameBit = name ? `, ${name}` : '';
          const tier = profileTier || activeTier || 'tertiary';
          const timeGreet = clock.timeOfDay === 'late' ? 'Working late' : clock.timeOfDay === 'morning' ? 'Good morning' : clock.timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
          let greeting, sub;
          if (isFirstSession) {
            greeting = `Welcome to Simplifii-OS${nameBit}`;
            sub = 'Your neuroinclusive workspace is ready.';
          } else if (tier === 'secondary') {
            greeting = `${timeGreet}${nameBit}`;
            sub = sortedCourses.length > 0 ? `You have ${sortedCourses.length} course${sortedCourses.length === 1 ? '' : 's'}. Let's tackle the next one.` : 'Ready for your next assessment?';
          } else if (tier === 'postgrad') {
            greeting = `Welcome back${nameBit}`;
            sub = 'Your research workspace is ready.';
          } else if (tier === 'homeschool') {
            greeting = `${timeGreet}${nameBit}`;
            sub = "How can we help your learner today?";
          } else {
            greeting = `${timeGreet}${nameBit}`;
            sub = sortedCourses.length > 0 ? `${sortedCourses.length} course${sortedCourses.length === 1 ? '' : 's'} active.` : "Let's get started.";
          }
          return (
            <div style={{ padding: '20px 24px 8px' }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--sov-ink, #e4e4e7)', margin: '0 0 4px' }}>{greeting}</h2>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: TEXT_MUTED, margin: 0 }}>{sub}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--sov-ink-faint, #52525b)', margin: '8px 0 0', letterSpacing: '0.06em' }}>
                {clock.dayOfWeek}, {clock.formattedDate} | {clock.formattedTime} {clock.timezone.replace('_', ' ').split('/').pop()}
              </p>
            </div>
          );
        })()}

        {/* Empty state */}
        {isEmpty && !isAaron && (
          <EmptyWorkspace
            tier={profileTier}
            onCourseAdded={(course) => {
              const payload = {
                code: course.code || null,
                term: course.term ? { code: course.term, year: new Date().getFullYear() } : null,
                supabaseId: course.id,
              };
              if (course.assessment) {
                payload.extractionData = {
                  assessmentBriefs: [{ title: course.assessment.title, dueDate: course.assessment.dueDate, weight: '', wordCountGoal: 0 }],
                  assessmentTitles: [course.assessment.title],
                  doneWhenChecklist: [{ id: 'manual_0', text: course.assessment.title, checked: false, triggerWord: course.assessment.title.toLowerCase().split(' ').slice(0, 3).join(' ') }],
                };
              }
              return addCourseWithData(course.name, payload);
            }}
          />
        )}
        {isEmpty && isAaron && (
          <div className="home-empty">
            <h1 className="home-empty-title">Welcome</h1>
            <p className="home-empty-sub">
              Add your first course to begin. Upload a syllabus PDF and we will extract your assessments, due dates, and rubric criteria automatically.
            </p>
            <div style={{ marginTop: 16 }}>
              <AddCourseButton prominent />
            </div>
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
                  // Find most urgent course: overdue first, then soonest due
                  const entries = Object.entries(courses || {});
                  if (entries.length === 0) return;
                  let best = entries[0];
                  let bestDays = Infinity;
                  for (const [id, c] of entries) {
                    const briefs = c.extractionData?.assessmentBriefs || [];
                    for (const b of briefs) {
                      if (!b.dueDate) continue;
                      const days = Math.floor((new Date(b.dueDate) - new Date()) / (1000*60*60*24));
                      if (days < bestDays) { bestDays = days; best = [id, c]; }
                    }
                  }
                  const [cId, c] = best;
                  const cBriefs = c.extractionData?.assessmentBriefs || [];
                  if (cBriefs.length > 1) navigateToAssessments(cId);
                  else navigateToCanvas(cId, null);
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
                    onOpen={(cId) => {
                      const c = courses[cId];
                      const briefs = c?.extractionData?.assessmentBriefs || [];
                      if (briefs.length > 1) {
                        navigateToAssessments(cId);
                      } else {
                        navigateToCanvas(cId, null);
                      }
                    }}
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
        {/* Affirmation */}
        <AffirmationBanner trigger="dashboard" />
      </main>

      {showTesterWelcome && (
        <TesterWelcomeModal onDismiss={() => setShowTesterWelcome(false)} />
      )}

      {classifiedDoc && (
        <DocumentClassifiedModal
          type={classifiedDoc.type}
          confidence={classifiedDoc.confidence}
          suggestedActions={classifiedDoc.suggested_actions}
          onAction={() => {
            // Mark as seen so CanvasScreen does not show the modal again
            sessionStorage.setItem(`simplifii_classified_${classifiedDoc.courseId}`, 'true');
            navigateToCanvas(classifiedDoc.courseId);
            setClassifiedDoc(null);
          }}
          onOverride={(newType) => {
            if (classifiedDoc.courseId && courses[classifiedDoc.courseId]) {
              upgradeCourseExtraction(classifiedDoc.courseId, {
                extractionData: { documentType: newType },
              });
            }
            sessionStorage.setItem(`simplifii_classified_${classifiedDoc.courseId}`, 'true');
            setClassifiedDoc(null);
          }}
          onDismiss={() => {
            sessionStorage.setItem(`simplifii_classified_${classifiedDoc.courseId}`, 'true');
            setClassifiedDoc(null);
          }}
        />
      )}
    </div>
  );
}
