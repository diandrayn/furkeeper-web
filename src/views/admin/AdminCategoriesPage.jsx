import { useEffect, useMemo, useState } from 'react';
import { Package, Scissors, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import PawLoader from '../../components/decorative/PawLoader';
import { fetchCategoryTree, createCategory, renameCategory, deleteCategory, moveCategory } from '../../utils/admin';

const TABS = [
  { key: 'product', label: 'Kategori Produk', icon: Package },
  { key: 'service', label: 'Kategori Jasa', icon: Scissors },
];

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState('product');
  const [tree, setTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopLevelName, setNewTopLevelName] = useState('');
  const [addingSubFor, setAddingSubFor] = useState(null); // parent category id
  const [newSubName, setNewSubName] = useState('');
  const [editing, setEditing] = useState(null); // { id, parentId }
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setIsLoading(true);
    fetchCategoryTree(tab)
      .then(setTree)
      .catch((err) => {
        console.error('fetchCategoryTree failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [tab]);

  useEffect(() => {
    setNewTopLevelName('');
    setAddingSubFor(null);
    setNewSubName('');
    setEditing(null);
  }, [tab]);

  const handleAddTopLevel = async () => {
    if (!newTopLevelName.trim()) return;
    setBusy(true);
    try {
      await createCategory(tab, { name: newTopLevelName.trim() });
      setNewTopLevelName('');
      load();
    } catch (err) {
      console.error('createCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleAddSub = async (parentId) => {
    if (!newSubName.trim()) return;
    setBusy(true);
    try {
      await createCategory(tab, { name: newSubName.trim(), parentId });
      setNewSubName('');
      setAddingSubFor(null);
      load();
    } catch (err) {
      console.error('createCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!editing || !editName.trim()) return;
    setBusy(true);
    try {
      await renameCategory(tab, editing.id, editName.trim());
      setEditing(null);
      load();
    } catch (err) {
      console.error('renameCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteCategory(tab, deleteTarget.id, deleteTarget.name);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('deleteCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleMoveTopLevel = async (id, direction) => {
    setBusy(true);
    try {
      await moveCategory(tab, tree, id, direction);
      load();
    } catch (err) {
      console.error('moveCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleMoveSub = async (parent, id, direction) => {
    setBusy(true);
    try {
      await moveCategory(tab, parent.children, id, direction);
      load();
    } catch (err) {
      console.error('moveCategory failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              tab === t.key ? 'bg-brand-burgundy text-white' : 'text-text-secondary hover:text-brand-burgundy'
            }`}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            className="flex-1"
            placeholder={tab === 'product' ? 'Nama kategori produk baru...' : 'Nama kategori jasa baru...'}
            value={newTopLevelName}
            onChange={(e) => setNewTopLevelName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopLevel()}
          />
          <Button icon={<Plus className="h-4 w-4" />} onClick={handleAddTopLevel} loading={busy} disabled={!newTopLevelName.trim()}>
            Tambah Kategori
          </Button>
        </div>
      </Card>

      {isLoading && <PawLoader label="Memuat kategori..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/categories_migration.sql</code> sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && tree.length === 0 && (
        <EmptyState title="Belum ada kategori" subtitle="Tambahkan kategori pertama lewat kolom di atas." />
      )}

      {!isLoading && !error && tree.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {tree.map((category, index) => (
              <div key={category.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  {editing?.id === category.id ? (
                    <EditRow
                      value={editName}
                      onChange={setEditName}
                      onSave={handleRename}
                      onCancel={() => setEditing(null)}
                      busy={busy}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-text-primary">{category.name}</p>
                      <div className="flex items-center gap-1">
                        <IconButton
                          disabled={index === 0}
                          onClick={() => handleMoveTopLevel(category.id, 'up')}
                          icon={<ChevronUp className="h-4 w-4" />}
                          label="Naikkan urutan"
                        />
                        <IconButton
                          disabled={index === tree.length - 1}
                          onClick={() => handleMoveTopLevel(category.id, 'down')}
                          icon={<ChevronDown className="h-4 w-4" />}
                          label="Turunkan urutan"
                        />
                        <IconButton
                          onClick={() => setAddingSubFor(addingSubFor === category.id ? null : category.id)}
                          icon={<Plus className="h-4 w-4" />}
                          label="Tambah subkategori"
                        />
                        <IconButton
                          onClick={() => {
                            setEditing({ id: category.id });
                            setEditName(category.name);
                          }}
                          icon={<Pencil className="h-4 w-4" />}
                          label="Ubah nama"
                        />
                        <IconButton
                          onClick={() => setDeleteTarget(category)}
                          icon={<Trash2 className="h-4 w-4" />}
                          label="Hapus kategori"
                          danger
                        />
                      </div>
                    </>
                  )}
                </div>

                {category.children.length > 0 && (
                  <div className="space-y-1 bg-brand-cream/40 px-4 pb-3 pl-8">
                    {category.children.map((sub, subIndex) => (
                      <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        {editing?.id === sub.id ? (
                          <EditRow
                            value={editName}
                            onChange={setEditName}
                            onSave={handleRename}
                            onCancel={() => setEditing(null)}
                            busy={busy}
                          />
                        ) : (
                          <>
                            <p className="text-xs text-text-primary">{sub.name}</p>
                            <div className="flex items-center gap-1">
                              <IconButton
                                disabled={subIndex === 0}
                                onClick={() => handleMoveSub(category, sub.id, 'up')}
                                icon={<ChevronUp className="h-3.5 w-3.5" />}
                                label="Naikkan urutan"
                              />
                              <IconButton
                                disabled={subIndex === category.children.length - 1}
                                onClick={() => handleMoveSub(category, sub.id, 'down')}
                                icon={<ChevronDown className="h-3.5 w-3.5" />}
                                label="Turunkan urutan"
                              />
                              <IconButton
                                onClick={() => {
                                  setEditing({ id: sub.id, parentId: category.id });
                                  setEditName(sub.name);
                                }}
                                icon={<Pencil className="h-3.5 w-3.5" />}
                                label="Ubah nama"
                              />
                              <IconButton
                                onClick={() => setDeleteTarget(sub)}
                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                label="Hapus subkategori"
                                danger
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {addingSubFor === category.id && (
                  <div className="flex flex-col gap-2 bg-brand-cream/40 px-4 pb-4 pl-8 sm:flex-row">
                    <Input
                      className="flex-1"
                      placeholder="Nama subkategori..."
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSub(category.id)}
                    />
                    <Button size="sm" onClick={() => handleAddSub(category.id)} loading={busy} disabled={!newSubName.trim()}>
                      Tambah
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus kategori?"
        description={`"${deleteTarget?.name}" akan dihapus${deleteTarget?.children?.length ? ' beserta seluruh subkategorinya' : ''}. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function IconButton({ onClick, icon, label, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-30 ${
        danger ? 'text-status-danger hover:bg-status-danger/10' : 'text-text-secondary hover:bg-brand-peach hover:text-brand-burgundy'
      }`}
    >
      {icon}
    </button>
  );
}

function EditRow({ value, onChange, onSave, onCancel, busy }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <Input
        className="flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        autoFocus
      />
      <IconButton onClick={onSave} icon={<Check className="h-4 w-4" />} label="Simpan" disabled={busy} />
      <IconButton onClick={onCancel} icon={<X className="h-4 w-4" />} label="Batal" />
    </div>
  );
}
