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
import { fetchAllServices, setServiceActive, deleteServiceAdmin, reviewListing, LISTING_APPROVAL_LABELS } from '../../utils/admin';

const PAGE_SIZE = 8;

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function AdminServicesPage() {
  const [query, setQuery] = useState('');
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null); // { decision, service }
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = () => {
    setIsLoading(true);
    fetchAllServices()
      .then(setServices)
      .catch((err) => {
        console.error('fetchAllServices failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);
  useEffect(() => setPage(1), [query, approvalFilter]);

  const approvalCounts = useMemo(() => {
    const counts = { all: services.length, pending: 0, approved: 0, rejected: 0 };
    services.forEach((p) => {
      counts[p.approvalStatus] = (counts[p.approvalStatus] || 0) + 1;
    });
    return counts;
  }, [services]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return services.filter(
      (p) =>
        (approvalFilter === 'all' || p.approvalStatus === approvalFilter) &&
        (p.name.toLowerCase().includes(term) || p.storeName.toLowerCase().includes(term)),
    );
  }, [services, query, approvalFilter]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleActive = async (service) => {
    setBusyId(service.id);
    try {
      await setServiceActive(service.id, !service.isActive, service.name);
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s)));
    } catch (err) {
      console.error('toggle service active failed:', err);
      window.alert('Gagal mengubah status jasa.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteServiceAdmin(deleteTarget.id, deleteTarget.name);
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('delete service failed:', err);
      window.alert('Gagal menghapus jasa.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (reason) => {
    if (!reviewTarget) return;
    const { decision, service } = reviewTarget;
    setReviewBusy(true);
    try {
      await reviewListing('service', service.id, decision, reason, service.name);
      setServices((prev) =>
        prev.map((p) =>
          p.id === service.id ? { ...p, approvalStatus: decision, rejectionReason: decision === 'rejected' ? reason : null } : p,
        ),
      );
      setReviewTarget(null);
    } catch (err) {
      console.error('reviewListing failed:', err);
      window.alert('Gagal memproses peninjauan jasa. Coba lagi.');
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
        placeholder="Cari nama jasa atau toko..."
        icon={<Search className="h-4 w-4" />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && <PawLoader label="Memuat jasa..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="Tidak ada jasa" subtitle="Belum ada jasa grooming yang cocok dengan pencarian atau filter ini." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((service) => (
                <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <ImagePlaceholder className="h-12 w-12 shrink-0 rounded-xl" alt="" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{service.name}</p>
                      <p className="truncate text-xs text-text-secondary">
                        <Link to={`/admin/toko/${service.storeId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {service.storeName}
                        </Link>{' '}
                        &middot; mulai {formatRupiah(service.priceFrom)}
                      </p>
                      {service.approvalStatus === 'rejected' && service.rejectionReason && (
                        <p className="mt-0.5 text-xs text-status-danger">Alasan penolakan: {service.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ApprovalBadge status={service.approvalStatus} />
                    <Badge variant={service.isActive ? 'active' : 'rejected'} label={service.isActive ? 'Aktif' : 'Nonaktif'} />
                    {service.approvalStatus !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Check className="h-4 w-4" />}
                        disabled={busyId === service.id}
                        onClick={() => setReviewTarget({ decision: 'approved', service })}
                        playful={false}
                      >
                        Setujui
                      </Button>
                    )}
                    {service.approvalStatus !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<X className="h-4 w-4" />}
                        className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                        disabled={busyId === service.id}
                        onClick={() => setReviewTarget({ decision: 'rejected', service })}
                        playful={false}
                      >
                        Tolak
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={service.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      loading={busyId === service.id}
                      onClick={() => toggleActive(service)}
                      playful={false}
                    >
                      {service.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 className="h-4 w-4" />}
                      className="!text-status-danger hover:!bg-status-danger/5"
                      disabled={busyId === service.id}
                      onClick={() => setDeleteTarget(service)}
                      playful={false}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} itemLabel="jasa" onPageChange={setPage} />
        </>
      )}

      <ListingReviewDialog
        open={Boolean(reviewTarget)}
        decision={reviewTarget?.decision}
        listingName={reviewTarget?.service.name}
        loading={reviewBusy}
        onConfirm={handleReview}
        onCancel={() => setReviewTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Hapus "${deleteTarget?.name}"?`}
        description="Jasa akan dihapus permanen dari platform. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
