import type { Metadata } from "next";
import { Inter, Montserrat, Advent_Pro } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/public/SchemaMarkup"
import { Toaster } from "sonner"

import { db } from "@/lib/db";

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

export async function generateMetadata(): Promise<Metadata> {
  const config = await db.globalConfig.findUnique({
    where: { id: "vendetta_config" },
    select: {
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
    }
  });

  const title = config?.ogTitle || "Vendetta | Música en Vivo para Eventos";
  const description = config?.ogDescription || "Grupo musical versátil de alto nivel para bodas, eventos corporativos y festivales en México. Experiencia premium y energía inigualable.";
  const image = config?.ogImage || '/images/shows/arma-tu-show.jpg';

  return {
    title,
    description,
    metadataBase: new URL('https://vendetta.mx'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: 'https://vendetta.mx',
      siteName: 'Vendetta Live Music',
      images: [
        {
          url: image,
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
      title,
      description,
      images: [image],
    },
  };
}

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
