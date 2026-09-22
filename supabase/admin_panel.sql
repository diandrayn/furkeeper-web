-- =========================================================================
-- FurKeeper — Admin panel migration
-- =========================================================================
-- Run this AFTER schema.sql (and the other supabase/*.sql files already in
-- this folder) in the Supabase SQL editor.
--
-- What this adds:
--   1. An 'admin' role on public.profiles, plus is_suspended/suspended_reason
--      columns so Admin can deactivate an account without deleting it.
--   2. public.is_admin() — a helper used by every policy below.
--   3. A trigger that stops a *non*-admin from promoting themselves to
--      admin, un-suspending themselves, or self-approving their own
--      mitra application by just calling profiles.update() from the app.
--      (Only Admin — verified server-side via is_admin() — may flip those
--      columns; this closes a gap that existed even before this file,
--      since the original "users can update own profile" policy didn't
--      restrict which columns a user could touch on their own row.)
--   4. Admin-only RLS policies so the panel can read/moderate data across
--      every store, not just rows the signed-in user owns.
--   5. At the bottom: how to promote a user to Admin (there's no self-serve
--      sign-up for it on purpose — do this manually, once, per admin).
--
-- Safe to run top-to-bottom once. Re-running is mostly idempotent (uses
-- `drop ... if exists` / `create or replace`) except the two `alter table
-- ... add column` statements, which will error on a second run — that's
-- fine, it just means this migration already applied.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. profiles: admin role + suspension flags
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'seller', 'service', 'admin'));

alter table public.profiles add column is_suspended boolean not null default false;
alter table public.profiles add column suspended_reason text;

-- profiles never stored the account's e-mail before — fine while every
-- screen only ever looked at *your own* row, but the Admin panel needs a
-- way to show who a pending application / user row belongs to without
-- being able to query auth.users directly (PostgREST never exposes that
-- schema, admin or not). Backfill existing rows, then keep it in sync via
-- the trigger below.
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- The original trigger only copied full_name + role from signup metadata —
-- seller_status / provider_status / business / partner_submitted_at (all
-- already columns on profiles) were left at their defaults, so the Admin
-- panel had nothing real to read. Replace it so a new mitra's application
-- actually lands in the profiles row the panel queries.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, full_name, email, role, seller_status, provider_status, business, partner_submitted_at
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'sellerStatus', 'none'),
    coalesce(new.raw_user_meta_data ->> 'providerStatus', 'none'),
    new.raw_user_meta_data -> 'business',
    nullif(new.raw_user_meta_data ->> 'partnerSubmittedAt', '')::timestamptz
  );
  return new;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- 2. is_admin() — used by every "admin can see/manage everything" policy
--    below. security definer + a fixed search_path so it can read
--    profiles regardless of the caller's own row-level policies.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Lock down the privileged columns on profiles: a plain
--    `.update({...})` from a non-admin account can no longer change role,
--    is_suspended, suspended_reason, or self-approve seller/provider
--    status. Admin (checked via is_admin(), not client input) bypasses
--    this entirely.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_privilege()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Hanya admin yang dapat mengubah role akun';
  end if;
  if new.is_suspended is distinct from old.is_suspended or new.suspended_reason is distinct from old.suspended_reason then
    raise exception 'Hanya admin yang dapat mengubah status suspend akun';
  end if;
  if new.seller_status is distinct from old.seller_status and new.seller_status = 'approved' then
    raise exception 'Hanya admin yang dapat menyetujui pendaftaran mitra';
  end if;
  if new.provider_status is distinct from old.provider_status and new.provider_status = 'approved' then
    raise exception 'Hanya admin yang dapat menyetujui pendaftaran mitra';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privilege on public.profiles;
create trigger trg_protect_profile_privilege
  before update on public.profiles
  for each row execute procedure public.protect_profile_privilege();

-- ---------------------------------------------------------------------
-- 4. Admin-only RLS policies
-- ---------------------------------------------------------------------
-- profiles: select is already public ("profiles are publicly readable" in
-- schema.sql). Admin additionally gets update rights on every row (the
-- trigger above still fences which columns a *non*-admin update may touch;
-- this policy is what lets an admin's update reach someone else's row).
create policy "admin updates all profiles" on public.profiles for update using (public.is_admin());

-- stores / products / services / service_packages: already publicly
-- readable — admin additionally gets update + delete on every row, not
-- just ones they own, for suspending a store or pulling down a listing.
create policy "admin updates all stores" on public.stores for update using (public.is_admin());
create policy "admin deletes all stores" on public.stores for delete using (public.is_admin());

create policy "admin updates all products" on public.products for update using (public.is_admin());
create policy "admin deletes all products" on public.products for delete using (public.is_admin());

create policy "admin updates all services" on public.services for update using (public.is_admin());
create policy "admin deletes all services" on public.services for delete using (public.is_admin());

create policy "admin writes all packages" on public.service_packages for all using (public.is_admin());

-- orders / order_items / bookings: not publicly readable at all today —
-- admin gets read access platform-wide (needed for the reports/overview
-- screen) plus the ability to correct a stuck status.
create policy "admin reads all orders" on public.orders for select using (public.is_admin());
create policy "admin updates all orders" on public.orders for update using (public.is_admin());
create policy "admin reads all order items" on public.order_items for select using (public.is_admin());
create policy "admin reads all bookings" on public.bookings for select using (public.is_admin());
create policy "admin updates all bookings" on public.bookings for update using (public.is_admin());

-- reviews: already publicly readable — admin can delete/edit ones that
-- violate the platform's rules (fake reviews, abuse, etc.).
create policy "admin updates all reviews" on public.reviews for update using (public.is_admin());
create policy "admin deletes all reviews" on public.reviews for delete using (public.is_admin());

-- partner_applications: kept for parity with the PRD's data model, even
-- though the current sign-up flow writes the application onto
-- profiles.seller_status/provider_status directly (see handle_new_user()
-- above) rather than inserting a row here.
create policy "admin reads all applications" on public.partner_applications for select using (public.is_admin());
create policy "admin updates all applications" on public.partner_applications for update using (public.is_admin());

-- notifications: lets the admin panel notify a user when their
-- application / listing / account status changes.
create policy "admin sends notifications" on public.notifications for insert with check (public.is_admin());

-- =========================================================================
-- 5. Promoting a user to Admin (do this manually, once, per admin — there
--    is no "register as admin" page on purpose):
--
--    update public.profiles set role = 'admin' where id =
--      (select id from auth.users where email = 'admin@furkeeper.test');
--
--    That single UPDATE is enough — the app reads role from this table on
--    every login (see AuthContext.jsx) and the admin panel guard checks it.
-- =========================================================================
