import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LS_KEY_PREFIX = 'simplifii_autosave_';

export const autosaveOutput = async (toolName, outputData, inputSummary, user) => {
  const entry = {
    toolName,
    outputData,
    inputSummary: (inputSummary || '').substring(0, 100),
    university: user?.university || '',
    createdAt: new Date().toISOString()
  };

  // Always save to localStorage as backup
  try {
    localStorage.setItem(`${LS_KEY_PREFIX}${toolName}`, JSON.stringify(entry));
  } catch (e) {
    // localStorage full or unavailable
  }

  if (user?.user_id) {
    try {
      await axios.post(`${API}/history/save`, {
        tool_name: toolName,
        input_summary: entry.inputSummary,
        output_summary: JSON.stringify(outputData).substring(0, 200),
        full_output: outputData,
        ticket_cost: 1
      }, { withCredentials: true });
      toast.success('Saved to your history', { duration: 2000 });
    } catch (err) {
      toast.success('Saved locally', { duration: 2000 });
    }
  } else {
    toast('Sign in to save outputs permanently', { duration: 3000 });
  }
};

export const getRecentOutput = (toolName) => {
  try {
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${toolName}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const age = Date.now() - new Date(entry.createdAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${LS_KEY_PREFIX}${toolName}`);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

export const clearRecentOutput = (toolName) => {
  try {
    localStorage.removeItem(`${LS_KEY_PREFIX}${toolName}`);
  } catch {}
};
