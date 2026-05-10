import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@frontend/components/ThemeProvider';
import '@frontend/styles/globals.css';

export const metadata: Metadata = {
  title: 'Vibe Broker — Sucha-Tech DeFi AI',
  description: 'El "Alexa" de las transacciones Web3. Swaps y bridges multi-chain con confirmación por voz.',
  keywords: ['solana', 'web3', 'defi', 'voice', 'swap', 'voz', 'sucha-tech'],
  icons: {
    icon:             '/sucha-logo.jpg',
    shortcut:         '/sucha-logo.jpg',
    apple:            '/sucha-logo.jpg',
    other: [{ rel: 'icon', url: '/sucha-logo.jpg' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#05050f' },
    { media: '(prefers-color-scheme: light)', color: '#f0f2ff' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica el tema guardado ANTES de que React hidrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vb_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="noise" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
