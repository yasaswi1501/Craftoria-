import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash, Check, X, RefreshCw, AlertCircle, Star, PackageX, Search, Sparkles } from 'lucide-react';
import { fetchAdminProducts, fetchAdminCategories, upsertProduct, deleteProduct, setProductActive } from '../../services/adminCatalog';
import ConfirmDialog from '../ConfirmDialog';

const EMPTY_FORM = {
  id: null, name: '', slug: '', description: '', category_id: '',
  base_price: '', sale_price: '', stock: '', image_url: '', active: true, featured: false,
  rating: '', review_count: '', is_custom_starting_point: false,
};

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [sortBy, setSortBy] = useState('newest'); // newest | name | price

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => (statusFilter === 'active' ? p.active : !p.active));
    }
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
      result.sort((a, b) => (a.sale_price || a.base_price) - (b.sale_price || b.base_price));
    }
    // 'newest' is already the fetch order (created_at desc).
    return result;
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || '' });
    setFormErrors({});
    setSlugTouched(false);
  };

  const openEdit = (p) => {
    const variant = p.product_variants?.[0];
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      category_id: p.category_id || '',
      base_price: p.base_price,
      sale_price: p.sale_price || '',
      stock: variant?.inventory?.available_quantity ?? 0,
      image_url: p.product_images?.[0]?.image_url || '',
      active: p.active,
      featured: p.featured,
      rating: p.rating ?? '',
      review_count: p.review_count ?? 0,
      is_custom_starting_point: !!p.is_custom_starting_point,
    });
    setFormErrors({});
    setSlugTouched(true);
  };

  const closeForm = () => { setForm(null); setFormErrors({}); };

  const handleNameChange = (name) => {
    setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.slug.trim()) errs.slug = 'Slug is required.';
    const basePrice = parseFloat(form.base_price);
    if (isNaN(basePrice) || basePrice < 0) errs.base_price = 'Enter a valid price.';
    if (form.sale_price !== '' && (isNaN(parseFloat(form.sale_price)) || parseFloat(form.sale_price) > basePrice)) {
      errs.sale_price = 'Sale price must be a number, and cannot exceed the base price.';
    }
    if (form.stock !== '' && (isNaN(parseInt(form.stock, 10)) || parseInt(form.stock, 10) < 0)) {
      errs.stock = 'Enter a valid stock quantity.';
    }
    if (form.rating !== '' && (isNaN(parseFloat(form.rating)) || parseFloat(form.rating) < 0 || parseFloat(form.rating) > 5)) {
      errs.rating = 'Rating must be between 0 and 5.';
    }
    if (form.review_count !== '' && (isNaN(parseInt(form.review_count, 10)) || parseInt(form.review_count, 10) < 0)) {
      errs.review_count = 'Enter a valid review count.';
    }
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setIsSaving(true);
    try {
      await upsertProduct({
        id: form.id,
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description.trim(),
        category_id: form.category_id || null,
        base_price: basePrice,
        sale_price: form.sale_price !== '' ? parseFloat(form.sale_price) : null,
        stock: form.stock !== '' ? parseInt(form.stock, 10) : undefined,
        image_url: form.image_url.trim(),
        active: form.active,
        featured: form.featured,
        rating: form.rating !== '' ? parseFloat(form.rating) : null,
        review_count: form.review_count !== '' ? parseInt(form.review_count, 10) : 0,
        is_custom_starting_point: form.is_custom_starting_point,
      });
      closeForm();
      load();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Could not save this product.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (p) => {
    try {
      await setProductActive(p.id, !p.active);
      load();
    } catch (err) {
      setError(err.message || 'Could not update this product.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteProduct(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-lg font-bold">Products ({products.length})</h2>
        <button
          onClick={openNew}
          disabled={categories.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          title={categories.length === 0 ? 'Add a category first' : ''}
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}
      {categories.length === 0 && !loading && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          Add at least one category (Categories tab) before adding products.
        </div>
      )}

      {/* Search / Filter / Sort toolbar */}
      {products.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-white/50 border border-brand-purple/15 p-2.5 rounded-2xl">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-dark/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full border border-brand-purple/15 bg-white text-xs h-9 focus:outline-none focus:border-brand-purple"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 h-9 rounded-full border border-brand-purple/20 bg-white cursor-pointer focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 h-9 rounded-full border border-brand-purple/20 bg-white cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-3 h-9 rounded-full border border-brand-purple/20 bg-white cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
      )}

      {/* Add/Edit Form */}
      {form && (
        <form onSubmit={handleSave} className="glass-card p-5 rounded-[24px] border border-brand-purple/20 bg-white/60 shadow-sm space-y-3.5">
          <h3 className="font-serif text-sm font-bold text-brand-plum">{form.id ? 'Edit Product' : 'New Product'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.name ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.name && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.name}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Slug (URL id)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value.toLowerCase() }); }}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.slug ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.slug && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.slug}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              <option value="">-- No category --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.base_price ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.base_price && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.base_price}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Sale Price (₹, optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.sale_price ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.sale_price && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.sale_price}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.stock ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.stock && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.stock}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark/80">Image URL</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="/product-images/example.jpg or a full https:// URL"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-brand-purple/10">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Rating (0-5, optional)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="e.g. 4.8"
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.rating ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.rating && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.rating}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/80">Review Count</label>
              <input
                type="number"
                min="0"
                value={form.review_count}
                onChange={(e) => setForm({ ...form, review_count: e.target.value })}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${formErrors.review_count ? 'border-rose-400' : 'border-brand-purple/20 focus:border-brand-purple'}`}
              />
              {formErrors.review_count && <span className="text-[10px] text-rose-600 font-semibold">{formErrors.review_count}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-brand-plum w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-brand-dark/80">Active (visible on storefront)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="accent-brand-plum w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-brand-dark/80">Featured</span>
            </label>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none p-3 rounded-xl bg-brand-purple/5 border border-brand-purple/15">
            <input
              type="checkbox"
              checked={form.is_custom_starting_point}
              onChange={(e) => setForm({ ...form, is_custom_starting_point: e.target.checked })}
              className="accent-brand-plum w-4 h-4 cursor-pointer mt-0.5"
            />
            <span className="text-xs">
              <span className="font-semibold text-brand-dark flex items-center gap-1"><Sparkles className="w-3 h-3 text-brand-plum" /> Custom-order starting product for this category</span>
              <span className="block text-brand-dark/55 mt-0.5">Its price becomes the base price for the "/customize" bespoke-commission flow in this category. Only one product per category should have this checked.</span>
            </span>
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

      {/* Products List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-brand-purple/5 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-brand-purple/10">
          <p className="text-xs font-semibold text-brand-dark/60">No products yet. Add one, or use the Dashboard tab's Import.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-brand-purple/10">
          <p className="text-xs font-semibold text-brand-dark/60">No products match your search/filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredProducts.map((p) => {
            const stock = p.product_variants?.[0]?.inventory?.available_quantity ?? 0;
            const img = p.product_images?.[0]?.image_url;
            return (
              <div key={p.id} className="glass-card p-3.5 sm:p-4 rounded-2xl border border-brand-purple/15 bg-white/60 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 overflow-hidden flex-shrink-0">
                  {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif text-sm font-bold text-brand-dark truncate">{p.name}</span>
                    {p.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    {!p.active && <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Inactive</span>}
                    {stock === 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full flex-shrink-0"><PackageX className="w-2.5 h-2.5" /> Out of Stock</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-brand-dark/50 font-mono flex-wrap">
                    <span>{p.categories?.name || 'Uncategorized'}</span>
                    <span>&bull;</span>
                    <span className="font-bold text-brand-plum">₹{Number(p.sale_price || p.base_price).toLocaleString('en-IN')}</span>
                    {p.sale_price && <span className="line-through text-brand-dark/35">₹{Number(p.base_price).toLocaleString('en-IN')}</span>}
                    <span>&bull;</span>
                    <span>Stock: {stock}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className="px-2.5 py-1.5 rounded-full border border-brand-purple/20 text-[10px] font-bold text-brand-dark/70 hover:bg-brand-purple/10 cursor-pointer"
                  >
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer"
                    aria-label="Edit product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setDeleteError(''); setPendingDelete(p); }}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-500 cursor-pointer"
                    aria-label="Delete product"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete this product?"
        message={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted, along with its variant and images.` : ''}
        confirmLabel="Delete"
        isLoading={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!isDeleting) setPendingDelete(null); }}
      />
    </div>
  );
};

export default AdminProductsTab;
