import { supabase } from '../lib/supabaseClient';
import { usePersistentStore } from '../state/persistentStore';

// Note: This service syncs client-side persistent storage to Supabase for cross-device persistence.

export async function syncSettingsToCloud() {
  const state = usePersistentStore.getState();
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return; // Only sync if logged in
    
    // Save state to a user_settings table
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: userData.user.id, 
        mode: state.mode,
        active_exchange: state.activeExchange,
        agents_config: state.agents,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (error) {
      console.error('Failed to sync settings to cloud:', error);
    }
  } catch (err) {
    console.error('Error syncing:', err);
  }
}

export async function loadSettingsFromCloud() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
      
    if (!error && data) {
      const store = usePersistentStore.getState();
      if (data.mode) store.setMode(data.mode);
      if (data.active_exchange) store.setActiveExchange(data.active_exchange);
      if (data.agents_config) {
        // Hydrate agents
        data.agents_config.forEach((agent: any) => {
          store.updateAgent(agent.id, agent);
        });
      }
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}
