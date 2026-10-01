import { supabase } from './supabase';

export async function needsSecondFactor() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}
