import { useRef, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../components/Button';
import sellerImg from '../assets/become-seller.jpg';
import serviceImg from '../assets/become-service.jpg';

const sellerImage = sellerImg.src;
const serviceImage = serviceImg.src;

// Single source of truth for both tabs — the panel and the tab labels read
// from this object, so seller/service content is never duplicated in JSX.
const partnerContent = {
  seller: {
    image: sellerImage,
    titleKey: 'partnerCTA.seller.title',
    descriptionKey: 'partnerCTA.seller.description',
    ctaKey: 'partnerCTA.seller.cta',
  },
  service: {
    image: serviceImage,
    titleKey: 'partnerCTA.service.title',
    descriptionKey: 'partnerCTA.service.description',
    ctaKey: 'partnerCTA.service.cta',
  },
};

const partnerTabOrder = ['seller', 'service'];

export default function PartnerCTA() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('seller');
  const [slideDirection, setSlideDirection] = useState(1);
  const tabRefs = useRef({});

  const partnerRoute = (key) => {
    const type = key === 'service' ? 'service' : 'seller';
    if (!isLoggedIn) {
      navigate(`/register/partner?type=${type}`);
      return;
    }

    const isSameRole = user?.role === type;
    if (!isSameRole) {
      navigate(`/register/partner?type=${type}`);
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
      navigate(type === 'service' ? '/dashboard/jasa' : '/dashboard/toko');
    }
  };

  const selectTab = (key) => {
    if (key === activeTab) return;
    const currentIndex = partnerTabOrder.indexOf(activeTab);
    const nextIndex = partnerTabOrder.indexOf(key);
    setSlideDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(key);
  };

  const handleTabKeyDown = (event) => {
    const currentIndex = partnerTabOrder.indexOf(activeTab);
    let nextIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % partnerTabOrder.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + partnerTabOrder.length) % partnerTabOrder.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = partnerTabOrder.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextKey = partnerTabOrder[nextIndex];
    setSlideDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(nextKey);
    tabRefs.current[nextKey]?.focus();
  };

  const content = partnerContent[activeTab];

  return (
    <section className="rounded-[2rem] bg-[var(--krem)] px-5 py-10 sm:px-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-hero text-[clamp(1.9rem,3.6vw,2.75rem)] leading-tight text-[var(--navy)]">
          {t('partnerCTA.title')}
        </h2>
        <p className="mt-3 text-[clamp(0.9rem,1.2vw,1.05rem)] leading-relaxed text-[var(--ungu)]">
          {t('partnerCTA.subtitle')}
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        <div
          role="tablist"
          aria-label={t('partnerCTA.tablistLabel')}
          className="flex w-full max-w-md rounded-full bg-[var(--lavender)] p-1.5"
        >
          {partnerTabOrder.map((key) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                ref={(node) => {
                  tabRefs.current[key] = node;
                }}
                type="button"
                role="tab"
                id={`partner-tab-${key}`}
                aria-selected={isActive}
                aria-controls="partner-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(key)}
                onKeyDown={handleTabKeyDown}
                className={`flex-1 rounded-full px-2 py-2 text-[clamp(0.75rem,1vw,0.95rem)] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lavender)] sm:px-4 sm:py-2.5 ${
                  isActive
                    ? 'bg-[var(--navy)] text-white shadow-md'
                    : 'text-[var(--navy)] hover:bg-white/60'
                }`}
              >
                {t(partnerContent[key].titleKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="partner-panel"
        role="tabpanel"
        aria-labelledby={`partner-tab-${activeTab}`}
        tabIndex={0}
        className="mt-6 rounded-[1.75rem] bg-[var(--pink)] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--krem)] sm:p-6"
      >
        <div
          key={activeTab}
          className="partner-panel-enter grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8"
          style={{ '--partner-shift': slideDirection > 0 ? '1.25rem' : '-1.25rem' }}
        >
          <div className="overflow-hidden rounded-[1.25rem]">
            <img
              src={content.image}
              alt={`Ilustrasi ${t(content.titleKey)}`}
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>

          <div className="flex min-h-[13rem] flex-col items-start justify-center px-1 sm:px-2 lg:min-h-[18rem]">
            <h3 className="font-hero text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight text-[var(--navy)]">
              {t(content.titleKey)}
            </h3>
            <p className="mt-3 text-[clamp(0.9rem,1.1vw,1rem)] leading-relaxed text-[var(--ungu)]">
              {t(content.descriptionKey)}
            </p>
            <div className="mt-5">
              <Button variant="primary" onClick={() => partnerRoute(activeTab)}>
                {t(content.ctaKey)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
