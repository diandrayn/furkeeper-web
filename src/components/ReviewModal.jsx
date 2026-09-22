import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';
import Textarea from './Textarea';

export default function ReviewModal({ open, title, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!open) return;
    setRating(0);
    setHover(0);
    setComment('');
    setPhotos([]);
  }, [open]);

  if (!open) return null;

  const handlePhotos = (event) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating, comment, photos });
    setRating(0);
    setComment('');
    setPhotos([]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">{title || 'Beri Ulasan'}</h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-brand-burgundy">
            Tutup
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-text-primary">Penilaian</p>
        <div className="mb-4 flex gap-1" role="group" aria-label="Nilai bintang">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = (hover || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(value)}
                aria-label={`${value} bintang`}
                className="p-0.5"
              >
                <Star
                  className={`h-7 w-7 ${active ? 'fill-status-warning text-status-warning' : 'text-gray-300'}`}
                />
              </button>
            );
          })}
        </div>

        <Textarea
          label="Komentar"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalamanmu..."
        />

        <div className="mt-3">
          <label className="cursor-pointer text-sm font-medium text-brand-burgundy hover:underline">
            Unggah Foto
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          </label>
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((src, index) => (
                <div key={`${src.slice(0, 24)}-${index}`} className="relative">
                  <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow"
                    aria-label="Hapus foto"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="primary" fullWidth className="mt-5" onClick={handleSubmit} disabled={rating < 1}>
          Kirim Ulasan
        </Button>
      </div>
    </div>
  );
}
