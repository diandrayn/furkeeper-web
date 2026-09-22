import { useEffect, useState } from 'react';
import Textarea from '../Textarea';
import Button from '../Button';

/**
 * Dialog approve/reject sebuah listing. Untuk penolakan, alasan WAJIB diisi
 * (tombol tetap nonaktif sampai ada isinya) dan akan dikirim ke penjual.
 *
 *   <ListingReviewDialog
 *     open={Boolean(reviewTarget)}
 *     decision={reviewTarget?.decision}        // 'approved' | 'rejected'
 *     listingName={reviewTarget?.listing.name}
 *     loading={busy}
 *     onConfirm={(reason) => reviewListing('product', id, decision, reason, name)}
 *     onCancel={() => setReviewTarget(null)}
 *   />
 */
export default function ListingReviewDialog({ open, decision, listingName, loading = false, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const isReject = decision === 'rejected';

  useEffect(() => {
    if (open) setReason('');
  }, [open, decision, listingName]);

  if (!open) return null;

  const canConfirm = !isReject || reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {isReject ? 'Tolak listing ini?' : 'Setujui listing ini?'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isReject
            ? `"${listingName}" tidak akan tayang. Penjual akan menerima alasan penolakan dan bisa memperbarui listing-nya untuk ditinjau ulang.`
            : `"${listingName}" akan langsung tayang di platform dan penjual diberi tahu.`}
        </p>

        {isReject && (
          <div className="mt-4">
            <Textarea
              label="Alasan penolakan (wajib)"
              rows={4}
              placeholder="Contoh: Foto produk tidak jelas / deskripsi tidak sesuai kategori."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} playful={false}>
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={loading}
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
            playful={false}
          >
            {isReject ? 'Tolak' : 'Setujui'}
          </Button>
        </div>
      </div>
    </div>
  );
}
