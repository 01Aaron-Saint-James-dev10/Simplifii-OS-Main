import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import { supabase } from '../../lib/supabaseClient';
import { buildLearnerContext, extractProfileData } from '../../services/LearnerContextService';

/**
 * useLearnerContext
 *
 * Loads the learner's Supabase profile (profiler, pain points, year/state)
 * once per session and combines with live SettingsContext values to produce
 * a LEARNER CONTEXT string for AI system prompts.
 *
 * Returns: { learnerContext: string, profileLoaded: boolean }
 */
export default function useLearnerContext() {
  const { user } = useAuth();
  const {
    activeTier, accessibilityProfile, sensoryLevel,
    scaffoldingLevel, gritLevel, lodLevel,
  } = useSettings();

  const [profileData, setProfileData] = useState(null);

  // Load profile from Supabase once per session
  useEffect(() => {
    if (!user?.id) return;
    const cacheKey = `simplifii_profile_cache_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setProfileData(JSON.parse(cached)); return; } catch { /* corrupt cache */ }
    }
    supabase.from('profiles')
      .select('tier, year_level, state, pain_points, preferences')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const extracted = extractProfileData(data);
          setProfileData(extracted);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(extracted)); } catch {}
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const learnerContext = useMemo(() => {
    if (!profileData) return '';
    return buildLearnerContext({
      ...profileData,
      accessibilityProfile,
      sensoryLevel,
      scaffoldingLevel,
      gritLevel,
      lodLevel,
    });
  }, [profileData, accessibilityProfile, sensoryLevel, scaffoldingLevel, gritLevel, lodLevel]);

  return { learnerContext, profileLoaded: !!profileData };
}
