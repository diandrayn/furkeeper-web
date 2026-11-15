import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import WaveDivider from '../components/decorative/WaveDivider';
import Card from '../components/Card';
import AddressCard from '../components/AddressCard';
import AddressModal from '../components/AddressModal';
import OrderSummaryCard from '../components/OrderSummaryCard';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { useCart } from '../context/CartContext';
import { useAddresses } from '../context/AddressContext';
import { useAuth } from '../hooks/useAuth';
import { getShippingFee } from '../lib/shipping';
import { submitOrder } from '../utils/orders';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

function groupByStore(items) {
  const groups = [];
  items.forEach((item) => {
    const key = item.storeId || item.storeName || 'Toko FurKeeper';
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.items.push(item);
    else groups.push({ key, storeName: item.storeName, storeId: item.storeId || null, items: [item] });
  });
  return groups;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (user?.role && user.role !== 'buyer') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const { t } = useLanguage();
  const { selectedItems, selectedSubtotal, removeChecked, saveCheckoutSnapshot } = useCart();
  const { addresses, addAddress, isLoading: addressesLoading, loadError: addressLoadError } = useAddresses();
  const defaultAddressId = addresses.find((item) => item.isDefault)?.id || addresses[0]?.id || '';
  const [addressId, setAddressId] = useState(defaultAddressId);
  const [modalOpen, setModalOpen] = useState(false);
  const [shippingReadyFor, setShippingReadyFor] = useState(null);

  // Addresses load asynchronously from the API, so the stored selection may
  // not exist yet. Fall back to the default/first address instead of showing
  // the stale mock address or sending an unknown id to the server.
  const activeAddressId = addresses.some((item) => item.id === addressId) ? addressId : defaultAddressId;
  const address = addresses.find((item) => item.id === activeAddressId) || addresses.find((item) => item.isDefault) || addresses[0];
  const groups = useMemo(() => groupByStore(selectedItems), [selectedItems]);

  useEffect(() => {
    const timer = setTimeout(() => setShippingReadyFor(activeAddressId), 900);
    return () => clearTimeout(timer);
  }, [activeAddressId]);

  const shippingReady = shippingReadyFor === activeAddressId;
  const shippingByStore = useMemo(() => {
    if (!address || !shippingReady) return [];
    return groups.map((group) => ({
      storeName: group.storeName,
      fee: getShippingFee(address.district),
    }));
  }, [groups, address, shippingReady]);

  const shippingTotal = shippingByStore.reduce((sum, row) => sum + row.fee, 0);
  const grandTotal = selectedSubtotal + shippingTotal;

  const handlePay = async () => {
    if (!user?.id) return;
    if (!address) {
      setSubmitError(t('checkout.needAddress'));
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const orderIds = [];
      for (const group of groups) {
        // Server recomputes subtotal, shipping, and total from the database.
        const id = await submitOrder({
          addressId: address.id,
          items: group.items.map((item) => ({
            productId: item.productId || null,
            variant: item.variant || '',
            quantity: item.quantity || 1,
          })),
        });
        orderIds.push(id);
      }
      // Keep a snapshot so a failed/expired payment can put the items back
      // into the cart, then clear the active cart to avoid double checkout.
      saveCheckoutSnapshot(selectedItems);
      removeChecked();
      navigate(`/pembayaran/${orderIds.join(',')}`);
    } catch (err) {
      console.error('submitOrder failed:', err);
      setSubmitError(err?.message || 'Gagal membuat pesanan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('checkout.emptyTitle')}</h1>
          <Link to="/keranjang" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('checkout.backToCart')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-8 pb-40 md:px-6 lg:px-8 lg:pb-12">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('checkout.title')}</h1>

        {submitError && (
          <div className="mt-4 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm font-medium text-status-danger">
            {submitError}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('checkout.shippingAddress')}</h2>
              {address ? (
                <AddressCard address={address} onChange={() => setModalOpen(true)} />
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-sm text-text-secondary"
                    role={addressLoadError ? 'alert' : 'status'}
                  >
                    {addressLoadError
                      || (addressesLoading ? t('checkout.loadingAddresses') : t('checkout.noSavedAddress'))}
                  </p>
                  {!addressesLoading && (
                    <Button variant="outline" onClick={() => setModalOpen(true)}>
                      {t('addresses.addNew')}
                    </Button>
                  )}
                  {addressLoadError && (
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      {t('checkout.retryAddressLoad')}
                    </Button>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('checkout.itemSummary')}</h2>
              <div className="space-y-5">
                {groups.map((group) => {
                  const groupStoreId = group.items.find((item) => item.storeId)?.storeId || null;
                  return (
                    <div key={group.storeName}>
                      {groupStoreId ? (
                        <Link
                          to={`/toko/${groupStoreId}`}
                          className="mb-3 inline-block text-sm font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
                        >
                          {group.storeName}
                        </Link>
                      ) : (
                        <p className="mb-3 text-sm font-semibold text-text-primary">{group.storeName}</p>
                      )}
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <ImagePlaceholder className="h-14 w-14 rounded-lg" alt={item.name} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-text-secondary">
                                {item.variant ? `${item.variant} · ` : ''}x{item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-lg font-bold">{t('checkout.shippingCost')}</h2>
              {!shippingReady ? (
                <div className="space-y-3" aria-busy="true" aria-label={t('checkout.calculatingShipping')}>
                  <div className="h-4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              ) : (
                <div className="space-y-2">
                  {shippingByStore.map((row) => (
                    <div key={row.storeName} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{row.storeName}</span>
                      <span className="font-medium">{formatPrice(row.fee)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-2 font-heading text-lg font-bold">{t('checkout.paymentInfoTitle')}</h2>
              <p className="text-sm text-text-secondary">{t('checkout.paymentInfoDesc')}</p>
            </Card>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <OrderSummaryCard
                rows={[
                  { label: t('checkout.subtotalLabel'), value: formatPrice(selectedSubtotal) },
                  { label: t('checkout.shippingTotalLabel'), value: shippingReady ? formatPrice(shippingTotal) : '...' },
                ]}
                totalLabel={t('checkout.totalPayLabel')}
                total={shippingReady ? grandTotal : selectedSubtotal}
                actionLabel={t('checkout.payNow')}
                actionDisabled={!shippingReady || addressesLoading || !address || submitting}
                helperText={
                  addressesLoading
                    ? t('checkout.loadingAddresses')
                    : addressLoadError || (!address ? t('checkout.noSavedAddress') : undefined)
                }
                onAction={handlePay}
              />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white p-4 shadow-lg lg:hidden">
        <OrderSummaryCard
          rows={[
            { label: t('checkout.subtotalLabel'), value: formatPrice(selectedSubtotal) },
            { label: t('checkout.shippingTotalLabel'), value: shippingReady ? formatPrice(shippingTotal) : '...' },
          ]}
          totalLabel={t('checkout.totalPayLabel')}
          total={shippingReady ? grandTotal : selectedSubtotal}
          actionLabel={t('checkout.payNow')}
          actionDisabled={!shippingReady || addressesLoading || !address || submitting}
          helperText={
            addressesLoading
              ? t('checkout.loadingAddresses')
              : addressLoadError || (!address ? t('checkout.noSavedAddress') : undefined)
          }
          onAction={handlePay}
        />
      </div>

      <AddressModal
        open={modalOpen}
        addresses={addresses}
        selectedId={activeAddressId}
        onSelect={(id) => {
          setAddressId(id);
          setModalOpen(false);
        }}
        onAdd={async (newAddress) => {
          const saved = await addAddress(newAddress);
          setAddressId(saved?.id || newAddress.id);
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
