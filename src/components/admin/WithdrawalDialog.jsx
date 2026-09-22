import { useEffect, useState } from 'react';
import Textarea from '../Textarea';
import Button from '../Button';

const formatRupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;

/**
 * Dialog untuk menyelesaikan atau menolak sebuah pencairan dana.
 *   * 'completed' — konfirmasi bahwa transfer sudah dilakukan; catatan opsional.
 *   * 'rejected'  — alasan WAJIB (dikirim ke penjual; juga ditegakkan trigger DB).
 *
 *   <WithdrawalDialog
 *     open={Boolean(target)}
 *     decision={target?.decision}          // 'completed' | 'rejected'
 *     withdrawal={target?.withdrawal}
 *     loading={busy}
 *     onConfirm={(note) => ...}
 *     onCancel={() => setTarget(null)}
 *   />
 */
export default function WithdrawalDialog({ open, decision, withdrawal, loading = false, onConfirm, onCancel }) {
  const [note, setNote] = useState('');
  const isReject = decision === 'rejected';

  useEffect(() => {
    if (open) setNote('');
  }, [open, decision, withdrawal?.id]);

  if (!open || !withdrawal) return null;

  const canConfirm = !isReject || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {isReject ? 'Tolak pencairan ini?' : 'Tandai pencairan selesai?'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isReject
            ? `Pencairan ${formatRupiah(withdrawal.amount)} untuk ${withdrawal.storeName} akan ditolak. Alasan penolakan dikirim ke pemilik toko.`
            : `Pastikan ${formatRupiah(withdrawal.amount)} sudah ditransfer ke ${withdrawal.bankName} ${withdrawal.accountNumber} a.n. ${withdrawal.accountHolder}. Status tidak bisa diubah lagi setelah ini.`}
        </p>

        <div className="mt-4">
          <Textarea
            label={isReject ? 'Alasan penolakan (wajib)' : 'Catatan untuk penjual (opsional)'}
            rows={3}
            placeholder={isReject ? 'Contoh: Nomor rekening tidak sesuai dengan nama pemilik toko.' : 'Contoh: Dana masuk maksimal 1x24 jam.'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} playful={false}>
            Batal
          </Button>
          <Button
            variant="primary"
            className={`flex-1 ${isReject ? '!bg-status-danger hover:!bg-status-danger/90' : ''}`}
            loading={loading}
            disabled={!canConfirm}
            onClick={() => onConfirm(note.trim())}
            playful={false}
          >
            {isReject ? 'Tolak' : 'Tandai selesai'}
          </Button>
        </div>
      </div>
    </div>
  );
}
