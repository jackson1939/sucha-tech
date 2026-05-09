import type { Metadata, Viewport } from 'next';
import { Navbar } from '@frontend/components/Navbar';
import '@frontend/styles/globals.css';

export const metadata: Metadata = {
  title: 'Vibe Broker — Web3 por voz',
  description: 'El "Alexa" de las transacciones Web3. Swaps y bridges en Solana con confirmación por voz.',
  keywords: ['solana', 'web3', 'defi', 'voice', 'swap', 'voz'],
};

export const viewport: Viewport = {
  width:          'device-width',
  initialScale:   1,
  themeColor:     '#05050f',
  viewportFit:    'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* noise class añade textura sutil vía CSS */}
      <body className="noise" style={{ background: '#05050f', minHeight: '100vh' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
          {children}
        </div>
        <Navbar />
      </body>
    </html>
  );
}
