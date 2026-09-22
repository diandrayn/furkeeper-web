import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Store, Scissors, Mail, MapPin, Star, ShieldCheck, Zap, Trash2, EyeOff, Eye } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import {
  fetchStoreById,
  fetchProductsByStore,
  fetchServicesByStore,
  setProductActive,
  deleteProductAdmin,
  setServiceActive,
  deleteServiceAdmin,
} from '../../utils/admin';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function AdminStoreDetailPage() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchStoreById(storeId)
      .then((s) => {
        setStore(s);
        return s.kind === 'service' ? fetchServicesByStore(storeId) : fetchProductsByStore(storeId);
      })
      .then(setListings)
      .catch((err) => {
        console.error('fetchStoreById/listings failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [storeId]);

  const isService = store?.kind === 'service';

  const toggleActive = async (item) => {
    setBusyId(item.id);
    try {
      if (isService) await setServiceActive(item.id, !item.isActive, item.name);
      else await setProductActive(item.id, !item.isActive, item.name);
      setListings((prev) => prev.map((l) => (l.id === item.id ? { ...l, isActive: !l.isActive } : l)));
    } catch (err) {
      console.error('toggle listing active failed:', err);
      window.alert('Gagal mengubah status listing.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      if (isService) await deleteServiceAdmin(deleteTarget.id, deleteTarget.name);
      else await deleteProductAdmin(deleteTarget.id, deleteTarget.name);
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('delete listing failed:', err);
      window.alert('Gagal menghapus listing.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <PawLoader label="Memuat toko..." />;

  if (error || !store) {
    return (
      <Card>
        <p className="text-sm text-status-danger">Gagal memuat data toko. Toko mungkin sudah dihapus.</p>
        <Link to="/admin/toko" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-burgundy">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar toko
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/admin/toko" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-burgundy">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar toko
      </Link>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-peach text-brand-burgundy">
              {isService ? <Scissors className="h-6 w-6" /> : <Store className="h-6 w-6" />}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-heading text-lg font-bold text-text-primary">{store.name}</h2>
                {store.trusted && <ShieldCheck className="h-4 w-4 text-status-success" />}
              </div>
              <p className="text-xs text-text-secondary">Pemilik: {store.ownerName}</p>
            </div>
          </div>
          <Badge variant="optional" label={isService ? 'Jasa Grooming' : 'Toko Produk'} />
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm text-text-secondary sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" /> {store.ownerEmail}
          </p>
          {(store.location || store.district) && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> {store.location || store.district}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Star className="h-4 w-4 shrink-0" /> Rating {store.rating.toFixed(1)}
          </p>
          {store.fastResponse && (
            <p className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0" /> Respon Cepat
            </p>
          )}
        </div>
      </Card>

      <div>
        <h3 className="mb-3 font-heading text-base font-bold text-text-primary">
          {isService ? 'Layanan' : 'Produk'} ({listings.length})
        </h3>

        {listings.length === 0 && (
          <EmptyState title={isService ? 'Belum ada layanan' : 'Belum ada produk'} subtitle="Toko ini belum menambahkan listing apa pun." />
        )}

        {listings.length > 0 && (
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {listings.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <ImagePlaceholder className="h-12 w-12 shrink-0 rounded-xl" alt="" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{item.name}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {isService ? `mulai ${formatRupiah(item.priceFrom)}` : formatRupiah(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? 'active' : 'rejected'} label={item.isActive ? 'Aktif' : 'Nonaktif'} />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      loading={busyId === item.id}
                      onClick={() => toggleActive(item)}
                      playful={false}
                    >
                      {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 className="h-4 w-4" />}
                      className="!text-status-danger hover:!bg-status-danger/5"
                      disabled={busyId === item.id}
                      onClick={() => setDeleteTarget(item)}
                      playful={false}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Hapus "${deleteTarget?.name}"?`}
        description="Listing akan dihapus permanen dari platform. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
