-- ============================================================
-- vendor_invite_codes
-- ============================================================
create table if not exists vendor_invite_codes (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references vendors(id) on delete cascade,
  invite_code   text not null unique,
  email_sent_to text not null,
  is_used       boolean not null default false,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  used_at       timestamptz
);

create index if not exists vendor_invite_codes_vendor_id_idx
  on vendor_invite_codes(vendor_id);

create index if not exists vendor_invite_codes_invite_code_idx
  on vendor_invite_codes(invite_code);

-- ============================================================
-- reviews
-- ============================================================
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references "user"(id) on delete cascade,
  vendor_id   uuid not null references vendors(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now(),
  -- one review per order
  unique (order_id)
);

create index if not exists reviews_vendor_id_idx
  on reviews(vendor_id);

create index if not exists reviews_customer_id_idx
  on reviews(customer_id);

-- ============================================================
-- states_and_cities
-- ============================================================
create table if not exists states_and_cities (
  id            uuid primary key default gen_random_uuid(),
  state_code    text not null,
  state_name    text not null,
  city_name     text not null,
  is_major_city boolean not null default false,
  sort_order    integer not null default 0,
  unique (state_code, city_name)
);

create index if not exists states_and_cities_state_code_idx
  on states_and_cities(state_code);

-- ============================================================
-- event_attendees
-- ============================================================
create table if not exists event_attendees (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid not null references "user"(id) on delete cascade,
  status     text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_attendees_event_id_idx
  on event_attendees(event_id);

create index if not exists event_attendees_user_id_idx
  on event_attendees(user_id);
