/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Regular headings (h2/h3/etc.) use the same clean sans as body
        // text — the distinctive display font is reserved for the H1 only
        // (see `hero` below), so it doesn't feel overused site-wide.
        heading: ['var(--font-heading)', 'Inter', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        // Lilita One — distinctive, chunky display font used ONLY for the
        // page H1 (Hero, About Us hero). Alias so existing `font-hero`
        // usages keep working.
        hero: ['var(--font-hero)', 'Lilita One', 'cursive'],
      },
      colors: {
        brand: {
          orange: {
            start: '#FF9A3C',
            end: '#F4A261',
          },
          // NOTE: this key is still called "burgundy" (kept so the ~65
          // existing `bg-brand-burgundy` / `text-brand-burgundy` usages
          // across the whole site don't need to be touched file-by-file),
          // but the color itself is now the PetHouse-style deep navy blue.
          // Changing this one value re-skins the entire site's primary
          // dark accent (nav, headings, buttons, icons) in one place.
          burgundy: '#1E2A6B',
          'burgundy-dark': '#131A44',
          mist: '#CFD4F2',
          // Same trick for "peach": now a soft blush pink instead of peach,
          // used for light panel backgrounds site-wide.
          peach: '#FBD9E3',
          // Stronger pink accent for hero/section blocks (new).
          pink: '#F6A9BE',
          cream: '#FDF8F0',
        },
        text: {
          primary: '#1B1F3B',
          secondary: '#5C6079',
        },
        status: {
          success: '#6FCF97',
          warning: '#E9C46A',
          danger: '#E76F51',
        },
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};