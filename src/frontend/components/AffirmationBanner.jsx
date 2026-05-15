import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import {
  TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS_FAINT,
  FONT_BODY, FONT_SYSTEM,
} from '../../theme/tokens';

/**
 * AffirmationBanner
 *
 * Tier-aware positive reinforcement. Shows at meaningful moments:
 * - Dashboard footer (rotating, low-prominence)
 * - After section auto-save with substantial content
 * - On re-entry after >24hr break
 * - After 3+ sections completed in a row
 * - decision_moment: when user clicks "What should I do next?"
 * - self_doubt_detected: when user asks "is this right?" 2+ times
 * - save_event: on auto-save with substantial content
 * - external_validation_seeking: when user seeks external approval
 *
 * Props:
 *   trigger  - 'dashboard' | 'section_complete' | 'reentry' | 'streak' |
 *              'decision_moment' | 'self_doubt_detected' | 'save_event' |
 *              'external_validation_seeking'
 *   visible  - boolean (parent controls when to show)
 */
export default function AffirmationBanner({ trigger = 'dashboard', visible = true }) {
  const { user } = useAuth();
  const { activeTier } = useSettings();
  const [copy, setCopy] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const tier = activeTier || 'tertiary';
    supabase.from('affirmations')
      .select('copy')
      .eq('tier', tier)
      .eq('trigger_event', trigger)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const pick = data[Math.floor(Math.random() * data.length)];
          setCopy(pick.copy);
          setShow(true);
          // Auto-hide after 8 seconds for non-dashboard triggers
          if (trigger !== 'dashboard') {
            setTimeout(() => setShow(false), 8000);
          }
        }
      });
  }, [visible, trigger, activeTier]);

  if (!show || !copy) return null;

  return (
    <div
      style={{
        padding: '8px 16px',
        background: trigger === 'dashboard' ? 'transparent' : ACCENT_GLASS_FAINT,
        textAlign: 'center',
        transition: 'opacity 0.5s ease',
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{
        fontFamily: trigger === 'dashboard' ? FONT_BODY : FONT_SYSTEM,
        fontSize: trigger === 'dashboard' ? 13 : 11,
        fontWeight: trigger === 'dashboard' ? 400 : 600,
        color: trigger === 'dashboard' ? TEXT_FAINT : ACCENT_PULSE,
        letterSpacing: trigger === 'dashboard' ? '0' : '0.04em',
        margin: 0,
        fontStyle: trigger === 'dashboard' ? 'italic' : 'normal',
      }}>
        {copy}
      </p>
    </div>
  );
}
