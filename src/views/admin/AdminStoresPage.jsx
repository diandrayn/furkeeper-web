import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/router';
import { Search, Store, Scissors, ChevronRight, ShieldCheck } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAllStores } from '../../utils/admin';

const PAGE_SIZE = 8;

const KIND_OPTIONS = [
  { value: 'all', label: 'Semua Jenis' },
  { value: 'seller', label: 'Toko (Penjual Produk)' },
  { value: 'service', label: 'Jasa Grooming' },
];

export default function AdminStoresPage() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAllStores()
      .then(setStores)
      .catch((err) => {
        console.error('fetchAllStores failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stores.filter((s) => {
      const matchesQuery =
        !term || s.name.toLowerCase().includes(term) || s.ownerName.toLowerCase().includes(term) || s.ownerEmail.toLowerCase().includes(term);
      const matchesKind = kind === 'all' || s.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [stores, query, kind]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari nama toko, pemilik, atau email..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <Select
          className="sm:w-56"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
          options={KIND_OPTIONS}
        />
      </div>

      {isLoading && <PawLoader label="Memuat toko..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="Tidak ada toko" subtitle="Belum ada toko/mitra yang cocok dengan pencarian ini." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((store) => (
                <Link
                  key={store.id}
                  to={`/admin/toko/${store.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors duration-150 hover:bg-brand-peach/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
                      {store.kind === 'service' ? <Scissors className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-text-primary">{store.name}</p>
                        {store.trusted && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-status-success" />}
                      </div>
                      <p className="truncate text-xs text-text-secondary">
                        {store.ownerName} &middot; {store.ownerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="optional" label={store.kind === 'service' ? 'Jasa Grooming' : 'Toko Produk'} />
                    <span className="text-xs text-text-secondary">
                      {store.listingCount} {store.kind === 'service' ? 'layanan' : 'produk'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-secondary" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} itemLabel="toko" onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
