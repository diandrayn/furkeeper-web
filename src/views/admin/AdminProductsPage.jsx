import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/router';
import { Search, Trash2, EyeOff, Eye, Check, X } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import ApprovalBadge from '../../components/admin/ApprovalBadge';
import ListingReviewDialog from '../../components/admin/ListingReviewDialog';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAllProducts, setProductActive, deleteProductAdmin, reviewListing, LISTING_APPROVAL_LABELS } from '../../utils/admin';

const PAGE_SIZE = 8;

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function AdminProductsPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null); // { decision, product }
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = () => {
    setIsLoading(true);
    fetchAllProducts()
      .then(setProducts)
      .catch((err) => {
        console.error('fetchAllProducts failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);
  useEffect(() => setPage(1), [query, approvalFilter]);

  const approvalCounts = useMemo(() => {
    const counts = { all: products.length, pending: 0, approved: 0, rejected: 0 };
    products.forEach((p) => {
      counts[p.approvalStatus] = (counts[p.approvalStatus] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (approvalFilter === 'all' || p.approvalStatus === approvalFilter) &&
        (p.name.toLowerCase().includes(term) || p.storeName.toLowerCase().includes(term)),
    );
  }, [products, query, approvalFilter]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleActive = async (product) => {
    setBusyId(product.id);
    try {
      await setProductActive(product.id, !product.isActive, product.name);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)));
    } catch (err) {
      console.error('toggle product active failed:', err);
      window.alert('Gagal mengubah status produk.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteProductAdmin(deleteTarget.id, deleteTarget.name);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('delete product failed:', err);
      window.alert('Gagal menghapus produk.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (reason) => {
    if (!reviewTarget) return;
    const { decision, product } = reviewTarget;
    setReviewBusy(true);
    try {
      await reviewListing('product', product.id, decision, reason, product.name);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, approvalStatus: decision, rejectionReason: decision === 'rejected' ? reason : null } : p,
        ),
      );
      setReviewTarget(null);
    } catch (err) {
      console.error('reviewListing failed:', err);
      window.alert('Gagal memproses peninjauan produk. Coba lagi.');
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-sm sm:inline-flex sm:rounded-full">
        {[{ key: 'all', label: 'Semua' }, ...Object.entries(LISTING_APPROVAL_LABELS).map(([key, label]) => ({ key, label }))].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setApprovalFilter(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              approvalFilter === tab.key ? 'bg-brand-burgundy text-white' : 'text-text-secondary hover:text-brand-burgundy'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs font-medium ${approvalFilter === tab.key ? 'text-white/75' : 'text-text-secondary'}`}>
              {approvalCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      <Input
        placeholder="Cari nama produk atau toko..."
        icon={<Search className="h-4 w-4" />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && <PawLoader label="Memuat produk..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="Tidak ada produk" subtitle="Belum ada produk yang cocok dengan pencarian atau filter ini." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((product) => (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <ImagePlaceholder className="h-12 w-12 shrink-0 rounded-xl" alt="" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
                      <p className="truncate text-xs text-text-secondary">
                        <Link to={`/admin/toko/${product.storeId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {product.storeName}
                        </Link>{' '}
                        &middot; {formatRupiah(product.price)}
                      </p>
                      {product.approvalStatus === 'rejected' && product.rejectionReason && (
                        <p className="mt-0.5 text-xs text-status-danger">Alasan penolakan: {product.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ApprovalBadge status={product.approvalStatus} />
                    <Badge variant={product.isActive ? 'active' : 'rejected'} label={product.isActive ? 'Aktif' : 'Nonaktif'} />
                    {product.approvalStatus !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Check className="h-4 w-4" />}
                        disabled={busyId === product.id}
                        onClick={() => setReviewTarget({ decision: 'approved', product })}
                        playful={false}
                      >
                        Setujui
                      </Button>
                    )}
                    {product.approvalStatus !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<X className="h-4 w-4" />}
                        className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                        disabled={busyId === product.id}
                        onClick={() => setReviewTarget({ decision: 'rejected', product })}
                        playful={false}
                      >
                        Tolak
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      loading={busyId === product.id}
                      onClick={() => toggleActive(product)}
                      playful={false}
                    >
                      {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 className="h-4 w-4" />}
                      className="!text-status-danger hover:!bg-status-danger/5"
                      disabled={busyId === product.id}
                      onClick={() => setDeleteTarget(product)}
                      playful={false}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} itemLabel="produk" onPageChange={setPage} />
        </>
      )}

      <ListingReviewDialog
        open={Boolean(reviewTarget)}
        decision={reviewTarget?.decision}
        listingName={reviewTarget?.product.name}
        loading={reviewBusy}
        onConfirm={handleReview}
        onCancel={() => setReviewTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Hapus "${deleteTarget?.name}"?`}
        description="Produk akan dihapus permanen dari platform. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
