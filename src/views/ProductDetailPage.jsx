import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router';
import { MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import ImageGallery from '../components/ImageGallery';
import VariantSelector from '../components/VariantSelector';
import QuantityStepper from '../components/QuantityStepper';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StoreInfoCard from '../components/StoreInfoCard';
import ReportButton from '../components/ReportButton';
import RatingSummary from '../components/RatingSummary';
import ReviewFilterBar from '../components/ReviewFilterBar';
import ReviewCard from '../components/ReviewCard';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import { formatPrice, formatSoldCount } from '../utils/validation';
import { usePublicProducts, findProductById, getRelatedProducts } from '../hooks/usePublicProducts';
import { getRatingDistribution, getReviewsForTarget } from '../data/mockReviews';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addItem, buyNow } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { findOrCreateConversation } = useChat();
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  // Seller/service-provider accounts are a separate role from buyers in
  // this app (see registerInit) — they can browse the catalog but can't
  // purchase from it themselves.
  const isSellerAccount = Boolean(user?.role && user.role !== 'buyer');
  const { products } = usePublicProducts();
  const product = findProductById(products, id);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(product?.variants?.[0] || '');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [cartNotice, setCartNotice] = useState('');

  const reviews = useMemo(() => (product ? getReviewsForTarget(product.id) : []), [product]);
  const visibleReviews = reviews.filter((review) =>
    reviewFilter === 'all' ? true : review.rating === Number(reviewFilter),
  );
  const related = product ? getRelatedProducts(products, product) : [];

  const cartPayload = product
    ? {
        productId: product.id,
        name: product.name,
        variant,
        price: product.price,
        quantity: qty,
        storeName: product.storeName,
        storeId: product.storeId,
        stock: product.stock,
      }
    : null;

  const handleAddToCart = () => {
    if (!cartPayload) return;
    addItem(cartPayload);
    setCartNotice(t('productDetail.addedToCart'));
    window.setTimeout(() => setCartNotice(''), 2500);
  };

  const handleBuyNow = () => {
    if (!cartPayload) return;
    buyNow(cartPayload);
    navigate('/checkout');
  };

  const handleChatSeller = async () => {
    if (!product?.storeId) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/produk/${product.id}` } } });
      return;
    }
    setChatError('');
    setChatLoading(true);
    try {
      const conversationId = await findOrCreateConversation(product.storeId, {
        type: 'product',
        thumbnail: product.imageUrl,
        title: product.name,
        linkTo: `/produk/${product.id}`,
      });
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(err.message || 'Gagal membuka chat, coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  if (!product) {
    return (
      <>
        <Navbar activeLink="Produk" />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('productDetail.notFoundTitle')}</h1>
          <Link to="/produk" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('productDetail.backToProducts')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar activeLink="Produk" />
      <main className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ImageGallery
            count={product.imageCount}
            images={product.imageUrl ? [product.imageUrl] : undefined}
            badge={product.badge}
            alt={product.name}
          />

          <div className="space-y-5">
            <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">
              {product.name}
            </h1>
            <p className="text-sm text-text-secondary">
              {t('productDetail.starsAndSold')
                .replace('{rating}', product.rating)
                .replace('{sold}', formatSoldCount(product.soldCount))
                .replace('{reviews}', product.reviewCount)}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <p className="font-heading text-3xl font-bold text-brand-burgundy">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice != null && (
                <span className="text-sm text-text-secondary line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.discountPercent ? (
                <Badge variant="discount" label={`-${product.discountPercent}%`} />
              ) : null}
            </div>

            {product.variants.length > 0 && (
              <VariantSelector
                options={product.variants}
                value={variant}
                onChange={setVariant}
              />
            )}

            <QuantityStepper min={1} max={product.stock} value={qty} onChange={setQty} />

            <div className="flex flex-col gap-3 sm:flex-row">
              {isSellerAccount ? (
                <p className="w-full rounded-xl bg-brand-cream px-4 py-3 text-center text-sm text-text-secondary">
                  Akun penjual/penyedia jasa tidak dapat membeli produk.
                </p>
              ) : (
                <>
                  <Button variant="outline" fullWidth onClick={handleAddToCart}>
                    {t('productDetail.addToCart')}
                  </Button>
                  <Button variant="primary" fullWidth onClick={handleBuyNow}>
                    {t('productDetail.buyNow')}
                  </Button>
                </>
              )}
            </div>
            {cartNotice ? (
              <p className="text-sm font-medium text-status-success" role="status">
                {cartNotice}
              </p>
            ) : null}

            {!isSellerAccount && (
              <div>
                <Button
                  variant="ghost"
                  icon={<MessageCircle className="h-4 w-4" />}
                  onClick={handleChatSeller}
                  loading={chatLoading}
                  disabled={!product.storeId}
                >
                  {t('productDetail.chatSeller')}
                </Button>
                {!product.storeId && (
                  <p className="mt-1 text-xs text-text-secondary">{t('chat.demoUnavailable')}</p>
                )}
              </div>
            )}
            {chatError && <p className="text-sm text-status-danger">{chatError}</p>}

            <ReportButton
              reportedStoreId={product.storeId}
              reportedStoreName={product.storeName}
              context={{ productId: product.id, productLabel: product.name }}
            />
          </div>
        </div>

        <section className="mt-12 space-y-3">
          <h2 className="font-heading text-xl font-bold text-text-primary">{t('productDetail.description')}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">{product.description}</p>
        </section>

        <section className="mt-10">
          <StoreInfoCard
            storeName={product.storeName}
            storeId={product.storeId}
            rating={product.storeRating}
            location={product.storeLocation}
            trusted={product.storeTrusted}
          />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">{t('productDetail.reviewsAndRating')}</h2>
          <RatingSummary
            averageRating={product.rating}
            totalReviews={product.reviewCount}
            distribution={getRatingDistribution(reviews)}
          />
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

        <section className="mt-12">
          <SectionHeader title={t('productDetail.relatedProducts')} />
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {related.map((item) => (
              <div key={item.id} className="w-56 shrink-0 sm:w-64">
                <ProductCard {...item} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
