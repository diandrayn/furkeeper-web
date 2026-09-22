-- =========================================================================
-- FurKeeper — Kelola Kategori migration
-- =========================================================================
-- Run this AFTER schema.sql AND admin_panel.sql (relies on public.is_admin()
-- added there) in the Supabase SQL editor.
--
-- What this adds:
--   1. public.product_categories and public.service_categories — kept as
--      two separate tables (not one shared table), per the spec's explicit
--      note that produk and jasa taxonomies differ and shouldn't be mixed.
--      Each supports one level of subcategory via a self-referencing
--      parent_id (a subcategory's parent_id points at a top-level row in
--      the same table; a subcategory cannot itself have children).
--   2. RLS: anyone can read (categories are shown on public listing pages),
--      only Admin can create/update/delete.
--
-- NOTE — scope: this migration only adds the category *master data* and
-- the admin CRUD screen for it. public.products.category and
-- public.services.service_type (schema.sql) are still free-text columns;
-- wiring the seller/provider "add product/service" forms and the public
-- listing/filter pages to pull from these new tables instead of free text
-- is a bigger, separate change and is NOT done by this migration.
--
-- Safe to run top-to-bottom once. Re-running errors on the `create table`
-- statements — that's fine, it just means this migration already applied.
-- =========================================================================

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.service_categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_categories_parent_idx on public.product_categories (parent_id, sort_order);
create index service_categories_parent_idx on public.service_categories (parent_id, sort_order);

alter table public.product_categories enable row level security;
alter table public.service_categories enable row level security;

create policy "anyone reads product categories" on public.product_categories for select using (true);
create policy "admin writes product categories" on public.product_categories for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads service categories" on public.service_categories for select using (true);
create policy "admin writes service categories" on public.service_categories for all using (public.is_admin()) with check (public.is_admin());
