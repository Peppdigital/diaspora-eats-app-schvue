-- ============================================================
-- Extend vendors table
-- ============================================================
alter table vendors
  add column if not exists vendor_type          text check (vendor_type in ('restaurant', 'grocery')),
  add column if not exists tagline              text,
  add column if not exists diaspora_focus       text[],
  add column if not exists cuisines             text[],
  add column if not exists phone                text,
  add column if not exists email                text,
  add column if not exists website_url          text,
  add column if not exists instagram_handle     text,
  add column if not exists address_line1        text,
  add column if not exists address_line2        text,
  add column if not exists state                text,
  add column if not exists zip_code             text,
  add column if not exists country              text default 'US',
  add column if not exists latitude             numeric,
  add column if not exists longitude            numeric,
  add column if not exists onboarding_status    text default 'pending'
    check (onboarding_status in ('pending', 'invited', 'claimed', 'active')),
  add column if not exists created_by_admin     boolean not null default false,
  add column if not exists opening_hours        text,
  add column if not exists offers_dine_in       boolean not null default false,
  add column if not exists offers_pickup        boolean not null default true,
  add column if not exists offers_delivery      boolean not null default true,
  add column if not exists delivery_partners    text[] not null default '{}',
  add column if not exists avg_price_level      text check (avg_price_level in ('$', '$$', '$$$'));

-- ============================================================
-- Extend events table
-- ============================================================
alter table events
  add column if not exists subtitle             text,
  add column if not exists event_type           text
    check (event_type in ('Brunch', 'Festival', 'Pop-up', 'Market', 'Tasting', 'Party', 'Meetup')),
  add column if not exists diaspora_focus       text[],
  add column if not exists cuisines_highlighted text[],
  add column if not exists state                text,
  add column if not exists venue_address_line2  text,
  add column if not exists venue_zip            text,
  add column if not exists latitude             numeric,
  add column if not exists longitude            numeric,
  add column if not exists is_all_day           boolean not null default false,
  add column if not exists is_online            boolean not null default false,
  add column if not exists linked_vendor_id     uuid references vendors(id) on delete set null,
  add column if not exists capacity             integer,
  add column if not exists ticket_required      boolean not null default false,
  add column if not exists is_featured          boolean not null default false;

-- ============================================================
-- Extend menu_items table
-- ============================================================
alter table menu_items
  add column if not exists diaspora_segment_tag text,
  add column if not exists cuisine_tag          text,
  add column if not exists spicy_level          text not null default 'None'
    check (spicy_level in ('None', 'Mild', 'Medium', 'Hot', 'Extra Hot')),
  add column if not exists is_vegetarian        boolean not null default false,
  add column if not exists is_vegan             boolean not null default false,
  add column if not exists is_gluten_free       boolean not null default false;

-- ============================================================
-- Extend orders table
-- ============================================================
alter table orders
  add column if not exists order_number           text,
  add column if not exists order_type             text not null default 'delivery'
    check (order_type in ('pickup', 'delivery')),
  add column if not exists tax_amount             numeric not null default 0,
  add column if not exists service_fee            numeric not null default 0,
  add column if not exists payment_status         text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  add column if not exists payment_provider       text,
  add column if not exists payment_reference_id   text,
  add column if not exists delivery_address_line2 text,
  add column if not exists delivery_city          text,
  add column if not exists delivery_state         text,
  add column if not exists delivery_zip           text,
  add column if not exists estimated_ready_time   timestamptz;

-- ============================================================
-- Extend order_items table
-- ============================================================
alter table order_items
  add column if not exists line_total numeric;

-- Backfill line_total for existing rows
update order_items set line_total = price * quantity where line_total is null;
