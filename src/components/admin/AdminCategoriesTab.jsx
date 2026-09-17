import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchAdminCategories, upsertCategory, deleteCategory } from '../../services/adminCatalog';
import ConfirmDialog from '../ConfirmDialog';

const EMPTY_FORM = { id: null, name: '', slug: '', description: '', image_url: '', active: true };

const AdminCategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState(null); // null = form closed
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await fetchAdminCategories());
    } catch (err) {
      setError(err.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...EMPTY_FORM }); setFormErrors({}); };
  const openEdit = (cat) => { setForm({ ...cat }); setFormErrors({}); };
  const closeForm = () => { setForm(null); setFormErrors({}); };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.slug.trim()) errs.slug = 'Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) errs.slug = 'Slug must be lowercase letters, numbers, and hyphens only.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setIsSaving(true);
    try {
      await upsertCategory({ ...form, slug: form.slug.trim() });
      closeForm();
      load();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Could not save this category.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this category (it may still have products in it).');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">Categories ({categories.length})</h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Category
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      {/* Add/Edit Form */}
      {form && (
        <form onSubmit={handleSave} className="glass-card p-5 rounded-[24px] border border-brand-purple/20 bg-white/60 shadow-sm space-y-3.5">
          <h3 className="font-serif text-sm font-bold text-brand-plum">{form.id ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.name ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.name && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.name}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Slug (URL id)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="e.g. embroidery"
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.slug ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.slug && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.slug}</span>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">Image URL</label>
            <input
              type="text"
              value={form.image_url || ''}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="/product-images/example.jpg or a full https:// URL"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-brand-plum w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-dark/80">Active (visible on the storefront)</span>
          </label>

          {formErrors.submit && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" /> {formErrors.submit}
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-brand-purple/25 text-brand-dark/70 hover:bg-brand-purple/5 font-semibold text-xs uppercase tracking-wider cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-brand-purple/5 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-brand-purple/10">
          <p className="text-xs font-semibold text-brand-dark/60">No categories yet. Add one, or use the Dashboard tab's Import.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {categories.map((cat) => (
            <div key={cat.id} className="glass-card p-3.5 sm:p-4 rounded-2xl border border-brand-purple/15 bg-white/60 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 overflow-hidden flex-shrink-0">
                {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-bold text-brand-dark truncate">{cat.name}</span>
                  {!cat.active && (
                    <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Inactive</span>
                  )}
                </div>
                <span className="text-[10px] text-brand-dark/50 font-mono">/{cat.slug}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer"
                  aria-label="Edit category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setDeleteError(''); setPendingDelete(cat); }}
                  className="p-2 rounded-full hover:bg-rose-50 text-rose-500 cursor-pointer"
                  aria-label="Delete category"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete this category?"
        message={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted. Products in this category will keep their data but lose their category link.` : ''}
        confirmLabel="Delete"
        isLoading={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!isDeleting) setPendingDelete(null); }}
      />
    </div>
  );
};

export default AdminCategoriesTab;
