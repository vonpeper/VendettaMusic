import type { Metadata } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Advent_Pro } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/public/SchemaMarkup"
import { Toaster } from "sonner"

import { db } from "@/lib/db";
import { PwaStandaloneRedirect } from "@/components/pwa/PwaStandaloneRedirect";

const nohemi = localFont({
  src: [
    { path: "../../public/fonts/nohemi/Nohemi-Thin.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../../public/fonts/nohemi/Nohemi-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-nohemi",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const advent = Advent_Pro({
  variable: "--font-advent",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
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

  const title = config?.ogTitle || "Vendetta | Pop & Rock en Vivo para Eventos";
  const description = config?.ogDescription || "Banda profesional de pop y rock en vivo para bodas, eventos corporativos y celebraciones en México. Experiencia real de concierto con producción premium.";
  const image = config?.ogImage || 'https://vendetta.mx/images/vendetta-hero-og-v2.jpg';

  return {
    title,
    description,
    metadataBase: new URL('https://vendetta.mx'),
    verification: {
      google: 'xjvpyyI3SwGAqhLJVUhNf23uPakHwn4fkJ82NMkpNpY',
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
      className={`${nohemi.variable} ${plusJakartaSans.variable} ${advent.variable} dark antialiased scroll-smooth`}
    >
      <head>
        <meta name="google-site-verification" content="xjvpyyI3SwGAqhLJVUhNf23uPakHwn4fkJ82NMkpNpY" />
        {/* En modo PWA standalone (app instalada en Android/iOS), redirige de inmediato a la agenda sin cargar la landing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                     window.navigator.standalone === true || 
                                     (document.referrer && document.referrer.indexOf('android-app://') !== -1);
                  if (isStandalone && window.location.pathname === '/') {
                    window.location.replace('/agenda');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden max-w-[100vw]">
        <PwaStandaloneRedirect />
        <Toaster theme="dark" position="bottom-right" richColors />
        <SchemaMarkup />
        {children}
      </body>
    </html>
  );
}
