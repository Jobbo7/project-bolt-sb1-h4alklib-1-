begin;

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  offer_id text not null references public.seller_offers(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','FINALIZED','RELEASED','EXPIRED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, offer_id)
);

create index if not exists stock_reservations_offer_active_idx
  on public.stock_reservations (offer_id, status, expires_at);

alter table public.stock_reservations enable row level security;

revoke all on public.stock_reservations from anon, authenticated;

create or replace function public.reserve_order_stock(
  p_order_id uuid,
  p_items jsonb,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_offer_id text;
  v_quantity integer;
  v_stock integer;
  v_reserved integer;
begin
  if p_expires_at <= now() then
    raise exception 'INVALID_RESERVATION_EXPIRY';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_RESERVATION_ITEMS';
  end if;

  perform 1
  from public.seller_offers
  where id in (
    select value ->> 'offerId'
    from jsonb_array_elements(p_items)
  )
  order by id
  for update;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
    order by value ->> 'offerId'
  loop
    v_offer_id := v_item ->> 'offerId';
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_offer_id is null
       or v_offer_id = ''
       or v_quantity is null
       or v_quantity <= 0 then
      raise exception 'INVALID_RESERVATION_ITEM';
    end if;

    select stock
    into v_stock
    from public.seller_offers
    where id = v_offer_id;

    if v_stock is null then
      raise exception 'OFFER_NOT_FOUND';
    end if;

    select coalesce(sum(quantity), 0)
    into v_reserved
    from public.stock_reservations
    where offer_id = v_offer_id
      and status = 'ACTIVE'
      and expires_at > now();

    if (v_stock - v_reserved) < v_quantity then
      raise exception 'INSUFFICIENT_AVAILABLE_STOCK';
    end if;
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    insert into public.stock_reservations (
      order_id,
      offer_id,
      quantity,
      status,
      expires_at
    )
    values (
      p_order_id,
      v_item ->> 'offerId',
      (v_item ->> 'quantity')::integer,
      'ACTIVE',
      p_expires_at
    );
  end loop;
end;
$$;

revoke all on function public.reserve_order_stock(
  uuid,
  jsonb,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.reserve_order_stock(
  uuid,
  jsonb,
  timestamptz
) to service_role;

create or replace function public.release_order_stock(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stock_reservations
  set
    status = 'RELEASED',
    updated_at = now()
  where order_id = p_order_id
    and status = 'ACTIVE';
end;
$$;

revoke all on function public.release_order_stock(
  uuid
) from public, anon, authenticated;

grant execute on function public.release_order_stock(
  uuid
) to service_role;

create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_paid_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation record;
  v_order_status text;
begin
  select status
  into v_order_status
  from public.orders
  where id = p_order_id
    and stripe_checkout_session_id = p_session_id
  for update;

  if v_order_status is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order_status = 'PAID' then
    return;
  end if;

  if v_order_status <> 'PAYMENT_PENDING' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  for v_reservation in
    select offer_id, quantity
    from public.stock_reservations
    where order_id = p_order_id
      and status = 'ACTIVE'
    order by offer_id
    for update
  loop
    update public.seller_offers
    set stock = stock - v_reservation.quantity
    where id = v_reservation.offer_id
      and stock >= v_reservation.quantity;

    if not found then
      raise exception 'STOCK_FINALIZATION_FAILED';
    end if;
  end loop;

  update public.stock_reservations
  set
    status = 'FINALIZED',
    updated_at = now()
  where order_id = p_order_id
    and status = 'ACTIVE';

  update public.orders
  set
    status = 'PAID',
    stripe_payment_intent_id = p_payment_intent_id,
    paid_at = p_paid_at,
    updated_at = now()
  where id = p_order_id
    and status = 'PAYMENT_PENDING'
    and stripe_checkout_session_id = p_session_id;

  if not found then
    raise exception 'ORDER_UPDATE_CONFLICT';
  end if;
end;
$$;

revoke all on function public.finalize_paid_order(
  uuid,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_paid_order(
  uuid,
  text,
  text,
  timestamptz
) to service_role;

commit;