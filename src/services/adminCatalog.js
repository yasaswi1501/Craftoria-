import { supabase } from '../lib/supabase';
import { productsData, collectionsData } from '../data/products';
import { CRAFT_STYLES_BY_CATEGORY, MATERIALS, COLOURS, SIZES, MATERIAL_PRICE_DELTA } from '../data/customizationOptions';

// ---- Categories ----------------------------------------------------------

export async function fetchAdminCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, active, created_at')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .upsert(
      {
        id: category.id || undefined,
        name: category.name,
        slug: category.slug,
        description: category.description || null,
        image_url: category.image_url || null,
        active: category.active ?? true,
      },
      { onConflict: category.id ? 'id' : 'slug' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---- Products --------------------------------------------------------------
// Every product needs >=1 variant for cart/order/inventory to key against.
// The admin UI treats "product" as a single flat unit and manages one
// "Default" variant + its inventory row behind the scenes, matching the
// existing catalog's actual shape (no real size/color variants today).

export async function fetchAdminProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, base_price, sale_price, active, featured, category_id, created_at,
      rating, review_count, is_custom_starting_point,
      categories ( id, name, slug ),
      product_variants ( id, sku, active, inventory ( available_quantity, reserved_quantity, low_stock_threshold ) ),
      product_images ( id, image_url, display_order )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

const defaultSkuFor = (slug) => `${slug}-default`;

export async function upsertProduct({
  id, name, slug, description, category_id, base_price, sale_price, active, featured, stock, image_url,
  rating, review_count, is_custom_starting_point,
}) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .upsert(
      {
        id: id || undefined,
        name,
        slug,
        description: description || null,
        category_id: category_id || null,
        base_price,
        sale_price: sale_price || null,
        active: active ?? true,
        featured: featured ?? false,
        rating: rating ?? null,
        review_count: review_count ?? 0,
        is_custom_starting_point: is_custom_starting_point ?? false,
      },
      { onConflict: id ? 'id' : 'slug' }
    )
    .select()
    .single();
  if (productError) throw productError;

  // Ensure a Default variant exists for this product.
  const sku = defaultSkuFor(product.slug);
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .upsert(
      { product_id: product.id, sku, active: true },
      { onConflict: 'sku' }
    )
    .select()
    .single();
  if (variantError) throw variantError;

  // Stock lives on inventory, keyed by variant -- the handle_new_variant
  // trigger already created a 0-stock row when the variant was first
  // inserted, so this is always an update, never an insert.
  if (typeof stock === 'number') {
    const { error: invError } = await supabase
      .from('inventory')
      .update({ available_quantity: stock })
      .eq('product_variant_id', variant.id);
    if (invError) throw invError;
  }

  // Single primary image, replacing whatever was there before.
  if (image_url) {
    await supabase.from('product_images').delete().eq('product_id', product.id);
    const { error: imgError } = await supabase
      .from('product_images')
      .insert({ product_id: product.id, image_url, display_order: 0 });
    if (imgError) throw imgError;
  }

  return product;
}

