import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
// 3 banner promo — timpa banner.jpg / banner-2.jpg / banner-3.jpg di
// src/assets dengan gambar banner kamu sendiri (nama file harus sama
// persis, atau ganti nama importnya di sini kalau file kamu beda nama).
// Semua 3 file source-nya berpaspek 2:1 (mis. 3780x1890px) — kalau ganti
// foto, usahakan tetap di rasio 2:1 biar nggak ke-crop aneh. Tingginya
// dibatasi (bukan pakai aspect-ratio penuh) supaya banner nggak makan
// terlalu banyak ruang vertikal di halaman — sesuaikan angka h-[...] di
// bawah kalau mau lebih besar/kecil lagi.
import banner1 from '../assets/banner.jpg';
import banner2 from '../assets/banner-2.jpg';
import banner3 from '../assets/banner-3.jpg';

const slides = [
  { id: 1, image: banner1, altKey: 'slide1', to: '/produk' },
  { id: 2, image: banner2, altKey: 'slide2', to: '/jasa' },
  { id: 3, image: banner3, altKey: 'slide3', to: '/register/partner' },
];

const AUTOPLAY_MS = 4500;

export default function PromoBanner() {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);
  const trackRef = useRef(null);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();

  // Banner "Jadi Mitra" tidak boleh melempar akun mitra yang SUDAH terdaftar
  // ke formulir daftar akun baru (jalan buntu — email sudah terpakai). Arahkan
  // sesuai statusnya, sama seperti kartu PartnerCTA di bawahnya.
  const handleSlideClick = (slide) => {
    if (isDragging) return;
    if (slide.to !== '/register/partner' || !isLoggedIn) {
      navigate(slide.to);
      return;
    }

    const type = user?.role === 'service' ? 'service' : user?.role === 'seller' ? 'seller' : null;
    if (!type) {
      navigate(slide.to);
      return;
    }

    const status = type === 'service' ? user?.providerStatus : user?.sellerStatus;
    if (status === 'active') {
      navigate(type === 'service' ? '/dashboard/jasa' : '/dashboard/toko');
    } else if (status === 'pending') {
      navigate('/status-pengajuan');
    } else if (status === 'rejected') {
      navigate('/pengajuan-ulang');
    } else {
      // status 'none' — guard dashboard menampilkan panduan pemulihan.
      navigate(type === 'service' ? '/dashboard/jasa' : '/dashboard/toko');
    }
  };

  const goTo = useCallback((next) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, []);

  // Autoplay — pauses while the user is dragging/hovering isn't tracked to
  // keep it simple, but a fresh interval is set on every manual navigation
  // so it doesn't jump right after a user interaction.
  useEffect(() => {
    if (isDragging) return undefined;
    const timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [index, isDragging, goTo]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
    trackRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 50;
    if (dragDeltaX.current > threshold) {
      goTo(index - 1);
    } else if (dragDeltaX.current < -threshold) {
      goTo(index + 1);
    }
    dragDeltaX.current = 0;
  };

  return (
    <section className="mx-auto max-w-container px-4 py-16 md:px-6 md:py-20 lg:px-8 lg:py-24">
      <div
        className="playful-interactive group relative touch-pan-y select-none overflow-hidden rounded-2xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={trackRef}
          className="flex h-[180px] w-full cursor-grab transition-transform duration-500 ease-out active:cursor-grabbing sm:h-[260px] md:h-[300px] lg:h-[340px]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleSlideClick(slide)}
              className="h-full w-full shrink-0"
              aria-label={t(`promoBanner.${slide.altKey}`)}
            >
              <img
                src={slide.image}
                alt={t(`promoBanner.${slide.altKey}`)}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Prev/next arrows */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label={t('promoBanner.prev')}
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-burgundy opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label={t('promoBanner.next')}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-burgundy opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${t('promoBanner.goTo')} ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
