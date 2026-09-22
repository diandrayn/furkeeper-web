import { Pencil, Trash2 } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';
import Button from './Button';

export default function PetCard({ photo, name, speciesBreed, onEdit, onDelete }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm">
      {photo ? (
        <img src={photo} alt={name} className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <ImagePlaceholder className="h-36 w-full rounded-xl" alt={name} />
      )}
      <h3 className="mt-3 font-heading text-base font-bold text-text-primary">{name}</h3>
      <p className="mt-0.5 text-sm text-text-secondary">{speciesBreed}</p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
          Ubah
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-status-danger border-status-danger"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={onDelete}
        >
          Hapus
        </Button>
      </div>
    </div>
  );
}
