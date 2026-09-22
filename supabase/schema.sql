-- =========================================================================
-- FurKeeper — Supabase schema
-- =========================================================================
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)
-- on a fresh project. Auth (sign up / login / Google) already works out of
-- the box via `supabase.auth` (see src/lib/supabaseClient.js and
-- src/utils/api.js) — this file adds the marketplace data that currently
-- lives in src/data/mock*.js so the app can eventually read/write real data
-- instead of the in-memory mocks.
--
-- Safe to run top-to-bottom on an empty project. Re-running is NOT
-- idempotent (tables will already exist) — drop them first if you need to
-- reset during development.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles — mirrors auth.users, holds the app-specific fields that
-- currently live in Supabase Auth user_metadata (role, sellerStatus, etc).
-- One row per user, created automatically by the trigger below.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'service')),
  seller_status text not null default 'none' check (seller_status in ('none', 'pending', 'approved', 'rejected')),
  provider_status text not null default 'none' check (provider_status in ('none', 'pending', 'approved', 'rejected')),
  business jsonb,
  partner_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  -- Salin metadata status mitra dari signup (bukan hanya full_name + role):
  -- tanpa ini, seller/service baru mendarat dengan seller_status/provider_status
  -- 'none' di profiles, padahal user_metadata-nya 'pending' — aplikasi membaca
  -- status dari profiles, sehingga penjual baru terlihat "belum ada pengajuan"
  -- dan terus disuruh daftar. (admin_panel.sql mengganti fungsi ini dengan versi
  -- yang juga menyalin kolom email.)
  insert into public.profiles (id, full_name, role, seller_status, provider_status, business, partner_submitted_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'sellerStatus', 'none'),
    coalesce(new.raw_user_meta_data ->> 'providerStatus', 'none'),
    new.raw_user_meta_data -> 'business',
    nullif(new.raw_user_meta_data ->> 'partnerSubmittedAt', '')::timestamptz
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- addresses — src/context/AddressContext.jsx
-- ---------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  full_address text not null,
  city text,
  district text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- pets — src/data/mockPets.js / src/context/PetContext.jsx
-- ---------------------------------------------------------------------
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null,       -- 'Kucing' | 'Anjing' | 'Hewan Lain'
  breed text,
  age text,
  weight text,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- stores / providers — the seller & service-provider business profile,
-- created once a partner application is approved.
-- ---------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('seller', 'service')),
  name text not null,
  description text,
  tagline text,
  category text,
  location text,
  district text,
  city text,
  phone text,
  email text,
  address text,
  home_service boolean not null default false,
  is_open boolean not null default true,
  operating_hours jsonb not null default '[]'::jsonb,
  logo_url text,
  banner_url text,
  trusted boolean not null default false,
  fast_response boolean not null default false,
  rating numeric(2,1) default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products — src/data/mockProducts.js / dashboard/DashboardProductsPage
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null,       -- 'Makanan' | 'Aksesoris' | 'Perlengkapan'
  pet_type text not null,       -- 'Kucing' | 'Anjing' | 'Hewan Lain'
  description text,
  price integer not null,
  original_price integer,
  discount_percent integer,
  variants text[] default '{}',
  badge text,                   -- 'Terlaris' | 'Baru' | null
  image_url text,
  stock integer not null default 0,
  rating numeric(2,1) default 0,
  sold_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- services + service_packages — src/data/mockServices.js
-- ---------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  service_type text not null,   -- 'Mandi' | 'Potong Bulu' | 'Grooming Lengkap'
  description text,
  price_from integer not null,
  distance_or_location text,
  image_url text,
  rating numeric(2,1) default 0,
  review_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  name text not null,
  description text,
  price integer not null,
  duration text
);

-- ---------------------------------------------------------------------
-- orders / order_items — CartPage, CheckoutPage, HistoryPage
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  address_id uuid references public.addresses (id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_method text,
  subtotal integer not null,
  shipping_cost integer not null default 0,
  total integer not null,
  tracking_number text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  store_id uuid references public.stores (id),
  name text not null,
  variant text,
  price integer not null,
  quantity integer not null default 1
);

