import { useState } from 'react';
import { Plus } from 'lucide-react';
import PetCard from '../components/PetCard';
import PetFormModal from '../components/PetFormModal';
import { usePets } from '../context/PetContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function PetsPage() {
  const { t } = useLanguage();
  const { pets, addPet, updatePet, removePet } = usePets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = (pet) => {
    if (editing) updatePet(pet.id, pet);
    else addPet(pet);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            photo={pet.photoUrl}
            name={pet.name}
            speciesBreed={[pet.species, pet.breed].filter(Boolean).join(' · ')}
            onEdit={() => {
              setEditing(pet);
              setModalOpen(true);
            }}
            onDelete={() => {
              if (window.confirm(t('pets.confirmDelete').replace('{value}', pet.name))) removePet(pet.id);
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-sm font-medium text-brand-burgundy transition-colors duration-200 hover:border-brand-burgundy/40 hover:bg-brand-peach/30"
        >
          <Plus className="mb-2 h-6 w-6" />
          {t('pets.addPet')}
        </button>
      </div>

      <PetFormModal
        open={modalOpen}
        pet={editing}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
