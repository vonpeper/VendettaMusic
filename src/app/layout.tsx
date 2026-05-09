import type { Metadata } from "next";
import { Inter, Montserrat, Advent_Pro } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/public/SchemaMarkup"
import { Toaster } from "sonner"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
});

const advent = Advent_Pro({
  variable: "--font-advent",
  subsets: ["latin"],
  weight: ["500"], // Medium
});

export const metadata: Metadata = {
  title: "Vendetta | Música en Vivo para Eventos",
  description: "Grupo musical versátil de alto nivel para bodas, eventos corporativos y festivales en México. Experiencia premium y energía inigualable.",
  metadataBase: new URL('https://vendetta.mx'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Vendetta | Música en Vivo para Eventos",
    description: "La mejor música en vivo para tu boda o evento corporativo en México. ¡Arma tu show ahora!",
    url: 'https://vendetta.mx',
    siteName: 'Vendetta Live Music',
    images: [
      {
        url: '/images/shows/arma-tu-show.jpg',
        width: 1200,
        height: 630,
        alt: 'Vendetta Live Music Show',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vendetta | Música en Vivo para Eventos",
    description: "Música en vivo premium para eventos inolvidables.",
    images: ['/images/shows/arma-tu-show.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${montserrat.variable} ${advent.variable} dark antialiased scroll-smooth`}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster theme="dark" position="bottom-right" richColors />
        <SchemaMarkup />
        {children}
      </body>
    </html>
  );
}
