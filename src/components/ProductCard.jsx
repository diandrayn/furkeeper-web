import { useState } from 'react';
import { Heart, Star, Store, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImagePlaceholder from './ImagePlaceholder';
import Badge from './Badge';
import { formatPrice, formatSoldCount } from '../utils/validation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProductCard({
  id,
  image,
  imageUrl,
  badge,
  name,
  storeName,
  storeId,
  price,
  originalPrice,
  discountPercent,
  rating,
  soldCount,
  sold,
  isWishlisted,
  onWishlistToggle,
  to,
}) {
  const [internalWish, setInternalWish] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const isBuyerAccount = !user || user.role === 'buyer';
  const wishlisted = onWishlistToggle ? Boolean(isWishlisted) : internalWish;
  const href = to || (id != null ? `/produk/${id}` : undefined);
  const storeHref = storeId != null ? `/toko/${storeId}` : undefined;
  const soldLabel = formatSoldCount(soldCount ?? sold);
  const { addItem } = useCart();

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onWishlistToggle) onWishlistToggle();
    else setInternalWish((value) => !value);
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItem({ productId: id, name, price, quantity: 1, storeName, storeId });
  };

  const imageSection = (
    <div className="relative">
      {href ? (
        <Link to={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="aspect-square w-full rounded-t-2xl object-cover"
            />
          ) : (
            <ImagePlaceholder
              className="aspect-square w-full rounded-t-2xl"
              alt={image || `Gambar produk ${name}`}
            />
          )}
        </Link>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="aspect-square w-full rounded-t-2xl object-cover"
        />
      ) : (
        <ImagePlaceholder
          className="aspect-square w-full rounded-t-2xl"
          alt={image || `Gambar produk ${name}`}
        />
      )}
      {badge && (
        <div className="absolute left-3 top-3">
          <Badge variant={badge} />
        </div>
      )}
      <button
        type="button"
        onClick={handleWishlist}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all duration-200 hover:scale-110"
        aria-label={wishlisted ? t('badges.wishlistRemove') : t('badges.wishlistAdd')}
      >
        <Heart
          className={`h-4 w-4 transition-colors duration-200 ${
            wishlisted ? 'fill-status-danger text-status-danger' : 'text-gray-400'
          }`}
        />
      </button>
    </div>
  );

  return (
    <article className="playful-interactive group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md">
      {imageSection}

      <div className="flex flex-1 flex-col space-y-2 p-4">
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
          <span>
            {rating} ({soldLabel} {t('common.sold')})
          </span>
        </div>

        {href ? (
          <Link
            to={href}
            className="line-clamp-2 text-sm font-medium leading-snug text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
          >
            {name}
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-text-primary">{name}</h3>
        )}

        {storeName && (
          <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {storeHref ? (
              <Link
                to={storeHref}
                className="truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
              >
                {storeName}
              </Link>
            ) : (
              <span>{storeName}</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-base text-brand-burgundy">
            {formatPrice(price)}
          </p>
          {originalPrice != null && (
            <span className="text-xs text-text-secondary line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
          {discountPercent ? (
            <Badge variant="discount" label={`-${discountPercent}%`} />
          ) : null}
        </div>
      </div>

      {isBuyerAccount && (
        <button
          type="button"
          onClick={handleAddToCart}
          className="playful-interactive flex items-center justify-center gap-2 bg-brand-burgundy py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-burgundy/90"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {t('productDetail.addToCart')}
        </button>
      )}
    </article>
  );
}