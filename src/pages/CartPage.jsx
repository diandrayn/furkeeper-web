import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import StoreGroup from '../components/StoreGroup';
import OrderSummaryCard from '../components/OrderSummaryCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

function groupByStore(items) {
  const groups = [];
  items.forEach((item) => {
    const existing = groups.find((group) => group.storeName === item.storeName);
    if (existing) existing.items.push(item);
    else groups.push({ storeName: item.storeName, items: [item] });
  });
  return groups;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Seller/service-provider accounts have no cart — this only covers a
  // direct URL visit; the icon/buttons that lead here are already hidden
  // for them elsewhere (Navbar, ProductCard, ProductDetailPage).
  useEffect(() => {
    if (user?.role && user.role !== 'buyer') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const { t } = useLanguage();
  const {
    items,
    updateQuantity,
    removeItem,
    toggleItem,
    toggleStore,
    selectedCount,
    selectedSubtotal,
  } = useCart();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-8 pb-40 md:px-6 lg:px-8 lg:pb-12">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('cart.title')}</h1>

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={t('cart.emptyTitle')} subtitle={t('cart.emptySubtitle')} />
            <div className="mt-6 flex justify-center">
              <Link to="/produk">
                <Button variant="primary">{t('cart.startShopping')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {groupByStore(items).map((group) => (
                <StoreGroup
                  key={group.storeName}
                  storeName={group.storeName}
                  storeId={group.items.find((item) => item.storeId)?.storeId || null}
                  items={group.items}
                  onToggleStore={toggleStore}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                  onCheckToggle={toggleItem}
                />
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24">
                <OrderSummaryCard
                  rows={[
                    { label: t('cart.subtotalLabel'), value: formatPrice(selectedSubtotal) },
                    { label: t('cart.shippingNote'), muted: true, hideValue: true },
                  ]}
                  totalLabel={t('cart.totalLabel')}
                  total={selectedSubtotal}
                  actionLabel={t('cart.checkout')}
                  actionDisabled={selectedCount === 0}
                  helperText={t('cart.selectAtLeastOne')}
                  onAction={() => navigate('/checkout')}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white p-4 shadow-lg lg:hidden">
          <OrderSummaryCard
            rows={[
              { label: t('cart.subtotalLabel'), value: formatPrice(selectedSubtotal) },
              { label: t('cart.shippingNote'), muted: true, hideValue: true },
            ]}
            totalLabel={t('cart.totalLabel')}
            total={selectedSubtotal}
            actionLabel={t('cart.checkout')}
            actionDisabled={selectedCount === 0}
            helperText={t('cart.selectAtLeastOne')}
            onAction={() => navigate('/checkout')}
          />
        </div>
      )}
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
