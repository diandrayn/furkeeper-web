import { Inter, Lilita_One } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const lilita = Lilita_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lilita',
  display: 'swap',
});

export const metadata = {
  title: 'FurKeeper — Marketplace Produk & Jasa Hewan Peliharaan',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${lilita.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
