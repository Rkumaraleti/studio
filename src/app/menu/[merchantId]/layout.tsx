// src/app/menu/[merchantId]/layout.tsx
"use client"; 

import { useEffect } from "react"; // Added useEffect
import { AppLogo } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart"; 
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "./components/cart-sidebar";

export default function PublicMenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { merchantId: string };
}) {
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/menu/' }) // Ensure scope matches manifest
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <>
      {/* PWA specific meta tags and links - these should ideally be in <head> of the document.
          Next.js 13+ App Router handles <head> content in page.tsx or layout.tsx metadata object.
          However, for manifest and dynamic theme-color, direct injection or a custom Head component might be needed.
          For simplicity here, placing them, but review Next.js best practices for <head> management.
          The manifest link is standard.
      */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#6A4DBC" /> {/* Corresponds to primary color from your theme */}
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> {/* You'll need to provide this icon */}
      
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/">
              <AppLogo />
            </Link>
            <Button variant="ghost" onClick={toggleCart} className="relative">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Open cart</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
          {children}
        </main>
        <footer className="py-6 md:px-6 md:py-0 border-t">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Powered by <AppLogo showText={false} size={16} className="inline-block align-middle" /> QR Plus.
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Restaurant Name. All Rights Reserved.
            </p>
          </div>
        </footer>
        <CartSidebar />
      </div>
    </>
  );
}
