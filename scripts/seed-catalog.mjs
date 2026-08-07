// One-time/idempotent seed: mirrors the static src/data/products.js catalog
// into Supabase so the DB has authoritative products/variants/inventory for
// pricing and cart/order integrity. Display-only fields (ratings, tags,
// long-form details, image asset filenames) intentionally stay out of the
// DB and keep being served from src/data/products.js -- the frontend UI is
// unchanged, this just gives it a source of truth to check prices/stock
// against.
//
// Usage:
//   node --env-file=.env.seed scripts/seed-catalog.mjs
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only secret,
// never the VITE_-prefixed anon key) -- see .env.seed.example.

import { createClient } from '@supabase/supabase-js';
import { productsData, collectionsData } from '../src/data/products.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run with: node --env-file=.env.seed scripts/seed-catalog.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`Seeding ${collectionsData.length} categories and ${productsData.length} products...\n`);

  // 1. Categories
  const categoryRows = collectionsData.map((c) => ({
    slug: c.id,
    name: c.name,
    description: c.desc,
  }));
  const { error: catErr } = await supabase.from('categories').upsert(categoryRows, { onConflict: 'slug' });
  if (catErr) throw new Error(`categories upsert failed: ${catErr.message}`);

  const { data: categories, error: catFetchErr } = await supabase.from('categories').select('id, slug');
  if (catFetchErr) throw new Error(`categories fetch failed: ${catFetchErr.message}`);
  const categoryIdBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  let productCount = 0, variantCount = 0, imageCount = 0;

  for (const p of productsData) {
    const categoryId = categoryIdBySlug[p.category];
    if (!categoryId) {
      console.warn(`  ! skipping "${p.id}": unknown category "${p.category}"`);
      continue;
    }

    // Existing static data stores the *sale* price in `price` and the
    // absolute amount saved in `discount` (see CollectionPage.jsx, which
    // renders `price + discount` as the struck-through original price) --
    // inverted from base_price/sale_price naming, mapped here.
    const basePrice = p.price + (p.discount || 0);
    const salePrice = p.discount > 0 ? p.price : null;

    const { data: product, error: prodErr } = await supabase
      .from('products')
      .upsert(
        {
          slug: p.id,
          name: p.title,
          description: p.description,
          category_id: categoryId,
          base_price: basePrice,
          sale_price: salePrice,
          active: true,
          featured: !!p.featured,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();
    if (prodErr) throw new Error(`product upsert failed for "${p.id}": ${prodErr.message}`);
    productCount++;

    const { data: variant, error: variantErr } = await supabase
      .from('product_variants')
      .upsert({ product_id: product.id, sku: p.id, active: true }, { onConflict: 'sku' })
      .select('id')
      .single();
    if (variantErr) throw new Error(`variant upsert failed for "${p.id}": ${variantErr.message}`);
    variantCount++;

    const { error: invErr } = await supabase
      .from('inventory')
      .update({ available_quantity: p.stock ?? 0 })
      .eq('product_variant_id', variant.id);
    if (invErr) throw new Error(`inventory update failed for "${p.id}": ${invErr.message}`);

    // Idempotent image sync: replace this product's images each run.
    const images = [p.thumbnail, ...(p.galleryImages || [])].filter(Boolean);
    const uniqueImages = [...new Set(images)];
    await supabase.from('product_images').delete().eq('product_id', product.id);
    if (uniqueImages.length > 0) {
      const { error: imgErr } = await supabase.from('product_images').insert(
        uniqueImages.map((image_url, i) => ({ product_id: product.id, image_url, display_order: i }))
      );
      if (imgErr) throw new Error(`image insert failed for "${p.id}": ${imgErr.message}`);
      imageCount += uniqueImages.length;
    }

    console.log(`  ok ${p.id} -> base ${basePrice}, sale ${salePrice ?? '-'}, stock ${p.stock ?? 0}`);
  }

  console.log(`\nDone. ${productCount} products, ${variantCount} variants, ${imageCount} image rows.`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
