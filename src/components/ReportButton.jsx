import { useState } from 'react';
import { useLocation, useNavigate } from '@/lib/router';
import { Flag, Package, ShoppingBag, Scissors, CalendarClock, Store } from 'lucide-react';
import Button from './Button';
import Select from './Select';
import Textarea from './Textarea';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../i18n/LanguageContext';
import { submitReport, REPORT_CATEGORY_LABELS, ReportError } from '../utils/reports';

const CATEGORY_OPTIONS = Object.entries(REPORT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const MIN_DESCRIPTION_LENGTH = 20;

/**
 * "Laporkan" button (bendera, gaya tidak mencolok) + modal formnya —
 * dipakai di ProductDetailPage, ServiceDetailPage, OrderStatusPage, dan
 * BookingStatusPage (Poin 4 §A–B). Tidak render apa pun kalau
 * `reportedStoreId` kosong — artinya toko/jasanya bukan data Supabase
 * nyata (misalnya masih katalog demo/mock), jadi tidak ada toko yang
 * benar-benar bisa dilaporkan.
 *
 * `context` boleh berisi salah satu (atau lebih) dari: orderId +
 * orderLabel, bookingId + bookingLabel, productId + productLabel,
 * serviceId + serviceLabel — dipakai untuk mengisi reports.order_id /
 * booking_id / product_id / service_id otomatis dan ditampilkan
 * read-only di modal.
 */
export default function ReportButton({ reportedStoreId, reportedStoreName, context = {}, className = '' }) {
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { pushNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!reportedStoreId) return null;

  const handleOpen = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: location.pathname } } });
      return;
    }
    setOpen(true);
  };

  const handleSuccess = (reportId) => {
    setOpen(false);
    pushNotification({
      id: `report-submitted-${reportId}`,
      type: 'report_submitted',
      title: t('report.toastTitle'),
      message: t('report.toastBody'),
      linkTo: `/bantuan-saya?tab=laporan&id=${reportId}`,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-status-danger ${className}`}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {t('report.button')}
      </button>
      {open && (
        <ReportModal
          reportedStoreId={reportedStoreId}
          reportedStoreName={reportedStoreName}
          context={context}
          reporterId={user?.id}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

function ReportModal({ reportedStoreId, reportedStoreName, context, reporterId, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = Boolean(category) && description.trim().length >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit || !reporterId) return;
    setSubmitting(true);
    setError('');
    try {
      const reportId = await submitReport({
        reporterId,
        reportedStoreId,
        category,
        description: description.trim(),
        orderId: context.orderId || null,
        bookingId: context.bookingId || null,
        productId: context.productId || null,
        serviceId: context.serviceId || null,
      });
      onSuccess(reportId);
    } catch (err) {
      if (err instanceof ReportError) {
        setError(err.code === 'self' ? t('report.errorSelf') : t('report.errorDuplicate'));
      } else {
        console.error('submitReport failed:', err);
        setError(t('report.errorGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">{t('report.modalTitle')}</h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-brand-burgundy">
            {t('report.close')}
          </button>
        </div>

        <div className="mb-4 space-y-1.5 rounded-2xl bg-brand-cream/50 p-3 text-xs text-text-secondary">
          <p className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 shrink-0" />
            {t('report.reportedLabel')} <span className="font-medium text-text-primary">{reportedStoreName}</span>
          </p>
          {context.orderLabel && (
            <p className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" /> {context.orderLabel}
            </p>
          )}
          {context.bookingLabel && (
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" /> {context.bookingLabel}
            </p>
          )}
          {context.productLabel && (
            <p className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0" /> {context.productLabel}
            </p>
          )}
          {context.serviceLabel && (
            <p className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 shrink-0" /> {context.serviceLabel}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Select
            label={t('report.categoryLabel')}
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORY_OPTIONS}
            placeholder={t('report.categoryPlaceholder')}
          />
          <Textarea
            label={t('report.descriptionLabel')}
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('report.descriptionPlaceholder')}
            maxLength={1000}
            showCharCount
          />
          {description.length > 0 && description.trim().length < MIN_DESCRIPTION_LENGTH && (
            <p className="-mt-2 text-xs text-status-danger">{t('report.descriptionTooShort')}</p>
          )}

          {error && (
            <p className="text-sm text-status-danger" role="alert">
              {error}
            </p>
          )}

          <Button variant="primary" fullWidth loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>
            {t('report.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
