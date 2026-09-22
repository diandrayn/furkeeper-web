import Input from './Input';
import Select from './Select';

export default function HistoryFilterBar({
  status,
  onStatusChange,
  statusOptions,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  query,
  onQueryChange,
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select label="Status" options={statusOptions} value={status} onChange={(e) => onStatusChange(e.target.value)} />
      <Input label="Dari tanggal" type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
      <Input label="Sampai tanggal" type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
      <Input label="Cari" placeholder="Cari..." value={query} onChange={(e) => onQueryChange(e.target.value)} />
    </div>
  );
}
