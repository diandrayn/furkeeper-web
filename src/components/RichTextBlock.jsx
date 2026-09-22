/**
 * Renders CMS-style paragraph content.
 * Today: plain string or string[]. Later: swap `paragraphs` for HTML/Markdown
 * from a CMS without changing call sites — keep the prop name and wrapper.
 */
export default function RichTextBlock({ paragraphs, className = '' }) {
  const items = Array.isArray(paragraphs)
    ? paragraphs
    : paragraphs
      ? [paragraphs]
      : [];

  if (items.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((text, index) => (
        <p
          key={index}
          className="text-sm leading-relaxed text-text-secondary md:text-base"
        >
          {text}
        </p>
      ))}
    </div>
  );
}
