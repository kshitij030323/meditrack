import type { Metadata } from 'next';
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

// Atkinson Hyperlegible was designed for low-vision readers: distinct 1/l/I and
// 0/O shapes matter when people read dosages and lab values.
const sans = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-atkinson', display: 'swap' });
const mono = Atkinson_Hyperlegible_Mono({ subsets: ['latin'], variable: '--font-atkinson-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'MediTrack', template: '%s | MediTrack' },
  description: 'Hospital records and AI-assisted triage on PostgreSQL with pgvector.',
};

// Applies a saved theme before first paint to avoid a light/dark flash.
const themeScript = `try{var t=localStorage.getItem('mt-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
