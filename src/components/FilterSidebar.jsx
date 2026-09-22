import { Star } from 'lucide-react';
import Button from './Button';
import Select from './Select';
import Checkbox from './Checkbox';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

function DualRangeSlider({ min, max, minValue, maxValue, onChange }) {
  const span = max - min || 1;
  const left = ((minValue - min) / span) * 100;
  const right = ((maxValue - min) / span) * 100;

  return (
    <div>
      <p className="text-xs text-text-secondary">
        {formatPrice(minValue)} – {formatPrice(maxValue)}
      </p>
      <div className="relative mt-4 h-8">
        <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute top-3 h-1.5 rounded-full bg-brand-burgundy"
          style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), maxValue - 1000);
            onChange({ minValue: Math.max(min, next), maxValue });
          }}
          className="dual-range top-2"
          aria-label="Harga minimum"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), minValue + 1000);
            onChange({ minValue, maxValue: Math.min(max, next) });
          }}
          className="dual-range top-2"
          aria-label="Harga maksimum"
        />
      </div>
    </div>
  );
}

function FilterForm({ sections, values, onChange, onReset }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.id}>
          <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">
            {section.title}
          </h3>

          {section.type === 'checkbox' && (
            <div className="space-y-2.5">
              {section.options.map((option) => {
                const selected = values[section.id] || [];
                return (
                  <Checkbox
                    key={option}
                    id={`${section.id}-${option}`}
                    label={option}
                    checked={selected.includes(option)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option);
                      onChange({ ...values, [section.id]: next });
                    }}
                  />
                );
              })}
            </div>
          )}

          {section.type === 'range' && (
            <DualRangeSlider
              min={section.min}
              max={section.max}
              minValue={values.priceMin}
              maxValue={values.priceMax}
              onChange={({ minValue, maxValue }) =>
                onChange({ ...values, priceMin: minValue, priceMax: maxValue })
              }
            />
          )}

          {section.type === 'radio' && (
            <div className="space-y-2.5">
              {section.options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary"
                >
                  <input
                    type="radio"
                    name={section.id}
                    value={option.value}
                    checked={String(values[section.id]) === String(option.value)}
                    onChange={() => onChange({ ...values, [section.id]: option.value })}
                    className="h-4 w-4 border-gray-300 text-brand-burgundy focus:ring-brand-orange-end/30"
                  />
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {section.type === 'select' && (
            <Select
              label={section.label}
              name={section.id}
              options={section.options}
              value={values[section.id] || ''}
              onChange={(event) =>
                onChange({ ...values, [section.id]: event.target.value })
              }
              placeholder={t('common.allDistricts')}
            />
          )}
        </section>
      ))}

      <Button variant="ghost" fullWidth onClick={onReset}>
        {t('common.resetFilter')}
      </Button>
    </div>
  );
}

export default function FilterSidebar({
  sections,
  values,
  onChange,
  onReset,
  mobileOpen = false,
  onMobileClose,
}) {
  return (
    <>
      <aside className="sticky top-24 hidden h-fit w-[280px] shrink-0 rounded-2xl bg-white p-5 shadow-sm lg:block">
        <FilterForm
          sections={sections}
          values={values}
          onChange={onChange}
          onReset={onReset}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup filter"
            onClick={onMobileClose}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-text-primary">Filter</h2>
              <button
                type="button"
                onClick={onMobileClose}
                className="text-sm font-medium text-brand-burgundy"
              >
                Tutup
              </button>
            </div>
            <FilterForm
              sections={sections}
              values={values}
              onChange={onChange}
              onReset={onReset}
            />
          </div>
        </div>
      )}
    </>
  );
}
