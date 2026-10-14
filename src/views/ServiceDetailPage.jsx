import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import ImagePlaceholder from '../components/ImagePlaceholder';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PackageCard from '../components/PackageCard';
import PortfolioGallery from '../components/PortfolioGallery';
import RatingSummary from '../components/RatingSummary';
import ReviewCard from '../components/ReviewCard';
import ReviewFilterBar from '../components/ReviewFilterBar';
import StickyActionBar from '../components/StickyActionBar';
import ReportButton from '../components/ReportButton';
import { usePublicServices, findServiceById } from '../hooks/usePublicServices';
import { serviceReviewTags } from '../data/mockServices';
import { getRatingDistribution, getReviewsForTarget } from '../data/mockReviews';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../i18n/LanguageContext';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { services } = usePublicServices();
  const service = findServiceById(services, id);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');
  const { isLoggedIn } = useAuth();
  const { findOrCreateConversation } = useChat();
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const handleChatProvider = async () => {
    if (!service?.storeId) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/jasa/${service.id}` } } });
      return;
    }
    setChatError('');
    setChatLoading(true);
    try {
      const conversationId = await findOrCreateConversation(service.storeId, {
        type: 'service',
        thumbnail: service.imageUrl,
        title: service.name,
        linkTo: `/jasa/${service.id}`,
      });
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(err.message || 'Gagal membuka chat, coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  const reviews = useMemo(() => (service ? getReviewsForTarget(service.id) : []), [service]);
  const visibleReviews = reviews.filter((review) =>
    reviewFilter === 'all' ? true : review.rating === Number(reviewFilter),
  );

  if (!service) {
    return (
      <>
        <Navbar activeLink="Jasa" />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('serviceDetail.notFoundTitle')}</h1>
          <Link to="/jasa" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('serviceDetail.backToServices')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar activeLink="Jasa" />
      <div className="pb-24">
      <main className="mx-auto max-w-container px-4 pt-8 md:px-6 lg:px-8">
        <div className="relative">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={t('serviceDetail.coverAlt').replace('{value}', service.providerName)}
              className="h-48 w-full rounded-2xl object-cover md:h-64"
            />
          ) : (
            <ImagePlaceholder className="h-48 w-full rounded-2xl md:h-64" alt={t('serviceDetail.coverAlt').replace('{value}', service.providerName)} />
          )}
          <div className="absolute -bottom-10 left-6">
            <ImagePlaceholder
              className="h-20 w-20 rounded-full ring-4 ring-brand-cream md:h-24 md:w-24"
              alt={t('serviceDetail.photoAlt').replace('{value}', service.providerName)}
            />
          </div>
        </div>

        <div className="mt-14 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {service.storeId ? (
              <Link
                to={`/toko/${service.storeId}`}
                className="font-heading text-2xl font-bold text-text-primary hover:underline md:text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
              >
                {service.providerName}
              </Link>
            ) : (
              <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">
                {service.providerName}
              </h1>
            )}
            {service.trusted && <Badge variant="trusted" label={t('badges.trusted')} />}
            {service.fastResponse && <Badge variant="fast-response" label={t('badges.fastResponse')} />}
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-status-warning text-status-warning" />
              {service.rating} {t('serviceDetail.reviewsCount').replace('{value}', service.reviewCount)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {service.distanceOrLocation}
            </span>
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">{service.description}</p>
          <div>
              <Button
                variant="ghost"
                icon={<MessageCircle className="h-4 w-4" />}
                onClick={handleChatProvider}
                loading={chatLoading}
                disabled={!service.storeId}
              >
                {t('serviceDetail.chatProvider')}
              </Button>
              {!service.storeId && (
                <p className="mt-1 text-xs text-text-secondary">{t('chat.demoUnavailable')}</p>
              )}
            </div>
          {chatError && <p className="text-sm text-status-danger">{chatError}</p>}

          <ReportButton
            reportedStoreId={service.storeId}
            reportedStoreName={service.providerName}
            context={{ serviceId: service.id, serviceLabel: service.providerName }}
          />
        </div>

        {service.packages.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="font-heading text-xl font-bold text-text-primary">{t('serviceDetail.servicePackages')}</h2>
            <div className="space-y-3">
              {service.packages.map((item) => (
                <div
                  key={item.id}
                  className={selectedPackage === item.id ? 'ring-2 ring-brand-burgundy rounded-2xl' : ''}
                >
                  <PackageCard {...item} onSelect={() => setSelectedPackage(item.id)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">{t('serviceDetail.portfolioGallery')}</h2>
          <PortfolioGallery images={Array.from({ length: service.imageCount })} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">{t('serviceDetail.reviewsAndRating')}</h2>
          <RatingSummary
            averageRating={service.rating}
            totalReviews={service.reviewCount}
            distribution={getRatingDistribution(reviews)}
          />
          <div className="flex flex-wrap gap-2">
            {serviceReviewTags.map((tag) => (
              <span
                key={tag.label}
                className="rounded-full bg-brand-peach px-3 py-1 text-xs font-medium text-brand-burgundy"
              >
                {tag.label} ({tag.count})
              </span>
            ))}
          </div>
          <ReviewFilterBar value={reviewFilter} onChange={setReviewFilter} />
          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review.id}
                reviewerName={review.reviewerName}
                rating={review.rating}
                date={review.date}
                comment={review.comment}
                buyerPhotos={review.buyerPhotoCount}
              />
            ))}
          </div>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
      </div>
      <StickyActionBar
        onPrimary={() =>
          navigate(`/booking/${service.id}`, {
            state: selectedPackage ? { packageId: selectedPackage } : undefined,
          })
        }
      />
    </>
  );
}
