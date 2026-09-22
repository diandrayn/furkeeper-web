import Button from '../Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="font-heading text-lg font-bold text-text-primary">{title}</h2>
        {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} playful={false}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'primary' : 'orange'}
            className={`flex-1 ${danger ? '!bg-status-danger hover:!bg-status-danger/90' : ''}`}
            onClick={onConfirm}
            playful={false}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
