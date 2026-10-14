import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import StatusPill from '../../components/dashboard/StatusPill';
import ApprovalBadge from '../../components/admin/ApprovalBadge';
import ProductFormModal from '../../components/dashboard/ProductFormModal';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { useDashboard } from '../../hooks/useDashboard';
import { productCategories, DASHBOARD_PAGE_SIZE } from '../../data/mockDashboard';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function DashboardProductsPage() {
  const { t } = useLanguage();
  const statusFilterOptions = [
    { value: 'all', label: t('dashboardProducts.statusAll') },
    { value: 'aktif', label: t('dashboardProducts.statusActive') },
    { value: 'nonaktif', label: t('dashboardProducts.statusInactive') },
    { value: 'habis', label: t('dashboardProducts.statusOutOfStock') },
  ];
  const { products, isLoadingProducts, productsError, addProduct, updateProduct, deleteProduct } = useDashboard();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      const matchesStatus = status === 'all' || p.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  const pageItems = filtered.slice((page - 1) * DASHBOARD_PAGE_SIZE, page * DASHBOARD_PAGE_SIZE);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await addProduct(data);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleFilterChange(setQuery)(e.target.value)}
            placeholder={t('dashboardProducts.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={[{ value: 'all', label: t('dashboardProducts.allCategories') }, ...productCategories.map((c) => ({ value: c, label: c }))]}
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
            className="w-40"
          />
          <Select
            options={statusFilterOptions}
            value={status}
            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
            className="w-40"
          />
          <Button variant="orange" icon={<Plus className="h-4 w-4" />} onClick={openAdd} playful={false}>
            {t('dashboardProducts.addProduct')}
          </Button>
        </div>
      </div>

      {productsError && (
        <div className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
          {productsError}
        </div>
      )}

      {isLoadingProducts ? (
        <Card className="flex items-center justify-center py-12 text-sm text-text-secondary">
          Memuat produk...
        </Card>
      ) : pageItems.length === 0 ? (
        <EmptyState
          title={t('dashboardProducts.emptyTitle')}
          subtitle={t('dashboardProducts.emptySubtitle')}
          action={
            <Button variant="orange" icon={<Plus className="h-4 w-4" />} onClick={openAdd} playful={false}>
              {t('dashboardProducts.addProduct')}
            </Button>
          }
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-brand-cream/50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th className="px-5 py-3">{t('dashboardProducts.colProduct')}</th>
                  <th className="px-5 py-3">{t('dashboardProducts.colCategory')}</th>
                  <th className="px-5 py-3">{t('dashboardProducts.colPrice')}</th>
                  <th className="px-5 py-3">{t('dashboardProducts.colStock')}</th>
                  <th className="px-5 py-3">{t('dashboardProducts.colSold')}</th>
                  <th className="px-5 py-3">{t('dashboardProducts.colStatus')}</th>
                  <th className="px-5 py-3 text-right">{t('dashboardProducts.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-brand-cream/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <ImagePlaceholder className="h-11 w-11 shrink-0 rounded-lg" alt={product.name} />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{product.name}</p>
                          <p className="text-xs text-text-secondary">{product.sku}</p>
                                                  {product.approvalStatus === 'rejected' && product.rejectionReason && (
                            <p className="mt-0.5 max-w-xs whitespace-normal text-xs text-status-danger">
                              Ditolak admin: {product.rejectionReason}
                            </p>
                          )}
                          {product.approvalStatus === 'pending' && (
                            <p className="mt-0.5 text-xs text-text-secondary">Menunggu persetujuan admin sebelum tayang.</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{product.category}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{product.stock}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{product.sold}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={product.status} />
                        {product.approvalStatus !== 'approved' && <ApprovalBadge status={product.approvalStatus} />}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-peach hover:text-brand-burgundy"
                          aria-label={t('dashboardProducts.editAria').replace('{value}', product.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                          aria-label={t('dashboardProducts.deleteAria').replace('{value}', product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-4">
            <Pagination page={page} pageSize={DASHBOARD_PAGE_SIZE} total={filtered.length} itemLabel={t('dashboardProducts.itemLabel')} onPageChange={setPage} />
          </div>
        </Card>
      )}

      <ProductFormModal
        open={modalOpen}
        initialProduct={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('dashboardProducts.deleteConfirmTitle')}
        description={deleteTarget ? t('dashboardProducts.deleteConfirmDesc').replace('{value}', deleteTarget.name) : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
