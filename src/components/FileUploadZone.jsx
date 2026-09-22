import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Badge from './Badge';

export default function FileUploadZone({
  label,
  required = false,
  optionalBadge,
  onFileSelect,
  file,
  error,
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (selected) => {
    if (selected) onFileSelect?.(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
        {optionalBadge && <Badge variant="optional" label={optionalBadge} />}
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          {file.type?.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${label}`}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-brand-burgundy transition-colors duration-200 hover:underline"
            >
              Ganti
            </button>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect?.(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-status-danger"
            aria-label="Hapus file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-all duration-200 ${
            dragOver
              ? 'border-brand-orange-end bg-brand-orange-end/5'
              : 'border-gray-300 bg-gray-50 hover:border-brand-orange-end/50 hover:bg-brand-orange-end/5'
          }`}
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" aria-hidden="true" />
          <p className="text-sm font-medium text-text-primary">
            Seret & lepas atau klik untuk unggah
          </p>
          <p className="mt-1 text-xs text-text-secondary">PNG, JPG hingga 5 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <p className="text-xs text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
