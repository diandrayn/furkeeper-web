import RichTextBlock from './RichTextBlock';
import { stripSectionNumber } from '../utils/legalContent';

function DefinitionList({ items }) {
  if (!items?.length) return null;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.term} className="text-sm leading-relaxed text-text-secondary md:text-base">
          <span className="font-semibold text-text-primary">{item.term}</span>
          {': '}
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }) {
  if (!items?.length) return null;

  return (
    <ol className="list-decimal space-y-3 pl-5">
      {items.map((text, index) => (
        <li key={index} className="text-sm leading-relaxed text-text-secondary md:text-base">
          {text}
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;

  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((text, index) => (
        <li key={index} className="text-sm leading-relaxed text-text-secondary md:text-base">
          {text}
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders legal content as numbered section cards. Works for both the
 * bundled templates and parsed admin bodies — both arrive here as
 * `{ id, title, paragraphs?, definitions?, numbered?, bullets?, paragraphsAfter? }[]`.
 */
export default function LegalDocument({ content }) {
  const sections = content?.sections || [];

  return (
    <article className="space-y-6">
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-title`}
          className="scroll-mt-28 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <header className="flex items-start gap-3.5 border-b border-gray-100 px-5 py-4 md:gap-4 md:px-7 md:py-5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-burgundy/10 font-heading text-sm font-bold text-brand-burgundy"
            >
              {index + 1}
            </span>
            <h2
              id={`${section.id}-title`}
              className="pt-0.5 font-heading text-lg font-bold leading-snug text-text-primary md:text-xl"
            >
              {stripSectionNumber(section.title)}
            </h2>
          </header>
          <div className="space-y-4 px-5 py-5 md:px-7 md:py-6">
            <RichTextBlock paragraphs={section.paragraphs} />
            <DefinitionList items={section.definitions} />
            <NumberedList items={section.numbered} />
            <BulletList items={section.bullets} />
            <RichTextBlock paragraphs={section.paragraphsAfter} />
          </div>
        </section>
      ))}
    </article>
  );
}