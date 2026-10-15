'use client';

import NextLink from 'next/link';
import {
  useRouter, usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// Pengganti location.state React Router: disimpan sementara di memori browser.
let navState = null;
const pathOf = (to) => String(to).split(/[?#]/)[0];
const toHref = (to) =>
  typeof to === 'string' ? to : `${to?.pathname || ''}${to?.search || ''}${to?.hash || ''}`;

export function useParams() {
  const params = useNextParams() || {};
  return useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(params)) {
      try { out[k] = Array.isArray(v) ? v.map(decodeURIComponent) : decodeURIComponent(v); }
      catch { out[k] = v; }
    }
    return out;
  }, [params]);
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to, options = {}) => {
    if (typeof to === 'number') { to < 0 ? router.back() : router.forward(); return; }
    const href = toHref(to);
    navState = { path: pathOf(href), state: options.state };
    options.replace ? router.replace(href) : router.push(href);
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const qs = sp ? sp.toString() : '';
  const search = qs ? `?${qs}` : '';
  const state = navState && navState.path === pathname ? navState.state ?? null : null;
  return useMemo(
    () => ({ pathname, search, hash: '', state, key: `${pathname}${search}` }),
    [pathname, search, state],
  );
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const setSearchParams = useCallback((next, options = {}) => {
    const base = new URLSearchParams(sp ? sp.toString() : '');
    const value = typeof next === 'function' ? next(base) : next;
    const qs = new URLSearchParams(value).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    options.replace ? router.replace(url) : router.push(url);
  }, [router, pathname, sp]);
  return [sp || new URLSearchParams(), setSearchParams];
}

export function Link({ to, state, onClick, ...props }) {
  const href = toHref(to);
  return (
    <NextLink
      href={href}
      onClick={(e) => {
        navState = state !== undefined ? { path: pathOf(href), state } : null;
        if (onClick) onClick(e);
      }}
      {...props}
    />
  );
}

export function NavLink({ to, end, className, style, children, ...props }) {
  const pathname = usePathname();
  const target = pathOf(toHref(to));
  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  const resolve = (v) => (typeof v === 'function' ? v({ isActive, isPending: false }) : v);
  return (
    <Link to={to} className={resolve(className)} style={resolve(style)}
          aria-current={isActive ? 'page' : undefined} {...props}>
      {resolve(children)}
    </Link>
  );
}

export function Navigate({ to, replace, state }) {
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    navigate(to, { replace, state });
  }, [navigate, to, replace, state]);
  return null;
}
