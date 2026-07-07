import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { db } from '@/lib/db';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LemonSurvey',
  description: 'Build, distribute, and analyze surveys with powerful conditional logic.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let brandColor = '#FACC15';
  try {
    const settings = await db.platformSettings.findUnique({ where: { id: 'global' } });
    if (settings?.brandColor) {
      brandColor = settings.brandColor;
    }
  } catch (err) {
    // DB might not be ready during build
  }

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --brand-color: ${brandColor};
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('theme');
              if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
              } else {
                // Default to dark
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
