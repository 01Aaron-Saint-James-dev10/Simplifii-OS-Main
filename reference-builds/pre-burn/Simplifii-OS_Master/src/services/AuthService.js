import { supabase } from '../lib/supabaseClient';
import { runNeuralScan } from '../backend/NeuralAuditPipeline';

export const mockGoogleAuth = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'sandbox_demo_token',
        user: {
          name: 'Local User',
          email: 'local@simplifii.local',
          picture: 'https://via.placeholder.com/150'
        }
      });
    }, 1500);
  });
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchContextualHistory = async () => {
  const scan = runNeuralScan();
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        youtubeScrape: [],
        calendarScrape: [],
        inferredTier: scan.tier === 'Tertiary' ? 'tertiary' : 'general',
        inferredFocus: scan.inferredFocus
      });
    }, 2000);
  });
};
