import { ChevronDown } from 'lucide-react';

export default function AccordionItem({
  question,
  answer,
  isOpen = false,
  onToggle,
  className = '',
}) {
  return (
    <div
      className={`border-b border-gray-200 last:border-b-0 ${className}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-200 hover:text-brand-burgundy"
      >
        <span className="font-heading text-sm font-semibold text-text-primary md:text-base">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm leading-relaxed text-text-secondary">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
