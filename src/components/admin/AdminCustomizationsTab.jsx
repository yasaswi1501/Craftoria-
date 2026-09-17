import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash, Check, X, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import {
  fetchAdminCustomizationGroups, upsertCustomizationGroup, deleteCustomizationGroup,
  upsertCustomizationOption, deleteCustomizationOption, fetchAdminCategories
} from '../../services/adminCatalog';
import ConfirmDialog from '../ConfirmDialog';

const EMPTY_GROUP_FORM = { id: null, name: '', category_id: '', display_order: 0, active: true };
const EMPTY_OPTION_FORM = { id: null, group_id: null, label: '', price_delta: '', display_order: 0, active: true };

const AdminCustomizationsTab = () => {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [groupForm, setGroupForm] = useState(null);
  const [groupFormErrors, setGroupFormErrors] = useState({});
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState('');

  const [optionForm, setOptionForm] = useState(null);
  const [optionFormErrors, setOptionFormErrors] = useState({});
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [pendingDeleteOption, setPendingDeleteOption] = useState(null);
  const [isDeletingOption, setIsDeletingOption] = useState(false);
  const [deleteOptionError, setDeleteOptionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [groupsData, categoriesData] = await Promise.all([
        fetchAdminCustomizationGroups(),
        fetchAdminCategories(),
      ]);
      setGroups(groupsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Could not load customization groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ---- Group handlers ----
  const openNewGroup = () => { setGroupForm({ ...EMPTY_GROUP_FORM }); setGroupFormErrors({}); };
  const openEditGroup = (g) => {
    setGroupForm({ id: g.id, name: g.name, category_id: g.category_id || '', display_order: g.display_order, active: g.active });
    setGroupFormErrors({});
  };
  const closeGroupForm = () => { setGroupForm(null); setGroupFormErrors({}); };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) { setGroupFormErrors({ name: 'Name is required.' }); return; }
    setIsSavingGroup(true);
    try {
      await upsertCustomizationGroup({ ...groupForm, category_id: groupForm.category_id || null });
      closeGroupForm();
      load();
    } catch (err) {
      setGroupFormErrors({ submit: err.message || 'Could not save this group.' });
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!pendingDeleteGroup) return;
    setIsDeletingGroup(true);
    setDeleteGroupError('');
    try {
      await deleteCustomizationGroup(pendingDeleteGroup.id);
      setPendingDeleteGroup(null);
      load();
    } catch (err) {
      setDeleteGroupError(err.message || 'Could not delete this group.');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // ---- Option handlers ----
  const openNewOption = (groupId) => { setOptionForm({ ...EMPTY_OPTION_FORM, group_id: groupId }); setOptionFormErrors({}); };
  const openEditOption = (opt) => {
    setOptionForm({ id: opt.id, group_id: opt.group_id, label: opt.label, price_delta: opt.price_delta, display_order: opt.display_order, active: opt.active });
    setOptionFormErrors({});
  };
  const closeOptionForm = () => { setOptionForm(null); setOptionFormErrors({}); };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!optionForm.label.trim()) errs.label = 'Label is required.';
    const delta = parseFloat(optionForm.price_delta || 0);
    if (isNaN(delta)) errs.price_delta = 'Enter a valid price adjustment (can be 0).';
    if (Object.keys(errs).length > 0) { setOptionFormErrors(errs); return; }

    setIsSavingOption(true);
    try {
      await upsertCustomizationOption({ ...optionForm, price_delta: delta });
      closeOptionForm();
      load();
    } catch (err) {
      setOptionFormErrors({ submit: err.message || 'Could not save this option.' });
    } finally {
      setIsSavingOption(false);
    }
  };

  const handleConfirmDeleteOption = async () => {
    if (!pendingDeleteOption) return;
    setIsDeletingOption(true);
    setDeleteOptionError('');
    try {
      await deleteCustomizationOption(pendingDeleteOption.id);
      setPendingDeleteOption(null);
      load();
    } catch (err) {
      setDeleteOptionError(err.message || 'Could not delete this option.');
    } finally {
      setIsDeletingOption(false);
    }
  };

  const toggleOptionActive = async (opt) => {
    try {
      await upsertCustomizationOption({ ...opt, active: !opt.active });
      load();
    } catch (err) {
      setError(err.message || 'Could not update this option.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-lg font-bold">Customization Groups ({groups.length})</h2>
          <p className="text-[11px] text-brand-dark/55 mt-0.5 max-w-lg">
            Powers the dropdowns on the /customize bespoke-order page (Craft/Style, Material, Colour, Size). A group with no category is offered on every category; a group tied to one category (e.g. "Craft / Style") only appears there.
          </p>
        </div>
        <button
          onClick={openNewGroup}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Group
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      {/* Group Form */}
      {groupForm && (
        <form onSubmit={handleSaveGroup} className="glass-card p-5 rounded-[24px] border border-brand-purple/20 bg-white/60 shadow-sm space-y-3.5">
          <h3 className="font-serif text-sm font-bold text-brand-plum">{groupForm.id ? 'Edit Group' : 'New Customization Group'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Group Name</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="e.g. Material, Colour, Size"
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${groupFormErrors.name ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {groupFormErrors.name && <span className="text-[10px] text-rose-600 font-semibold">{groupFormErrors.name}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Category Scope</label>
              <select
                value={groupForm.category_id}
                onChange={(e) => setGroupForm({ ...groupForm, category_id: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple cursor-pointer"
              >
                <option value="">All categories (global)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name} only</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={groupForm.active}
              onChange={(e) => setGroupForm({ ...groupForm, active: e.target.checked })}
              className="accent-brand-plum w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-dark/80">Active (shown on the customize page)</span>
          </label>
          {groupFormErrors.submit && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" /> {groupFormErrors.submit}
            </div>
          )}
          <div className="flex gap-2.5">
            <button type="submit" disabled={isSavingGroup} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60">
              {isSavingGroup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {isSavingGroup ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={closeGroupForm} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-brand-purple/25 text-brand-dark/70 hover:bg-brand-purple/5 font-semibold text-xs uppercase tracking-wider cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Option Form (modal-like inline card) */}
      {optionForm && (
        <form onSubmit={handleSaveOption} className="glass-card p-5 rounded-[24px] border border-brand-plum/40 bg-brand-purple/5 shadow-sm space-y-3.5">
          <h3 className="font-serif text-sm font-bold text-brand-plum">{optionForm.id ? 'Edit Option' : 'New Option'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Label</label>
              <input
                type="text"
                value={optionForm.label}
                onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
                placeholder="e.g. Large"
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${optionFormErrors.label ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {optionFormErrors.label && <span className="text-[10px] text-rose-600 font-semibold">{optionFormErrors.label}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Price Adjustment (₹)</label>
              <input
                type="number"
                step="0.01"
                value={optionForm.price_delta}
                onChange={(e) => setOptionForm({ ...optionForm, price_delta: e.target.value })}
                placeholder="0"
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${optionFormErrors.price_delta ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {optionFormErrors.price_delta && <span className="text-[10px] text-rose-600 font-semibold">{optionFormErrors.price_delta}</span>}
              <span className="text-[10px] text-brand-dark/50 block">0 for no price change. Positive adds to the price.</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={optionForm.active}
              onChange={(e) => setOptionForm({ ...optionForm, active: e.target.checked })}
              className="accent-brand-plum w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-dark/80">Active (selectable by customers)</span>
          </label>
          {optionFormErrors.submit && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" /> {optionFormErrors.submit}
            </div>
          )}
          <div className="flex gap-2.5">
            <button type="submit" disabled={isSavingOption} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60">
              {isSavingOption ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {isSavingOption ? 'Saving...' : 'Save Option'}
            </button>
            <button type="button" onClick={closeOptionForm} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-brand-purple/25 text-brand-dark/70 hover:bg-brand-purple/5 font-semibold text-xs uppercase tracking-wider cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-brand-purple/5 animate-pulse" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-brand-purple/10">
          <p className="text-xs font-semibold text-brand-dark/60">No customization groups yet. Add one, or use the Dashboard tab's Import.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => {
            const isExpanded = expandedGroupId === g.id;
            return (
              <div key={g.id} className="glass-card rounded-2xl border border-brand-purple/15 bg-white/60 overflow-hidden">
                <div className="p-3.5 sm:p-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-plum">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif text-sm font-bold text-brand-dark">{g.name}</span>
                      {!g.active && <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <span className="text-[10px] text-brand-dark/50 font-mono">
                      {g.categories?.name ? `${g.categories.name} only` : 'All categories'} &bull; {g.customization_options?.length || 0} options
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setExpandedGroupId(isExpanded ? null : g.id)} className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer" aria-label="Toggle options">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEditGroup(g)} className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer" aria-label="Edit group">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setDeleteGroupError(''); setPendingDeleteGroup(g); }} className="p-2 rounded-full hover:bg-rose-50 text-rose-500 cursor-pointer" aria-label="Delete group">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3.5 sm:px-4 pb-4 border-t border-brand-purple/10 pt-3">
                    <div className="flex flex-col gap-1.5">
                      {(g.customization_options || []).length === 0 && (
                        <p className="text-[11px] text-brand-dark/50 italic px-1">No options in this group yet.</p>
                      )}
                      {(g.customization_options || []).map((opt) => (
                        <div key={opt.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/70 border border-brand-purple/10 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-semibold truncate ${opt.active ? 'text-brand-dark' : 'text-brand-dark/40 line-through'}`}>{opt.label}</span>
                            {opt.price_delta > 0 && <span className="text-emerald-600 font-bold flex-shrink-0">+₹{opt.price_delta}</span>}
                            {opt.price_delta < 0 && <span className="text-rose-600 font-bold flex-shrink-0">-₹{Math.abs(opt.price_delta)}</span>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => toggleOptionActive(opt)} className="px-2 py-1 rounded-full border border-brand-purple/20 text-[9px] font-bold text-brand-dark/70 hover:bg-brand-purple/10 cursor-pointer">
                              {opt.active ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => openEditOption(opt)} className="p-1.5 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer" aria-label="Edit option">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => { setDeleteOptionError(''); setPendingDeleteOption(opt); }} className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 cursor-pointer" aria-label="Delete option">
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => openNewOption(g.id)}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-plum hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteGroup}
        title="Delete this customization group?"
        message={pendingDeleteGroup ? `"${pendingDeleteGroup.name}" and all its options will be permanently deleted.` : ''}
        confirmLabel="Delete"
        isLoading={isDeletingGroup}
        errorMessage={deleteGroupError}
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => { if (!isDeletingGroup) setPendingDeleteGroup(null); }}
      />
      <ConfirmDialog
        isOpen={!!pendingDeleteOption}
        title="Delete this option?"
        message={pendingDeleteOption ? `"${pendingDeleteOption.label}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        isLoading={isDeletingOption}
        errorMessage={deleteOptionError}
        onConfirm={handleConfirmDeleteOption}
        onCancel={() => { if (!isDeletingOption) setPendingDeleteOption(null); }}
      />
    </div>
  );
};

export default AdminCustomizationsTab;
