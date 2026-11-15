import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import SectionHeader from '../components/SectionHeader';
import { petTypes } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

const cardTones = ['bg-brand-peach', 'bg-brand-pink', 'bg-brand-mist'];

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
  // HYDRATION: the order MUST be deterministic for the server render AND the
  // client's first render. Previously `useState(() => shuffle(petTypes))` ran
  // Math.random() once on the server and again in the browser, so the two
  // HTML trees differed ("Hewan Lain" first vs "Kucing" first) and React threw
  // a hydration mismatch. So: first paint always uses the default order from
  // mockData; the random shuffle is applied only after mount (effects never
  // run on the server), where changing the DOM is safe.
  const [orderedPetTypes, setOrderedPetTypes] = useState(petTypes);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration shuffle
    setOrderedPetTypes(shuffle(petTypes));
  }, []);

  return (
    <section className="rounded-[2rem] bg-white/40 px-4 py-10 sm:px-6 md:px-8 md:py-12">
      <SectionHeader
        title={t('petType.heading')}
        subtitle={t('petType.subheading')}
        align="center"
        display
        sparkle
        className="mb-12 !flex-col !items-center md:mb-16"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {orderedPetTypes.map((pet, index) => {
          const label = t(`petType.${pet.id}`);
          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => navigate(`/produk?jenisHewan=${encodeURIComponent(pet.label)}`)}
              className={`playful-interactive group flex flex-col items-center rounded-[1.75rem] px-6 pb-8 pt-16 transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy/40 ${cardTones[index % cardTones.length]}`}
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
