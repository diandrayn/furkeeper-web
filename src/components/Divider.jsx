export default function Divider({ text = 'or' }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs uppercase tracking-wide text-text-secondary">
          {text}
        </span>
      </div>
    </div>
  );
}