-- ---------------------------------------------------------------------
-- bookings — BookingPage, dashboard/DashboardBookingsPage
-- ---------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  service_package_id uuid references public.service_packages (id),
  pet_id uuid references public.pets (id),
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_date date not null,
  scheduled_time text not null,
  price integer not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- reviews — DashboardReviewsPage, ProductDetailPage, ServiceDetailPage
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id),
  service_id uuid references public.services (id),
  order_id uuid references public.orders (id),
  booking_id uuid references public.bookings (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  reply text,
  created_at timestamptz not null default now(),
  constraint review_target_check check (
    (product_id is not null and service_id is null) or
    (product_id is null and service_id is not null)
  )
);

-- ---------------------------------------------------------------------
-- chat — ChatContext.jsx, ChatPage, dashboard/DashboardChatPage
-- ---------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (buyer_id, store_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  content text not null,
  attachment_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- notifications — NotificationContext.jsx
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- partner_applications — RegisterPartnerPage / ResubmitApplicationPage /
-- ApplicationStatusPage
-- ---------------------------------------------------------------------
create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('seller', 'service')),
  business_name text not null,
  documents jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.pets enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.partner_applications enable row level security;

-- profiles: everyone can read (needed to show store/seller names publicly),
-- only the owner can edit their own row.
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

-- addresses / pets: fully private to the owner.
create policy "own addresses" on public.addresses for all using (auth.uid() = user_id);
create policy "own pets" on public.pets for all using (auth.uid() = owner_id);

-- stores: public read, owner-only write.
create policy "stores are publicly readable" on public.stores for select using (true);
create policy "owner manages store" on public.stores for insert with check (auth.uid() = owner_id);
create policy "owner updates store" on public.stores for update using (auth.uid() = owner_id);
create policy "owner deletes store" on public.stores for delete using (auth.uid() = owner_id);

-- products / services / packages: public read, only the owning store can write.
create policy "products are publicly readable" on public.products for select using (true);
create policy "store owner writes products" on public.products for insert
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "store owner updates products" on public.products for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "store owner deletes products" on public.products for delete
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

create policy "services are publicly readable" on public.services for select using (true);
create policy "store owner writes services" on public.services for insert
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "store owner updates services" on public.services for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "store owner deletes services" on public.services for delete
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

create policy "packages are publicly readable" on public.service_packages for select using (true);
create policy "store owner writes packages" on public.service_packages for all
  using (exists (
    select 1 from public.services sv join public.stores s on s.id = sv.store_id
    where sv.id = service_id and s.owner_id = auth.uid()
  ));

-- orders / order_items: buyer sees their own orders; the selling store sees
-- orders containing their products.
create policy "buyer reads own orders" on public.orders for select using (auth.uid() = buyer_id);
create policy "buyer creates own orders" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "buyer updates own orders" on public.orders for update using (auth.uid() = buyer_id);

create policy "buyer reads own order items" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "store reads its order items" on public.order_items for select
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy "buyer inserts own order items" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- bookings: buyer + the service's store owner.
create policy "buyer manages own bookings" on public.bookings for all using (auth.uid() = buyer_id);
create policy "store reads its bookings" on public.bookings for select
  using (exists (
    select 1 from public.services sv join public.stores s on s.id = sv.store_id
    where sv.id = service_id and s.owner_id = auth.uid()
  ));

-- reviews: public read, only the author can write/edit their own.
create policy "reviews are publicly readable" on public.reviews for select using (true);
create policy "author writes own review" on public.reviews for insert with check (auth.uid() = author_id);
create policy "author updates own review" on public.reviews for update using (auth.uid() = author_id);

-- chat: only the two participants (buyer + store owner) can read/write.
create policy "participants read conversation" on public.conversations for select
  using (auth.uid() = buyer_id or exists (
    select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()
  ));
create policy "buyer starts conversation" on public.conversations for insert with check (auth.uid() = buyer_id);

create policy "participants read messages" on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or exists (
        select 1 from public.stores s where s.id = c.store_id and s.owner_id = auth.uid()
      ))
  ));
create policy "participants send messages" on public.messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or exists (
        select 1 from public.stores s where s.id = c.store_id and s.owner_id = auth.uid()
      ))
  ));

-- notifications: private to the recipient.
create policy "own notifications" on public.notifications for all using (auth.uid() = user_id);

-- partner applications: private to the applicant (admin review happens via
-- the Supabase dashboard / a service-role key, not through RLS).
create policy "own applications" on public.partner_applications for select using (auth.uid() = user_id);
create policy "own applications insert" on public.partner_applications for insert with check (auth.uid() = user_id);
