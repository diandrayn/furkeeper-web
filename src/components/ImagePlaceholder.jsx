import { ImageIcon } from 'lucide-react';

export default function ImagePlaceholder({
  className = '',
  aspectRatio = '',
  alt = 'Placeholder gambar',
  showIcon = true,
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex items-center justify-center overflow-hidden bg-gray-200 ${aspectRatio} ${className}`}
    >
      {showIcon && (
        <ImageIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
}
