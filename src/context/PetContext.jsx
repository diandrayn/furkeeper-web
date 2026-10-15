import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { initialPets } from '../data/mockPets';

const STORAGE_KEY = 'furkeeper_pets';
const PetContext = createContext(null);

function readPets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialPets;
  } catch {
    return initialPets;
  }
}

function persist(pets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

export function PetProvider({ children }) {
  const [pets, setPets] = useState(initialPets);

  useEffect(() => { setPets(readPets()); }, []);

  const addPet = useCallback((pet) => {
    setPets((prev) => {
      const next = [...prev, pet];
      persist(next);
      return next;
    });
  }, []);

  const updatePet = useCallback((id, patch) => {
    setPets((prev) => {
      const next = prev.map((pet) => (pet.id === id ? { ...pet, ...patch } : pet));
      persist(next);
      return next;
    });
  }, []);

  const removePet = useCallback((id) => {
    setPets((prev) => {
      const next = prev.filter((pet) => pet.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ pets, addPet, updatePet, removePet }),
    [pets, addPet, updatePet, removePet],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePets() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets must be used within PetProvider');
  }
  return context;
}
