import type { Metadata } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import { Cabecalho } from '@/components/cabecalho';
import { Rodape } from '@/components/rodape';
import './globals.css';

const fonteTitulo = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--fonte-titulo',
  display: 'swap',
});

const fonteCorpo = Inter({
  subsets: ['latin'],
  variable: '--fonte-corpo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Cine Brasil — o que está no streaming agora',
    template: '%s · Cine Brasil',
  },
  description:
    'Descubra quais filmes estão disponíveis nos serviços de streaming por assinatura no Brasil.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteCorpo.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Cabecalho />
        <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
