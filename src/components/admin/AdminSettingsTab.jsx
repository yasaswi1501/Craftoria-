import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Check, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { fetchAdminSettings, updateSetting } from '../../services/adminCatalog';

// Digits only, no "+", no spaces/dashes -- matches the format the client
// code already builds wa.me / api.whatsapp.com URLs with (country code +
// number, e.g. "919908860895"). Rejecting anything else blocks someone from
// saving a URL scheme, script, or other unsafe value into this field --
// only a validated phone number is ever allowed to reach the order-message
// URL builder.
const WHATSAPP_NUMBER_PATTERN = /^\d{10,15}$/;

const AdminSettingsTab = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savedNumber, setSavedNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | null

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const settings = await fetchAdminSettings();
      const entry = settings.find((s) => s.key === 'whatsapp_number');
      const value = typeof entry?.value === 'string' ? entry.value : '';
      setWhatsappNumber(value);
      setSavedNumber(value);
    } catch (err) {
      setError(err.message || 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus(null);
    const cleaned = whatsappNumber.trim();
    if (!WHATSAPP_NUMBER_PATTERN.test(cleaned)) {
      setValidationError('Enter digits only, including country code, no spaces or symbols (e.g. 919908860895 for +91 99088 60895).');
      return;
    }
    setValidationError('');
    setIsSaving(true);
    try {
      await updateSetting('whatsapp_number', cleaned);
      setSavedNumber(cleaned);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setValidationError(err.message || 'Could not save this setting.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = whatsappNumber !== savedNumber;

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="font-serif text-lg font-bold">Settings</h2>
        <p className="text-[11px] text-brand-dark/55 mt-0.5">
          Admin-only system configuration. Changes here take effect immediately for every future order &mdash; no redeploy needed.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      {loading ? (
        <div className="h-40 rounded-2xl bg-brand-purple/5 animate-pulse" />
      ) : (
        <form onSubmit={handleSave} className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-purple/10">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-brand-dark">WhatsApp Order Destination</h3>
              <p className="text-[10px] text-brand-dark/55">Every customer order and custom-commission message opens a chat to this number.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">WhatsApp Number</label>
            <input
              type="text"
              inputMode="numeric"
              value={whatsappNumber}
              onChange={(e) => { setWhatsappNumber(e.target.value.replace(/[^\d]/g, '')); setValidationError(''); }}
              placeholder="919908860895"
              className={`w-full text-sm font-mono px-3.5 py-3 rounded-xl border bg-white focus:outline-none ${validationError ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
            />
            <span className="text-[10px] text-brand-dark/50">Country code + number, digits only. No "+", spaces, or symbols.</span>
            {validationError && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 pt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {validationError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={isSaving || !hasUnsavedChanges}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>
            )}
            {hasUnsavedChanges && saveStatus !== 'saved' && (
              <span className="text-[10px] text-amber-600 font-semibold">Unsaved changes</span>
            )}
          </div>

          <div className="flex items-start gap-2 pt-3 border-t border-brand-purple/10 text-[10px] text-brand-dark/50 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-plum flex-shrink-0 mt-0.5" />
            <span>Only accounts with the admin role can view or change this. Publicly readable by the storefront (a WhatsApp number is not a secret), but write access is restricted at the database level, not just hidden in the UI.</span>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsTab;
