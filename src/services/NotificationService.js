/**
 * NotificationService.js
 *
 * Browser push notification system for Simplifii-OS.
 * Handles: service worker registration, permission request,
 * due date reminders, and scheduled check-ins.
 *
 * Notifications are local (no push server needed).
 * The service worker shows them via postMessage.
 */

let swRegistration = null;

/**
 * Register the notification service worker.
 * Call once on app mount.
 */
export async function registerNotificationSW() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw-notifications.js');
    return true;
  } catch {
    return false;
  }
}

/**
 * Request notification permission from the user.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Check if notifications are enabled and permitted.
 */
export function isEnabled() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Send a notification via the service worker.
 */
export function sendNotification({ title, body, tag, url }) {
  if (!isEnabled()) return;
  if (swRegistration?.active) {
    swRegistration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag,
      url,
    });
  } else {
    // Fallback: direct Notification API
    try {
      new Notification(title, { body, tag, icon: '/favicon.ico' });
    } catch { /* silent */ }
  }
}

/**
 * Schedule due date reminders for all courses.
 * Checks assessments and sends a notification for anything due within 24 hours.
 * Call periodically (every 30 minutes) or on app focus.
 *
 * @param {Object} courses - keyed by courseId
 */
export function checkDueDateReminders(courses) {
  if (!isEnabled()) return;
  const now = new Date();
  const notifiedKey = `simplifii_notified_${now.toDateString()}`;
  const alreadyNotified = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

  Object.entries(courses || {}).forEach(([courseId, course]) => {
    const briefs = course.extractionData?.assessmentBriefs || [];
    briefs.forEach((brief) => {
      if (!brief.dueDate) return;
      const due = new Date(brief.dueDate);
      if (isNaN(due.getTime())) return;

      const hoursUntil = (due - now) / (1000 * 60 * 60);
      const notifId = `${courseId}_${brief.title}`;

      if (alreadyNotified.includes(notifId)) return;

      if (hoursUntil > 0 && hoursUntil <= 24) {
        const hours = Math.round(hoursUntil);
        sendNotification({
          title: `${brief.title} due ${hours <= 1 ? 'in 1 hour' : `in ${hours} hours`}`,
          body: `${course.name}: open Simplifii to keep working.`,
          tag: `due-${notifId}`,
          url: '/',
        });
        alreadyNotified.push(notifId);
        localStorage.setItem(notifiedKey, JSON.stringify(alreadyNotified));
      } else if (hoursUntil <= 0 && hoursUntil > -24) {
        sendNotification({
          title: `${brief.title} is overdue`,
          body: `${course.name}: it is not too late to submit.`,
          tag: `overdue-${notifId}`,
          url: '/',
        });
        alreadyNotified.push(notifId);
        localStorage.setItem(notifiedKey, JSON.stringify(alreadyNotified));
      }
    });
  });
}

/**
 * Send a focus session reminder.
 */
export function sendFocusReminder(assessmentTitle) {
  sendNotification({
    title: 'Time to focus',
    body: assessmentTitle ? `Ready to work on ${assessmentTitle}?` : 'Ready to start a focus session?',
    tag: 'focus-reminder',
    url: '/',
  });
}
