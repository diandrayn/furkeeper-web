import { Check } from 'lucide-react';

// Landscape, colored "choice card" for the register role-picker — styled
// after a fruit-card reference: a solid color block, a rounded corner
// "notch" bitten out of the bottom-right edge, and a small circular badge
// sitting in that notch (index number, or a checkmark once selected).
const TONES = {
  pink: 'bg-gradient-to-br from-brand-pink to-brand-peach',
  orange: 'bg-gradient-to-br from-brand-orange-start to-brand-orange-end',
  burgundy: 'bg-gradient-to-br from-brand-burgundy to-[#3d4a9c]',
};

export default function RoleCard({
  icon,
  title,
  description,
  selected,
  onClick,
  tone = 'orange',
  index,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`playful-interactive relative flex w-full flex-col items-start rounded-[28px] p-6 text-left transition-all duration-200 lg:p-7 ${
        TONES[tone] || TONES.orange
      } ${
        selected
          ? 'scale-[1.02] shadow-xl ring-4 ring-white/70'
          : 'shadow-md hover:shadow-lg'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-burgundy shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/85">{description}</p>

      <span
        className={`absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold shadow-md transition-colors duration-200 ${
          selected ? 'bg-white text-brand-orange-end' : 'bg-brand-cream text-text-secondary'
        }`}
        aria-hidden="true"
      >
        {selected ? <Check className="h-5 w-5" /> : index}
      </span>
    </button>
  );
}
