import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';
import PetFormModal from './PetFormModal';

export default function PetSelectDropdown({ pets, value, onChange, onAddPet }) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const selected = pets.find((pet) => pet.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left"
      >
        {selected ? (
          <span className="flex items-center gap-3">
            {selected.photoUrl ? (
              <img src={selected.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <ImagePlaceholder className="h-8 w-8 rounded-full" alt={selected.name} showIcon={false} />
            )}
            <span className="text-sm text-text-primary">
              {selected.name} · {selected.species}
            </span>
          </span>
        ) : (
          <span className="text-sm text-gray-400">Pilih hewan</span>
        )}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => {
                onChange(pet.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-cream"
            >
              {pet.photoUrl ? (
                <img src={pet.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <ImagePlaceholder className="h-8 w-8 rounded-full" alt={pet.name} showIcon={false} />
              )}
              <span className="text-sm text-text-primary">
                {pet.name} · {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setFormOpen(true);
              setOpen(false);
            }}
            className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-brand-burgundy hover:bg-brand-cream"
          >
            + Tambah Hewan Baru
          </button>
        </div>
      )}

      <PetFormModal
        open={formOpen}
        pet={null}
        onClose={() => setFormOpen(false)}
        onSave={(pet) => {
          onAddPet(pet);
          onChange(pet.id);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