export async function deleteProduct(id) {
  // product_variants/product_images both cascade off product_id.
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function setProductActive(id, active) {
  const { error } = await supabase.from('products').update({ active }).eq('id', id);
  if (error) throw error;
}

// ---- Dashboard / inventory RPCs -------------------------------------------

export async function fetchDashboardStats() {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  return data;
}

export async function fetchLowStockProducts() {
  const { data, error } = await supabase.rpc('admin_low_stock_products');
  if (error) throw error;
  return data || [];
}

export async function adjustInventory(variantId, delta, reason) {
  const { data, error } = await supabase.rpc('admin_adjust_inventory', {
    p_variant_id: variantId,
    p_delta: delta,
    p_reason: reason || null,
  });
  if (error) throw error;
  return data;
}

// ---- One-time bulk import from the static catalog -------------------------
// Idempotent (keyed by slug/sku): safe to click more than once, re-running
// just updates existing rows instead of duplicating them.

export async function importStaticCatalog(onProgress) {
  const report = { categories: 0, products: 0, errors: [] };

  for (const col of collectionsData) {
    try {
      await upsertCategory({
        slug: col.id,
        name: col.name,
        description: col.descriptionLong || col.desc,
        image_url: col.image ? `/product-images/${col.image}` : null,
        active: true,
      });
      report.categories++;
      onProgress?.(report);
    } catch (err) {
      report.errors.push(`Category "${col.name}": ${err.message}`);
    }
  }

  const { data: allCategories, error: catFetchError } = await supabase
    .from('categories')
    .select('id, slug');
  if (catFetchError) throw catFetchError;
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  for (const p of productsData) {
    try {
      const categorySlug = p.category === 'clips-rubber-bands' ? 'accessories' : p.category;
      await upsertProduct({
        name: p.title,
        slug: p.slug,
        description: p.details || p.description,
        category_id: categoryIdBySlug.get(categorySlug) || null,
        base_price: p.price,
        sale_price: p.discount > 0 ? Math.max(p.price - p.discount, 0) : null,
        active: true,
        featured: !!p.featured,
        stock: p.stock ?? 0,
        image_url: p.thumbnail ? `/product-images/${p.thumbnail}` : null,
        rating: p.rating ?? null,
        review_count: p.reviewCount ?? 0,
        is_custom_starting_point: p.id.startsWith('custom-'),
      });
      report.products++;
      onProgress?.(report);
    } catch (err) {
      report.errors.push(`Product "${p.title}": ${err.message}`);
    }
  }

  // Seed customization groups/options from the static config -- 3 global
  // groups (Material, Colour, Size) shared across every category, plus one
  // "Craft / Style" group per category (each with its own option list),
  // matching exactly what CustomizePage.jsx used to hardcode.
  const globalGroups = [
    { name: 'Material', options: MATERIALS.map((label) => ({ label, price_delta: MATERIAL_PRICE_DELTA[label] || 0 })) },
    { name: 'Colour', options: COLOURS.map((label) => ({ label, price_delta: 0 })) },
    { name: 'Size', options: SIZES.map((s) => ({ label: s.label, price_delta: s.priceDelta })) },
  ];

  for (const group of globalGroups) {
    try {
      await upsertCustomizationGroupWithOptions({ name: group.name, category_id: null, active: true }, group.options);
      report.customizationGroups = (report.customizationGroups || 0) + 1;
      onProgress?.(report);
    } catch (err) {
      report.errors.push(`Customization group "${group.name}": ${err.message}`);
    }
  }

  for (const col of collectionsData) {
    const styles = CRAFT_STYLES_BY_CATEGORY[col.id];
    if (!styles) continue;
    try {
      await upsertCustomizationGroupWithOptions(
        { name: 'Craft / Style', category_id: categoryIdBySlug.get(col.id), active: true },
        styles.map((label) => ({ label, price_delta: 0 }))
      );
      report.customizationGroups = (report.customizationGroups || 0) + 1;
      onProgress?.(report);
    } catch (err) {
      report.errors.push(`Customization group "Craft / Style (${col.name})": ${err.message}`);
    }
  }

  return report;
}

// ---- Customization groups & options ----------------------------------------

export async function fetchAdminCustomizationGroups() {
  const { data, error } = await supabase
    .from('customization_groups')
    .select(`
      id, name, category_id, display_order, active, created_at,
      categories ( id, name ),
      customization_options ( id, label, price_delta, display_order, active )
    `)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data || []).map((g) => ({
    ...g,
    customization_options: (g.customization_options || []).sort((a, b) => a.display_order - b.display_order),
  }));
}

export async function upsertCustomizationGroup(group) {
  const { data, error } = await supabase
    .from('customization_groups')
    .upsert({
      id: group.id || undefined,
      name: group.name,
      category_id: group.category_id || null,
      display_order: group.display_order ?? 0,
      active: group.active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Creates (or reuses, matched by name + category_id) a group and replaces
// its full option list in one call -- used by the static-catalog importer,
// which always wants "this exact list of options" rather than an
// incremental add/edit.
async function upsertCustomizationGroupWithOptions(group, options) {
  const { data: existing } = await supabase
    .from('customization_groups')
    .select('id')
    .eq('name', group.name)
    .is('category_id', group.category_id || null)
    .maybeSingle();

  const savedGroup = await upsertCustomizationGroup({ ...group, id: existing?.id });

  await supabase.from('customization_options').delete().eq('group_id', savedGroup.id);
  if (options.length > 0) {
    const { error } = await supabase.from('customization_options').insert(
      options.map((opt, idx) => ({
        group_id: savedGroup.id,
        label: opt.label,
        price_delta: opt.price_delta || 0,
        display_order: idx,
        active: true,
      }))
    );
    if (error) throw error;
  }
  return savedGroup;
}

export async function deleteCustomizationGroup(id) {
  const { error } = await supabase.from('customization_groups').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCustomizationOption(option) {
  const { data, error } = await supabase
    .from('customization_options')
    .upsert({
      id: option.id || undefined,
      group_id: option.group_id,
      label: option.label,
      price_delta: option.price_delta || 0,
      display_order: option.display_order ?? 0,
      active: option.active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomizationOption(id) {
  const { error } = await supabase.from('customization_options').delete().eq('id', id);
  if (error) throw error;
}

// ---- Settings (WhatsApp number, etc.) --------------------------------------

export async function fetchAdminSettings() {
  const { data, error } = await supabase.from('app_settings').select('key, value, updated_at');
  if (error) throw error;
  return data || [];
}

export async function updateSetting(key, value) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_by: userData?.user?.id || null });
  if (error) throw error;
}

// ---- Orders (admin, read-only view) ----------------------------------------

export async function fetchAdminOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, payment_method,
      subtotal, discount, shipping_charge, tax, total_amount,
      shipping_address_snapshot, created_at,
      order_items ( id, product_name, sku, quantity, unit_price, total, customization_snapshot )
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function updateOrderStatus(orderId, status, note) {
  // orders has no UPDATE RLS policy by design -- status transitions are
  // only ever allowed through this existing SECURITY DEFINER RPC (which
  // also appends to order_status_history), never a direct table write.
  const { data, error } = await supabase.rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_new_status: status,
    p_note: note || null,
  });
  if (error) throw error;
  return data;
}
