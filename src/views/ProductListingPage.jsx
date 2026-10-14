import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Input from '../components/Input';
import FilterSidebar from '../components/FilterSidebar';
import SortDropdown, { PRODUCT_SORT_OPTIONS } from '../components/SortDropdown';
import Pagination from '../components/Pagination';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { PRODUCT_PAGE_SIZE, productCategories, petTypeFilters } from '../data/mockProducts';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { districts } from '../data/mockData';
import { filterAndSortItems } from '../utils/listing';

const PRICE_MAX = 1000000;

const defaultFilters = {
  categories: [],
  petTypes: [],
  priceMin: 0,
  priceMax: PRICE_MAX,
  rating: '',
  location: '',
};

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  // Preset dari link "Punya Hewan Apa" / "Cari Toko di Sekitarmu" di
  // Beranda (?jenisHewan=Kucing / ?lokasi=Klojen / ?toko=PawShop%20Klojen —
  // klik satu hasil pencarian toko terdekat langsung memfilter listing ke
  // toko itu saja, jadi terasa seperti membuka halaman toko tersebut).
  const [query, setQuery] = useState(() => searchParams.get('toko') || '');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState(() => {
    const jenisHewan = searchParams.get('jenisHewan');
    const lokasi = searchParams.get('lokasi');
    return {
      ...defaultFilters,
      petTypes: jenisHewan ? [jenisHewan] : [],
      location: lokasi || '',
    };
  });
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlist, setWishlist] = useState({});
  // The price filter defaults to PRICE_MAX (Rp 1.000.000) so the slider has
  // somewhere to start — but that used to silently hide any real seller
  // product priced above it, since the default filter was applied even
  // when the seller never touched the price slider themselves. We track
  // whether they've actually touched it, and if not, keep raising the
  // ceiling (both the slider's range and the applied filter) to fit
  // whatever real products come in.
  const [priceTouched, setPriceTouched] = useState(false);
  const { products } = usePublicProducts();

  const priceCeiling = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.price || 0), PRICE_MAX),
    [products],
  );

  useEffect(() => {
    if (priceTouched) return;
    setFilters((prev) => (prev.priceMax === priceCeiling ? prev : { ...prev, priceMax: priceCeiling }));
  }, [priceCeiling, priceTouched]);

  const filterSections = useMemo(
    () => [
      { id: 'categories', title: 'Kategori', type: 'checkbox', options: productCategories },
      { id: 'petTypes', title: 'Jenis Hewan', type: 'checkbox', options: petTypeFilters },
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
      filterAndSortItems(products, {
        query,
        queryFields: ['name', 'storeName', 'category'],
        filters,
        priceField: 'price',
        sort,
      }),
    [query, filters, sort, products],
  );

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * PRODUCT_PAGE_SIZE, page * PRODUCT_PAGE_SIZE);

  const handleFiltersChange = (next) => {
    if (next.priceMin !== filters.priceMin || next.priceMax !== filters.priceMax) {
      setPriceTouched(true);
    }
    setFilters(next);
    setPage(1);
  };

  return (
    <>
      <Navbar activeLink="Produk" />
      <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">Produk</h1>
        <p className="mt-1 text-sm text-text-secondary">Temukan makanan, aksesoris, dan perlengkapan hewan.</p>

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
                placeholder="Cari produk..."
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
                  title="Produk tidak ditemukan"
                  subtitle="Coba ubah atau reset filter kamu"
                  onReset={resetFilters}
                />
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {pageItems.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      isWishlisted={Boolean(wishlist[product.id])}
                      onWishlistToggle={() =>
                        setWishlist((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                      }
                    />
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination
                    page={page}
                    pageSize={PRODUCT_PAGE_SIZE}
                    total={total}
                    itemLabel="produk"
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
