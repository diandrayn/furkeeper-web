export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="font-heading text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
