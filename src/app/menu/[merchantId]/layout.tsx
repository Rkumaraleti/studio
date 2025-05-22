"use client"; // useCart is a client hook

import { AppLogo } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart"; // Make sure useCart is a Client Component or hook
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
  // This component now implicitly uses the CartProvider via useCart hook.
  // The actual Provider logic is within useCart itself if it uses React Context,
  // or if it's Zustand/Jotai based, it's globally available.
  // For localStorage based hook like the one provided, no explicit Provider wrapping here is needed.
  // CartSidebar and MenuDisplayItem will use the same useCart instance.

  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();

  return (
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
  );
}
