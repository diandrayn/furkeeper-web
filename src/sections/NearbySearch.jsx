import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Star, ChevronDown, ArrowRight } from 'lucide-react';
import { districts } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';
import { getInitials } from '../utils/status';
import { fetchStoreList } from '../utils/stores';
import PawLoader from '../components/decorative/PawLoader';

const districtKey = (name) => (name || '').toLowerCase();

function interp(template, vars) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : '',
  );
}

export default function NearbySearch() {
  const [district, setDistrict] = useState('Klojen');
  const [stores, setStores] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Real stores from the `stores` table, filtered by district in the DB —
  // only stores owned by non-suspended users appear (search_stores RPC).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchStoreList({ district, limit: 6, sort: 'rating' })
      .then((res) => {
        if (!active) return;
        setStores(res.rows);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Gagal memuat toko.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [district]);

  return (
    <section id="sekitar" className="mx-auto max-w-container px-4 py-16 scroll-mt-20 md:px-6 md:py-20 lg:px-8 lg:py-24">
      <div className="rounded-3xl bg-gradient-to-br from-brand-orange-start to-brand-orange-end px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            {t('nearbySearch.title')}
          </h2>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            {t('nearbySearch.subtitle')}
          </p>

          <div className="relative mx-auto mt-8 max-w-md">
            <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-md">
              <MapPin className="h-5 w-5 shrink-0 text-brand-orange-end" aria-hidden="true" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex-1 appearance-none bg-transparent text-sm font-medium text-text-primary outline-none"
                aria-label={t('nearbySearch.selectLabel')}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto mt-8 max-w-4xl">
            <PawLoader label={t('nearbySearch.loading')} />
          </div>
        ) : error ? (
          <p className="mt-8 text-center text-sm text-white/90">{error}</p>
        ) : stores.length === 0 ? (
          <p className="mt-8 text-center text-sm text-white/90">{t('nearbySearch.empty')}</p>
        ) : (
          <>
            <p className="mt-8 text-center text-sm font-medium text-white/90">
              {interp(t('nearbySearch.resultCount'), { count: total, district })}
            </p>

            <div className="mx-auto mt-4 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
              {stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => navigate(`/toko/${store.slug}`)}
                  className="playful-interactive flex items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-peach">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={`Logo ${store.name}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-heading text-xs font-bold text-brand-burgundy">{getInitials(store.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary">{store.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin className="h-3 w-3" />
                      {[store.district, store.city].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
                      <span className="text-xs font-medium text-text-primary">
                        {store.rating.toFixed(1) === '0.0' ? 'Baru' : store.rating.toFixed(1)}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        store.isOpen
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-status-danger/10 text-status-danger'
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {store.isOpen ? t('storePage.open') : t('storePage.closed')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate(`/toko?kecamatan=${districtKey(district)}`)}
            className="inline-flex items-center gap-1 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-80"
          >
            {t('nearbySearch.seeAllIn')} {district}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}