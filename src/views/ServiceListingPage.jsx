import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/router';
import { Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Input from '../components/Input';
import FilterSidebar from '../components/FilterSidebar';
import SortDropdown, { PRODUCT_SORT_OPTIONS } from '../components/SortDropdown';
import Pagination from '../components/Pagination';
import ServiceCard from '../components/ServiceCard';
import EmptyState from '../components/EmptyState';
import { SERVICE_PAGE_SIZE, serviceTypes } from '../data/mockServices';
import { usePublicServices } from '../hooks/usePublicServices';
import { districts } from '../data/mockData';
import { filterAndSortItems } from '../utils/listing';

const PRICE_MAX = 500000;

const defaultFilters = {
  serviceTypes: [],
  priceMin: 0,
  priceMax: PRICE_MAX,
  rating: '',
  location: '',
};

export default function ServiceListingPage() {
  const [searchParams] = useSearchParams();
  // ?penyedia=Grooming%20Happy%20Paws — klik satu hasil pencarian jasa
  // terdekat langsung memfilter listing ke penyedia itu saja, jadi terasa
  // seperti membuka halaman jasa tersebut.
  const [query, setQuery] = useState(() => searchParams.get('penyedia') || '');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    location: searchParams.get('lokasi') || '',
  }));
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  // See ProductListingPage.jsx for why: keeps the default price ceiling
  // from silently hiding a real provider's service priced above it, as
  // long as the person hasn't manually touched the price slider.
  const [priceTouched, setPriceTouched] = useState(false);
  const { services } = usePublicServices();

  const priceCeiling = useMemo(
    () => services.reduce((max, s) => Math.max(max, s.priceFrom || 0), PRICE_MAX),
    [services],
  );

  useEffect(() => {
    if (priceTouched) return;
    setFilters((prev) => (prev.priceMax === priceCeiling ? prev : { ...prev, priceMax: priceCeiling }));
  }, [priceCeiling, priceTouched]);

  const filterSections = useMemo(
    () => [
      { id: 'serviceTypes', title: 'Jenis Layanan', type: 'checkbox', options: serviceTypes },
      { id: 'price', title: 'Rentang Harga', type: 'range', min: 0, max: priceCeiling },
      {
        id: 'rating',
        title: 'Rating',
        type: 'radio',
        options: [
          { value: 4.5, label: '4.5 ke atas' },
          { value: 4, label: '4.0 ke atas' },
          { value: 3.5, label: '3.5 ke atas' },
          { value: 3, label: '3.0 ke atas' },
        ],
      },
      { id: 'location', title: 'Lokasi', type: 'select', label: 'Kecamatan', options: districts },
    ],
    [priceCeiling],
  );

  const resetFilters = () => {
    setFilters({ ...defaultFilters, priceMax: priceCeiling });
    setPriceTouched(false);
    setQuery('');
    setPage(1);
  };

  const filtered = useMemo(
    () =>
      filterAndSortItems(services, {
        query,
        queryFields: ['name', 'providerName', 'serviceType'],
        filters,
        priceField: 'priceFrom',
        sort,
      }),
    [query, filters, sort, services],
  );

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * SERVICE_PAGE_SIZE, page * SERVICE_PAGE_SIZE);

  const handleFiltersChange = (next) => {
    if (next.priceMin !== filters.priceMin || next.priceMax !== filters.priceMax) {
      setPriceTouched(true);
    }
    setFilters(next);
    setPage(1);
  };

  return (
    <>
      <Navbar activeLink="Jasa" />
      <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">Jasa</h1>
        <p className="mt-1 text-sm text-text-secondary">Cari grooming, mandi, dan perawatan hewan terdekat.</p>

        <div className="mt-8 flex items-start gap-8">
          <FilterSidebar
            sections={filterSections}
            values={filters}
            onChange={handleFiltersChange}
            onReset={resetFilters}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-text-primary lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </button>
              <Input
                className="flex-1"
                placeholder="Cari jasa..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                icon={<Search className="h-4 w-4" />}
              />
              <SortDropdown
                className="sm:w-52"
                options={PRODUCT_SORT_OPTIONS}
                value={sort}
                onChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
              />
            </div>

            {pageItems.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  title="Jasa tidak ditemukan"
                  subtitle="Coba ubah atau reset filter kamu"
                  onReset={resetFilters}
                />
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((service) => (
                    <ServiceCard key={service.id} {...service} />
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination
                    page={page}
                    pageSize={SERVICE_PAGE_SIZE}
                    total={total}
                    itemLabel="jasa"
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
