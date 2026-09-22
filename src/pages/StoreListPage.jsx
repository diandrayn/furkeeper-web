import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, MapPin, Scissors, Search, Star, Store, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import PawLoader from '../components/decorative/PawLoader';
import { useLanguage } from '../i18n/LanguageContext';
import { getInitials } from '../utils/status';
import { districts } from '../data/mockData';
import { fetchStoreList } from '../utils/stores';

const PAGE_SIZE = 12;
const DISTRICT_BY_KEY = Object.fromEntries(districts.map((d) => [d.toLowerCase(), d]));
const districtKey = (name) => (name || '').toLowerCase();

function interp(template, vars) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : '',
  );
}

const CHOICE_OPTIONS = { search: '', sort: 'newest', hasProducts: false, hasServices: false };

export default function StoreListPage() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();

  const [filter, setFilter] = useState({
    district: DISTRICT_BY_KEY[(params.get('kecamatan') || '').toLowerCase()] || '',
    search: params.get('q') || '',
    sort: params.get('sort') || 'newest',
    open: params.get('open') === '1',
    verified: params.get('verified') === '1',
    hasProducts: params.get('hasP') === '1',
    hasServices: params.get('hasS') === '1',
  });

  const [list, setList] = useState({ rows: [], total: 0, offset: 0, loading: true, done: false });

  const apply = (patch) => {
    const next = { ...filter, ...patch };
    const sp = new URLSearchParams();
    if (next.district) sp.set('kecamatan', districtKey(next.district));
    if (next.search) sp.set('q', next.search);
    if (next.sort && next.sort !== 'newest') sp.set('sort', next.sort);
    if (next.open) sp.set('open', '1');
    if (next.verified) sp.set('verified', '1');
    if (next.hasProducts) sp.set('hasP', '1');
    if (next.hasServices) sp.set('hasS', '1');
    setParams(sp, { replace: true });
    setFilter(next);
  };

  useEffect(() => {
    let active = true;
    setList((l) => ({ ...l, loading: true }));
    fetchStoreList({
      district: filter.district,
      search: filter.search,
      sort: filter.sort,
      onlyOpen: filter.open,
      onlyVerified: filter.verified,
      hasProducts: filter.hasProducts,
      hasServices: filter.hasServices,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (!active) return;
        setList({ rows: res.rows, total: res.total, offset: res.rows.length, loading: false, done: res.rows.length >= res.total });
      })
      .catch(() => {
        if (active) setList((l) => ({ ...l, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [filter]);

  const loadMore = async () => {
    if (list.loading || list.done) return;
    setList((l) => ({ ...l, loading: true }));
    try {
      const res = await fetchStoreList({
        district: filter.district,
        search: filter.search,
        sort: filter.sort,
        onlyOpen: filter.open,
        onlyVerified: filter.verified,
        hasProducts: filter.hasProducts,
        hasServices: filter.hasServices,
        limit: PAGE_SIZE,
        offset: list.offset,
      });
      setList((l) => ({
        rows: [...l.rows, ...res.rows],
        total: res.total,
        offset: l.offset + res.rows.length,
        loading: false,
        done: l.rows.length + res.rows.length >= res.total,
      }));
    } catch {
      setList((l) => ({ ...l, loading: false }));
    }
  };

  const sortOptions = [
    { value: 'newest', label: t('storeList.sortNewest') },
    { value: 'rating', label: t('storeList.sortRating') },
    { value: 'name', label: t('storeList.sortNearest') },
  ];

  const toggle = (key) => apply({ [key]: !filter[key] });

  return (
    <>
      <Navbar activeLink="Produk" />
      <main className="mx-auto max-w-container px-4 py-10 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">
          {t('storeList.title')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t('storeList.subtitle')}</p>

        {/* Filter bar */}
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              className="lg:max-w-xs lg:flex-1"
              placeholder={t('storeList.searchPlaceholder')}
              value={filter.search}
              onChange={(e) => apply({ search: e.target.value })}
              icon={<Search className="h-4 w-4" />}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select
                className="w-44"
                options={[{ value: '', label: t('common.allDistricts') }, ...districts.map((d) => ({ value: d, label: d }))]}
                value={filter.district}
                onChange={(e) => apply({ district: e.target.value })}
              />
              <Select
                className="w-44"
                options={sortOptions}
                value={filter.sort}
                onChange={(e) => apply({ sort: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[
              { key: 'open', label: t('storeList.filterOpen') },
              { key: 'verified', label: t('storeList.filterVerified') },
              { key: 'hasProducts', label: t('storeList.filterHasProducts') },
              { key: 'hasServices', label: t('storeList.filterHasServices') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter[item.key]
                    ? 'bg-brand-burgundy text-white'
                    : 'bg-brand-peach text-brand-burgundy hover:bg-brand-orange-start/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Active district chip */}
          {filter.district && (
            <div className="mt-3 flex items-center gap-2 rounded-full bg-brand-burgundy/5 px-3 py-1.5 text-sm">
              <MapPin className="h-4 w-4 text-brand-burgundy" />
              <span className="font-semibold text-brand-burgundy">{filter.district}</span>
              <button
                type="button"
                aria-label={t('common.delete')}
                onClick={() => apply({ district: '' })}
                className="rounded-full p-0.5 text-brand-burgundy/70 transition-colors hover:bg-brand-burgundy/10 hover:text-brand-burgundy"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Result count */}
        <p className="mt-5 text-sm font-medium text-text-secondary">
          {filter.district
            ? interp(t('storeList.resultCount'), { count: list.total, district: filter.district })
            : interp(t('storeList.resultCountAll'), { count: list.total })}
        </p>

        {/* List */}
        {list.loading && list.rows.length === 0 ? (
          <PawLoader label={t('storeList.loading')} />
        ) : list.rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={filter.district ? t('storeList.emptyTitleDistrict') : t('storeList.emptyTitleAll')}
              subtitle={filter.district ? t('storeList.emptySubtitleDistrict') : t('storeList.emptySubtitleAll')}
              resetLabel={t('storeList.emptyAction')}
              onReset={() => apply({ ...CHOICE_OPTIONS, district: '' })}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.rows.map((s) => (
                <Link
                  key={s.id}
                  to={`/toko/${s.slug}`}
                  className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-peach">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={`Logo ${s.name}`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-heading text-base font-bold text-brand-burgundy">{getInitials(s.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-heading font-bold text-text-primary group-hover:text-brand-burgundy">
                          {s.name}
                        </p>
                        {s.trusted && <Badge variant="trusted" label={t('storePage.verified')} />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          {s.kind === 'service' ? <Scissors className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                          {s.kind === 'service' ? t('storePage.kindService') : t('storePage.kindSeller')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
                          {s.rating.toFixed(1) === '0.0' ? 'Baru' : s.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-text-secondary">
                      <MapPin className="h-3.5 w-3.5" />
                      {[s.district, s.city].filter(Boolean).join(', ') || '—'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                        s.isOpen ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {s.isOpen ? t('storePage.open') : t('storePage.closed')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    {interp(t('storePage.productCount'), { count: s.productCount })} ·{' '}
                    {interp(t('storePage.serviceCount'), { count: s.serviceCount })}
                  </p>
                </Link>
              ))}
            </div>
            {!list.done && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={loadMore} loading={list.loading} playful={false}>
                  {t('storeList.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}