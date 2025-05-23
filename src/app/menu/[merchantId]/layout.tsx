
// src/app/menu/[merchantId]/layout.tsx
"use client"; 

import { useEffect } from "react";
import Head from "next/head"; 
import { AppLogo } from "@/components/common/app-logo";
import Link from "next/link";
import { CartProvider } from '@/hooks/use-cart'; // Import CartProvider

export default function PublicMenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { merchantId: string };
}) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/menu/' }) 
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <CartProvider> {/* Wrap the layout contents with CartProvider */}
      <>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#6A4DBC" /> 
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" /> 
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/">
                <AppLogo />
              </Link>
            </div>
          </header>
          <main className="flex-1 container mx-auto py-8 px-4 md:px-6 pb-28"> 
            {children}
          </main>
        </div>
      </>
    </CartProvider>
  );
}
