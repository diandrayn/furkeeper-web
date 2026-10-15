import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Card from '../components/Card';
import CalendarPicker from '../components/CalendarPicker';
import TimeSlotGrid from '../components/TimeSlotGrid';
import PetSelectDropdown from '../components/PetSelectDropdown';
import PackageCard from '../components/PackageCard';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import { usePublicServices, findServiceById } from '../hooks/usePublicServices';
import { getDateStatus, getSlotsForDate, startOfDay } from '../data/mockBooking';
import { usePets } from '../context/PetContext';
import { useAuth } from '../hooks/useAuth';
import { submitBooking } from '../utils/bookings';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

function firstAvailableDate() {
  const date = startOfDay(new Date());
  for (let i = 0; i < 45; i += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + i);
    if (getDateStatus(candidate) === 'available') return candidate;
  }
  return date;
}

export default function BookingPage() {
  const { id: serviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { services } = usePublicServices();
  const service = findServiceById(services, serviceId);

  const [packageId, setPackageId] = useState(location.state?.packageId || service?.packages?.[0]?.id || '');
  const [monthDate, setMonthDate] = useState(() => firstAvailableDate());
  const [selectedDate, setSelectedDate] = useState(() => firstAvailableDate());
  const [selectedSlot, setSelectedSlot] = useState('');
  const { pets, addPet } = usePets();
  const { user } = useAuth();
  const [petId, setPetId] = useState(pets[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!pets.some((pet) => pet.id === petId)) {
      setPetId(pets[0]?.id || '');
    }
  }, [pets, petId]);

  const selectedPackage = service?.packages?.find((item) => item.id === packageId);
  const slots = useMemo(
    () => (selectedDate ? getSlotsForDate(selectedDate) : []),
    [selectedDate],
  );
  const downPayment = selectedPackage ? Math.round(selectedPackage.price * 0.3) : 0;
  const canPay = Boolean(selectedPackage && selectedDate && selectedSlot && petId);

  if (!service) {
    return (
      <>
        <Navbar activeLink="Jasa" />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('booking.notFoundTitle')}</h1>
          <Link to="/jasa" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('booking.backToServices')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  const handlePay = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const dateValue = selectedDate instanceof Date ? selectedDate.toISOString().slice(0, 10) : selectedDate;
      const bookingId = await submitBooking({
        serviceId: service.id,
        packageId: selectedPackage?.id || null,
        petId,
        date: dateValue,
        time: selectedSlot,
        price: downPayment,
        notes,
      });
      navigate(`/pembayaran/${bookingId}`);
    } catch (err) {
      console.error('submitBooking failed:', err);
      setSubmitError(err?.message || 'Gagal membuat booking. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar activeLink="Jasa" />
      <div className="pb-28">
        <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
          <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('booking.title')}</h1>
          {service.storeId ? (
            <Link
              to={`/toko/${service.storeId}`}
              className="mt-1 inline-block text-sm text-text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
            >
              {service.providerName}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-text-secondary">{service.providerName}</p>
          )}

          <div className="mt-8 space-y-5">
            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('booking.servicePackage')}</h2>
              {location.state?.packageId && selectedPackage ? (
                <div>
                  <p className="font-medium text-text-primary">{selectedPackage.name}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t('booking.estimate').replace('{value}', selectedPackage.durationEstimate)}
                  </p>
                  <p className="mt-2 font-heading text-lg font-bold text-brand-burgundy">
                    {formatPrice(selectedPackage.price)}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {service.packages.map((item) => (
                    <div
                      key={item.id}
                      className={packageId === item.id ? 'rounded-2xl ring-2 ring-brand-burgundy' : ''}
                    >
                      <PackageCard {...item} onSelect={() => setPackageId(item.id)} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('booking.pickDateTime')}</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <CalendarPicker
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot('');
                  }}
                  monthDate={monthDate}
                  onMonthChange={setMonthDate}
                />
                <div>
                  <p className="mb-3 text-sm font-medium text-text-primary">{t('booking.availableTime')}</p>
                  <TimeSlotGrid slots={slots} value={selectedSlot} onChange={setSelectedSlot} />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('booking.petData')}</h2>
              <PetSelectDropdown
                pets={pets}
                value={petId}
                onChange={setPetId}
                onAddPet={(pet) => {
                  addPet({ age: '', weight: '', notes: '', photoUrl: null, ...pet });
                  setPetId(pet.id);
                }}
              />
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('booking.additionalNotes')}</h2>
              <Textarea
                placeholder={t('booking.notesPlaceholder')}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('booking.costSummary')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('booking.packagePrice')}</span>
                  <span>{formatPrice(selectedPackage?.price || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('booking.downPayment')}</span>
                  <span>{formatPrice(downPayment)}</span>
                </div>
                <p className="text-xs text-text-secondary">
                  {t('booking.downPaymentNote')}
                </p>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
                <span className="font-heading text-sm font-bold">{t('booking.totalPayNow')}</span>
                <span className="font-heading text-xl font-bold text-brand-burgundy">
                  {formatPrice(downPayment)}
                </span>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-container">
          {submitError && (
            <p className="mb-2 text-sm font-medium text-status-danger">{submitError}</p>
          )}
          <Button variant="primary" fullWidth disabled={!canPay || submitting} onClick={handlePay}>
            {t('booking.continueToPayment')}
          </Button>
        </div>
      </div>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
