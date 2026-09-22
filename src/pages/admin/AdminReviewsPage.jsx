import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Star } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchAllReviews, deleteReviewAdmin } from '../../utils/admin';
import { formatDateId } from '../../utils/status';

const PAGE_SIZE = 8;

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-brand-orange-end text-brand-orange-end' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [query, setQuery] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAllReviews()
      .then(setReviews)
      .catch((err) => {
        console.error('fetchAllReviews failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);
  useEffect(() => setPage(1), [query]);

  const filtered = useMemo(
    () =>
      reviews.filter(
        (r) =>
          (r.comment || '').toLowerCase().includes(query.trim().toLowerCase()) ||
          r.authorName.toLowerCase().includes(query.trim().toLowerCase()) ||
          r.targetName.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [reviews, query],
  );
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteReviewAdmin(deleteTarget.id, deleteTarget.authorName ? `Ulasan ${deleteTarget.authorName}` : null);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('delete review failed:', err);
      window.alert('Gagal menghapus ulasan.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Input
        placeholder="Cari isi ulasan, penulis, atau produk/jasa..."
        icon={<Search className="h-4 w-4" />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && <PawLoader label="Memuat ulasan..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">Gagal memuat data. Pastikan migrasi admin sudah dijalankan.</p>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="Tidak ada ulasan" subtitle="Belum ada ulasan yang cocok dengan pencarian ini." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <>
          <div className="space-y-3">
            {pageItems.map((review) => (
              <Card key={review.id} className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{review.authorName}</p>
                    <p className="text-xs text-text-secondary">
                      untuk <strong>{review.targetName}</strong> &middot; {formatDateId(review.createdAt)}
                    </p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && <p className="text-sm text-text-primary">{review.comment}</p>}
                {review.reply && (
                  <p className="rounded-xl bg-brand-peach/40 px-3 py-2 text-xs text-text-secondary">
                    Balasan mitra: {review.reply}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="h-4 w-4" />}
                  className="!text-status-danger hover:!bg-status-danger/5"
                  disabled={busyId === review.id}
                  onClick={() => setDeleteTarget(review)}
                  playful={false}
                >
                  Hapus Ulasan
                </Button>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} itemLabel="ulasan" onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus ulasan ini?"
        description="Ulasan akan dihapus permanen dari platform. Gunakan untuk ulasan palsu atau melanggar ketentuan."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
