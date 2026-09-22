import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import StatusPill from '../../components/dashboard/StatusPill';
import ApprovalBadge from '../../components/admin/ApprovalBadge';
import ServiceFormModal from '../../components/dashboard/ServiceFormModal';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { useDashboard } from '../../hooks/useDashboard';
import { serviceTypeOptions, DASHBOARD_PAGE_SIZE } from '../../data/mockDashboard';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function DashboardServicesPage() {
  const { t } = useLanguage();
  const statusFilterOptions = [
    { value: 'all', label: t('dashboardServices.statusAll') },
    { value: 'aktif', label: t('dashboardServices.statusActive') },
    { value: 'nonaktif', label: t('dashboardServices.statusInactive') },
  ];
  const { services, isLoadingServices, servicesError, addService, updateService, deleteService } = useDashboard();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesQuery = s.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesType = type === 'all' || s.serviceType === type;
      const matchesStatus = status === 'all' || s.status === status;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [services, query, type, status]);

  const pageItems = filtered.slice((page - 1) * DASHBOARD_PAGE_SIZE, page * DASHBOARD_PAGE_SIZE);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await updateService(editing.id, data);
    } else {
      await addService(data);
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
            placeholder={t('dashboardServices.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-orange-end focus:ring-2 focus:ring-brand-orange-end/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={[{ value: 'all', label: t('dashboardServices.allTypes') }, ...serviceTypeOptions.map((c) => ({ value: c, label: c }))]}
            value={type}
            onChange={(e) => handleFilterChange(setType)(e.target.value)}
            className="w-44"
          />
          <Select
            options={statusFilterOptions}
            value={status}
            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
            className="w-40"
          />
          <Button variant="orange" icon={<Plus className="h-4 w-4" />} onClick={openAdd} playful={false}>
            {t('dashboardServices.addService')}
          </Button>
        </div>
      </div>

      {servicesError && (
        <div className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
          {servicesError}
        </div>
      )}

      {isLoadingServices ? (
        <Card className="flex items-center justify-center py-12 text-sm text-text-secondary">
          Memuat layanan...
        </Card>
      ) : pageItems.length === 0 ? (
        <EmptyState
          title={t('dashboardServices.emptyTitle')}
          subtitle={t('dashboardServices.emptySubtitle')}
          action={
            <Button variant="orange" icon={<Plus className="h-4 w-4" />} onClick={openAdd} playful={false}>
              {t('dashboardServices.addService')}
            </Button>
          }
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-brand-cream/50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th className="px-5 py-3">{t('dashboardServices.colService')}</th>
                  <th className="px-5 py-3">{t('dashboardServices.colType')}</th>
                  <th className="px-5 py-3">{t('dashboardServices.colPrice')}</th>
                  <th className="px-5 py-3">{t('dashboardServices.colDuration')}</th>
                  <th className="px-5 py-3">{t('dashboardServices.colBooking')}</th>
                  <th className="px-5 py-3">{t('dashboardServices.colStatus')}</th>
                  <th className="px-5 py-3 text-right">{t('dashboardServices.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((service) => (
                  <tr key={service.id} className="transition-colors hover:bg-brand-cream/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <ImagePlaceholder className="h-11 w-11 shrink-0 rounded-lg" alt={service.name} />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{service.name}</p>
                          {service.approvalStatus === 'rejected' && service.rejectionReason && (
                            <p className="mt-0.5 max-w-xs whitespace-normal text-xs text-status-danger">
                              Ditolak admin: {service.rejectionReason}
                            </p>
                          )}
                          {service.approvalStatus === 'pending' && (
                            <p className="mt-0.5 text-xs text-text-secondary">Menunggu persetujuan admin sebelum tayang.</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{service.serviceType}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-text-primary">
                      {formatRupiah(service.price)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {service.duration}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{service.booked}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={service.status} />
                        {service.approvalStatus !== 'approved' && <ApprovalBadge status={service.approvalStatus} />}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-peach hover:text-brand-burgundy"
                          aria-label={t('dashboardServices.editAria').replace('{value}', service.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(service)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                          aria-label={t('dashboardServices.deleteAria').replace('{value}', service.name)}
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
            <Pagination page={page} pageSize={DASHBOARD_PAGE_SIZE} total={filtered.length} itemLabel={t('dashboardServices.itemLabel')} onPageChange={setPage} />
          </div>
        </Card>
      )}

      <ServiceFormModal
        open={modalOpen}
        initialService={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('dashboardServices.deleteConfirmTitle')}
        description={deleteTarget ? t('dashboardServices.deleteConfirmDesc').replace('{value}', deleteTarget.name) : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteService(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
