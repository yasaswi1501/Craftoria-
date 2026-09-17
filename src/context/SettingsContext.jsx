import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

// Falls back to this if app_settings is unreachable or the row doesn't
// exist yet (e.g. migrations not applied) -- the site must keep working
// with the previously-hardcoded number rather than break WhatsApp ordering
// entirely if the settings fetch fails.
const FALLBACK_WHATSAPP_NUMBER = '919908860895';

export const SettingsProvider = ({ children }) => {
  const [whatsappNumber, setWhatsappNumber] = useState(FALLBACK_WHATSAPP_NUMBER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .maybeSingle();
        if (!active) return;
        if (!error && typeof data?.value === 'string' && /^\d{10,15}$/.test(data.value)) {
          setWhatsappNumber(data.value);
        }
      } catch (err) {
        // Stays on FALLBACK_WHATSAPP_NUMBER -- never break ordering because
        // the settings table/network is temporarily unreachable.
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <SettingsContext.Provider value={{ whatsappNumber, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
