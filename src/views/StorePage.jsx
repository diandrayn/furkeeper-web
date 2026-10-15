import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router';
import {
  CalendarDays,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  Pencil,
  Scissors,
  Share2,
  Star,
  Store,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import ReviewCard from '../components/ReviewCard';
import RatingSummary from '../components/RatingSummary';
import EmptyState from '../components/EmptyState';
import PawLoader from '../components/decorative/PawLoader';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDateId, getInitials } from '../utils/status';
import { getRatingDistribution } from '../data/mockReviews';
import { supabase } from '../lib/supabaseClient';
import {
  fetchPublicStore,
  fetchStoreProducts,
  fetchStoreServices,
  fetchStoreReviews,
  fetchStoreCategories,
  fetchStoreServiceTypes,
  fetchStorePublicStats,
  StoreUnavailableError,
} from '../utils/stores';

const PAGE_SIZE = 12;
const TAB_STYLES = {
  active: 'border-b-2 border-brand-burgundy font-semibold text-brand-burgundy',
  idle: 'border-b-2 border-transparent text-text-secondary hover:text-brand-burgundy',
};

function interp(template, vars) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : '',
  );
}

export default function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { findOrCreateConversation } = useChat();

  const [store, setStore] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unavailable | notfound | error
  const [errorMsg, setErrorMsg] = useState('');
  const [tab, setTab] = useState('produk');

  // Product tab — paginated + filtered in the DB.
  const [products, setProducts] = useState({ rows: [], total: 0, offset: 0, loading: false, done: false });
  const [productQuery, setProductQuery] = useState({ search: '', category: '', sort: 'newest' });
  const [categories, setCategories] = useState([]);

  // Service tab.
  const [services, setServices] = useState({ rows: [], total: 0, offset: 0, loading: false, done: false });
  const [serviceQuery, setServiceQuery] = useState({ search: '', serviceType: '', sort: 'newest' });
  const [serviceTypes, setServiceTypes] = useState([]);

  // Reviews tab.
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState(0);

  // Header actions.
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [shareDone, setShareDone] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ category: 'penipuan', description: '' });
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setStore(null);
    setStats(null);
    setProducts({ rows: [], total: 0, offset: 0, loading: false, done: false });
    setServices({ rows: [], total: 0, offset: 0, loading: false, done: false });
    setProductQuery({ search: '', category: '', sort: 'newest' });
    setServiceQuery({ search: '', serviceType: '', sort: 'newest' });
    setReviews([]);
    setErrorMsg('');

    (async () => {
      try {
        const s = await fetchPublicStore(storeId);
        if (!active) return;
        setStore(s);
        setTab(s.kind === 'service' ? 'jasa' : 'produk');
        const [statsRes, cats, types, reviewsRes] = await Promise.all([
          fetchStorePublicStats(s.id),
          fetchStoreCategories(s.id),
          fetchStoreServiceTypes(s.id),
          fetchStoreReviews(s.id),
        ]);
        if (!active) return;
        setStats(statsRes);
        setCategories(cats);
        setServiceTypes(types);
        setReviews(reviewsRes);
        setStatus('ready');
      } catch (err) {
        if (!active) return;
        if (err instanceof StoreUnavailableError) setStatus('unavailable');
        else if (err.message === 'Toko tidak ditemukan') setStatus('notfound');
        else {
          setStatus('error');
          setErrorMsg(err.message || 'Gagal memuat toko.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    if (!store) return;
    let active = true;
    setProducts((p) => ({ ...p, loading: true }));
    fetchStoreProducts(store.id, { ...productQuery, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setProducts({ rows: res.rows, total: res.total, offset: res.rows.length, loading: false, done: res.rows.length >= res.total });
      })
      .catch(() => {
        if (active) setProducts((p) => ({ ...p, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [store, productQuery]);

  useEffect(() => {
    if (!store) return;
    let active = true;
    setServices((p) => ({ ...p, loading: true }));
    fetchStoreServices(store.id, { ...serviceQuery, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setServices({ rows: res.rows, total: res.total, offset: res.rows.length, loading: false, done: res.rows.length >= res.total });
      })
      .catch(() => {
        if (active) setServices((p) => ({ ...p, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [store, serviceQuery]);

  const loadMoreProducts = async () => {
    if (!store || products.loading || products.done) return;
    setProducts((p) => ({ ...p, loading: true }));
    try {
      const res = await fetchStoreProducts(store.id, { ...productQuery, offset: products.offset, limit: PAGE_SIZE });
      setProducts((p) => ({
        rows: [...p.rows, ...res.rows],
        total: res.total,
        offset: p.offset + res.rows.length,
        loading: false,
        done: p.rows.length + res.rows.length >= res.total,
      }));
    } catch {
      setProducts((p) => ({ ...p, loading: false }));
    }
  };

  const loadMoreServices = async () => {
    if (!store || services.loading || services.done) return;
    setServices((p) => ({ ...p, loading: true }));
    try {
      const res = await fetchStoreServices(store.id, { ...serviceQuery, offset: services.offset, limit: PAGE_SIZE });
      setServices((p) => ({
        rows: [...p.rows, ...res.rows],
        total: res.total,
        offset: p.offset + res.rows.length,
        loading: false,
        done: p.rows.length + res.rows.length >= res.total,
      }));
    } catch {
      setServices((p) => ({ ...p, loading: false }));
    }
  };

  const handleChat = async () => {
    if (!store) return;
    if (!isLoggedIn) {
      navigate('/login', {
        state: { from: { pathname: `/toko/${store.slug}` } },
      });
      return;
    }
    setChatError('');
    setChatLoading(true);
    try {
      const conversationId = await findOrCreateConversation(store.id, {
        type: 'store',
        thumbnail: store.logoUrl,
        title: store.name,
        linkTo: `/toko/${store.slug}`,
      });
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(err.message || 'Gagal membuka chat, coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2500);
    } catch {
      // clipboard unavailable — nothing to surface
    }
  };

  const openReport = () => {
    if (!store) return;
    if (!isLoggedIn) {
      navigate('/login', {
        state: { from: { pathname: `/toko/${store.slug}` } },
      });
      return;
    }
    setReportError('');
    setReportDone(false);
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!report.description.trim()) return;
    setReportSending(true);
    setReportError('');
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_store_id: store.id,
        category: report.category,
        description: report.description.trim(),
        priority: 'normal',
        status: 'baru',
      });
      setReportDone(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportDone(false);
        setReport({ category: 'penipuan', description: '' });
      }, 1600);
    } catch (err) {
      setReportError(err.message || 'Gagal mengirim laporan, coba lagi.');
    } finally {
      setReportSending(false);
    }
  };

  const isOwner = isLoggedIn && user?.id === store?.ownerId;
  const completedCount =
    store?.kind === 'service' ? stats?.completedBookings || 0 : stats?.completedOrders || 0;
  const locationText = [store?.district, store?.city].filter(Boolean).join(', ');
  const filteredReviews = reviewFilter ? reviews.filter((r) => r.rating === reviewFilter) : reviews;
  const reportCategoryOptions = [
    { value: 'penipuan', label: t('storePage.reportCatFraud') },
    { value: 'barang_tidak_sesuai', label: t('storePage.reportCatNotAsDescribed') },
    { value: 'jasa_tidak_selesai', label: t('storePage.reportCatServiceNotDone') },
    { value: 'pelecehan', label: t('storePage.reportCatHarassment') },
    { value: 'lainnya', label: t('storePage.reportCatOther') },
  ];
  const productSortOptions = [
    { value: 'newest', label: t('storePage.sortNewest') },
    { value: 'popular', label: t('storePage.sortPopular') },
    { value: 'price-asc', label: t('storePage.sortPriceAsc') },
    { value: 'price-desc', label: t('storePage.sortPriceDesc') },
  ];
  const serviceSortOptions = [
    { value: 'newest', label: t('storePage.sortNewest') },
    { value: 'rating', label: t('storePage.sortRating') },
    { value: 'price-asc', label: t('storePage.sortPriceAsc') },
    { value: 'price-desc', label: t('storePage.sortPriceDesc') },
  ];
  const tabs = [
    { id: 'produk', label: t('common.product') },
    { id: 'jasa', label: t('common.service') },
    { id: 'ulasan', label: t('storePage.reviews') },
    { id: 'tentang', label: t('storePage.aboutStore') },
  ];

  const renderMessagePage = (titleKey, subtitleKey) => (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{t(titleKey)}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t(subtitleKey)}</p>
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-brand-burgundy hover:underline">
          {t('storePage.backHome')}
        </Link>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-20">
          <PawLoader label={t('storePage.loading')} />
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  if (status === 'unavailable') return renderMessagePage('storePage.unavailableTitle', 'storePage.unavailableSubtitle');
  if (status === 'notfound') return renderMessagePage('storePage.notFoundTitle', 'storePage.notFoundSubtitle');
  if (status === 'error' || !store) {
    return renderMessagePage('storePage.notFoundTitle', errorMsg || 'storePage.notFoundSubtitle');
  }

  return (
    <>
      <Navbar activeLink={store.kind === 'service' ? 'Jasa' : 'Produk'} />

      {/* Banner (cover) */}
      <div className="relative">
        {store.bannerUrl ? (
          <img src={store.bannerUrl} alt={`Banner ${store.name}`} className="h-44 w-full object-cover md:h-56" />
        ) : (
          <div className="h-44 w-full bg-gradient-to-r from-brand-burgundy via-brand-burgundy to-[#2c3f8f] md:h-56" />
        )}
        {isOwner && (
          <Link
            to={store.kind === 'service' ? '/dashboard/jasa/profil' : '/dashboard/toko/profil'}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-semibold text-brand-burgundy shadow-sm transition-colors hover:bg-white"
          >
            <Pencil className="h-3.5 w-3.5" /> {t('storePage.editProfile')}
          </Link>
        )}

        {/* Avatar dipaku di tepi bawah banner (absolute), bukan negative margin,
            jadi ga bergantung layout di bawahnya dan pasti ga ketutup lagi. */}
        <div className="absolute -bottom-10 left-4 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white md:left-6">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={`Logo ${store.name}`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-brand-peach font-heading text-xl font-bold text-brand-burgundy">
              {getInitials(store.name)}
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-container px-4 pb-12 md:px-6 lg:px-8">
        {/* pt-10 = ruang buat avatar yang sekarang ditempel absolute di banner;
            sm:pl-24 = jarak dari kiri biar teks ga ketiban avatar dari sm ke atas */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 pt-10 sm:flex-row sm:items-start sm:pt-0 sm:pl-24">
            <div className="max-w-xl pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{store.name}</h1>
                {store.trusted && <Badge variant="trusted" label={t('storePage.verified')} />}
                {store.fastResponse && <Badge variant="fast-response" label={t('storePage.fastResponse')} />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-status-warning text-status-warning" />
                  {store.rating.toFixed(1) === '0.0' ? 'Baru' : store.rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  {interp(t('storePage.reviewCount'), { count: stats?.reviews ?? reviews.length })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {locationText || '—'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {t('storePage.joinedSince')} {formatDateId(store.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    store.isOpen ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {store.isOpen ? t('storePage.open') : t('storePage.closed')}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-peach px-3 py-1 text-xs font-semibold text-brand-burgundy">
                  {store.kind === 'service' ? <Scissors className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                  {store.kind === 'service' ? t('storePage.kindService') : t('storePage.kindSeller')}
                </span>
                <span className="text-xs text-text-secondary">
                  {interp(t('storePage.productCount'), { count: products.total })} ·{' '}
                  {interp(t('storePage.serviceCount'), { count: services.total })} ·{' '}
                  {interp(t('storePage.completedOrders'), { count: completedCount })}
                </span>
              </div>
            </div>
          </div>

          {/* Store actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="orange" onClick={handleChat} loading={chatLoading} playful={false} className="!px-4">
              <MessageCircle className="mr-1.5 h-4 w-4" />
              {t('storePage.chatStore')}
            </Button>
            <Button variant="outline" onClick={handleShare} playful={false} className="!px-3.5">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={openReport} playful={false} className="!px-3.5">
              <Flag className="h-4 w-4 text-status-danger" />
            </Button>
          </div>
          {(shareDone || chatError) && (
            <p className={`w-full text-sm md:text-right ${shareDone ? 'text-status-success' : 'text-status-danger'}`}>
              {shareDone ? t('storePage.shareDone') : chatError}
            </p>
          )}
        </div>

        {/* Description */}
        {(store.tagline || store.description) && (
          <div className="mt-5 max-w-3xl rounded-2xl bg-white p-5 shadow-sm">
            {store.tagline && <p className="font-heading text-base font-semibold text-text-primary">{store.tagline}</p>}
            {store.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{store.description}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-6 overflow-x-auto border-b border-gray-200">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 pb-3 text-sm transition-colors ${tab === item.id ? TAB_STYLES.active : TAB_STYLES.idle}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'produk' && (
          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                className="md:max-w-xs"
                placeholder={t('storePage.searchPlaceholder')}
                value={productQuery.search}
                onChange={(e) => setProductQuery((q) => ({ ...q, search: e.target.value }))}
              />
              <Select
                className="md:w-52"
                options={[{ value: '', label: t('storePage.allCategories') }, ...categories.map((c) => ({ value: c, label: c }))]}
                value={productQuery.category}
                onChange={(e) => setProductQuery((q) => ({ ...q, category: e.target.value }))}
              />
              <Select
                className="md:w-52"
                options={productSortOptions}
                value={productQuery.sort}
                onChange={(e) => setProductQuery((q) => ({ ...q, sort: e.target.value }))}
              />
            </div>
            {products.loading && products.rows.length === 0 ? (
              <PawLoader label={t('storePage.loading')} small />
            ) : products.rows.length === 0 ? (
              <EmptyState title={t('storePage.listingsEmptyTitle')} subtitle={t('storePage.listingsEmptySubtitle')} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {products.rows.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      storeName={store.name}
                      storeId={store.id}
                      storeLocation={store.district || store.location}
                      storeRating={store.rating}
                      storeTrusted={store.trusted}
                    />
                  ))}
                </div>
                {!products.done && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" onClick={loadMoreProducts} loading={products.loading} playful={false}>
                      {t('storePage.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'jasa' && (
          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                className="md:max-w-xs"
                placeholder={t('storePage.searchPlaceholder')}
                value={serviceQuery.search}
                onChange={(e) => setServiceQuery((q) => ({ ...q, search: e.target.value }))}
              />
              <Select
                className="md:w-52"
                options={[{ value: '', label: t('storePage.allTypes') }, ...serviceTypes.map((s) => ({ value: s, label: s }))]}
                value={serviceQuery.serviceType}
                onChange={(e) => setServiceQuery((q) => ({ ...q, serviceType: e.target.value }))}
              />
              <Select
                className="md:w-52"
                options={serviceSortOptions}
                value={serviceQuery.sort}
                onChange={(e) => setServiceQuery((q) => ({ ...q, sort: e.target.value }))}
              />
            </div>
            {services.loading && services.rows.length === 0 ? (
              <PawLoader label={t('storePage.loading')} small />
            ) : services.rows.length === 0 ? (
              <EmptyState title={t('storePage.listingsEmptyTitle')} subtitle={t('storePage.listingsEmptySubtitle')} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {services.rows.map((service) => (
                    <ServiceCard
                      key={service.id}
                      {...service}
                      providerName={store.name}
                      storeId={store.id}
                      trusted={store.trusted}
                      fastResponse={store.fastResponse}
                    />
                  ))}
                </div>
                {!services.done && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" onClick={loadMoreServices} loading={services.loading} playful={false}>
                      {t('storePage.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'ulasan' && (
          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <EmptyState title={t('storePage.reviews')} subtitle={t('storePage.noReviews')} />
            ) : (
              <>
                <RatingSummary
                  averageRating={reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length}
                  totalReviews={reviews.length}
                  distribution={getRatingDistribution(reviews)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFilter(star)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        reviewFilter === star
                          ? 'bg-brand-burgundy text-white'
                          : 'bg-brand-peach text-brand-burgundy hover:bg-brand-orange-start/20'
                      }`}
                    >
                      {star === 0 ? t('common.all') : `${star}★`}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {filteredReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      reviewerName={review.reviewerName}
                      reviewerAvatar={review.reviewerAvatar}
                      rating={review.rating}
                      date={review.date}
                      comment={review.comment}
                      reply={review.reply}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'tentang' && (
          <div className="mt-6 max-w-3xl space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-text-primary">{t('storePage.aboutStore')}</h3>
              {store.description ? (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{store.description}</p>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">—</p>
              )}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-text-primary">{t('storePage.address')}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                {store.address || t('storePage.noAddress')}
              </p>
              {locationText && <p className="mt-1 text-sm text-text-secondary">{locationText}</p>}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-text-primary">{t('storePage.businessHours')}</h3>
              {store.operatingHours.length === 0 ? (
                <p className="mt-2 text-sm text-text-secondary">—</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100 text-sm">
                  {store.operatingHours.map((row) => (
                    <li key={row.day} className="flex items-center justify-between py-2">
                      <span className="text-text-primary">{row.day}</span>
                      <span className="text-text-secondary">
                        {row.closed ? t('storePage.closed') : `${row.open} — ${row.close}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-text-primary">{t('storePage.storePolicy')}</h3>
              {store.storePolicy ? (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{store.storePolicy}</p>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">{t('storePage.noPolicy')}</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0 bg-black/40"
            onClick={() => setReportOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="font-heading text-lg font-bold text-text-primary">{t('storePage.reportTitle')}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t('storePage.reportDescription')}</p>
            <div className="mt-4 space-y-3">
              <Select
                options={reportCategoryOptions}
                value={report.category}
                onChange={(e) => setReport((r) => ({ ...r, category: e.target.value }))}
              />
              <Textarea
                rows={4}
                placeholder={t('storePage.reportPlaceholder')}
                value={report.description}
                onChange={(e) => setReport((r) => ({ ...r, description: e.target.value }))}
              />
              {reportError && <p className="text-xs text-status-danger">{reportError}</p>}
              {reportDone && <p className="text-xs text-status-success">{t('storePage.reportSubmitted')}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReportOpen(false)} playful={false}>
                  {t('common.cancel')}
                </Button>
                <Button variant="orange" onClick={submitReport} loading={reportSending} playful={false}>
                  {t('storePage.reportSubmit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}