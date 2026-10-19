import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import SectionHeader from '../components/SectionHeader';
import { petTypes } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

// Fisher-Yates shuffle — returns a new array, never mutates the source.
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function PetTypeSelector() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [shuffledPetTypes, setShuffledPetTypes] = useState(petTypes);

  useEffect(() => {
    setShuffledPetTypes(shuffle(petTypes));
  }, []);

  return (
    <section className="mx-auto max-w-container px-4 py-16 md:px-6 md:py-20 lg:px-8 lg:py-24">
      <SectionHeader
        title={t('petType.heading')}
        subtitle={t('petType.subheading')}
        align="center"
        className="mb-12 !flex-col !items-center md:mb-16"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {shuffledPetTypes.map((pet) => {
          const label = t(`petType.${pet.id}`);
          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => navigate(`/produk?jenisHewan=${encodeURIComponent(pet.label)}`)}
              className="group flex flex-col items-center rounded-2xl bg-brand-peach/60 px-6 pb-8 pt-16 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative -mt-24 mb-4">
                <img
                  src={pet.image}
                  alt={pet.alt}
                  className={`h-28 w-28 rounded-full object-cover ring-4 ${pet.ringColor} transition-transform duration-200 group-hover:scale-105`}
                />
              </div>
              <span className="font-heading text-lg font-bold text-brand-burgundy">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
