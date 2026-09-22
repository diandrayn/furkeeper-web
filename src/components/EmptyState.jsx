import ImagePlaceholder from './ImagePlaceholder';
import Button from './Button';

export default function EmptyState({
  title,
  subtitle,
  onReset,
  resetLabel = 'Reset Filter',
  action,
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
      <ImagePlaceholder
        className="h-32 w-32 rounded-2xl"
        alt="Ilustrasi kosong — ganti dengan foto/ilustrasi asli"
      />
      <h2 className="mt-6 font-heading text-xl font-bold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{subtitle}</p>
      {onReset && (
        <Button variant="outline" className="mt-6" onClick={onReset}>
          {resetLabel}
        </Button>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
