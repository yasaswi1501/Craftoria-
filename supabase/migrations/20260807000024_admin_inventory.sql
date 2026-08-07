-- Staff-facing stock adjustment (new shipment arrived, damaged-goods
-- write-off, stock count correction). Deliberately separate from the
-- reserve_stock/commit_stock/release_stock trio (Phase 2) -- those exist to
-- keep the checkout path race-free and are internal-only; this is a manual,
-- audited correction to available_quantity, not part of any order flow.
create or replace function public.admin_adjust_inventory(
  p_variant_id uuid,
  p_delta int,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before int;
  v_after int;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;
  if p_delta = 0 then
    raise exception 'delta must be non-zero';
  end if;

  select available_quantity into v_before from public.inventory where product_variant_id = p_variant_id for update;
  if not found then
    raise exception 'Inventory row not found for variant %', p_variant_id;
  end if;

  v_after := v_before + p_delta;
  if v_after < 0 then
    raise exception 'Adjustment would take available stock negative (currently %, delta %)', v_before, p_delta;
  end if;

  update public.inventory set available_quantity = v_after where product_variant_id = p_variant_id;

  perform public.write_audit_log(
    'inventory_adjusted', 'inventory', p_variant_id::text,
    jsonb_build_object('available_quantity', v_before),
    jsonb_build_object('available_quantity', v_after),
    jsonb_build_object('delta', p_delta, 'reason', p_reason)
  );

  return jsonb_build_object('variant_id', p_variant_id, 'available_quantity', v_after);
end;
$$;
