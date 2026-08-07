create or replace function public.admin_moderate_review(
  p_review_id uuid,
  p_decision public.review_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.review_status;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select status into v_old_status from public.reviews where id = p_review_id;
  if not found then
    raise exception 'Review not found';
  end if;

  -- Direct UPDATE, not through reviews_before_write's is_staff() branch
  -- concerns: that trigger already lets staff set status freely (see Phase
  -- 2), this RPC just adds the authorization message + audit trail.
  update public.reviews set status = p_decision where id = p_review_id;

  perform public.write_audit_log(
    'review_moderated', 'review', p_review_id::text,
    jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_decision), null
  );

  return jsonb_build_object('review_id', p_review_id, 'status', p_decision);
end;
$$;
