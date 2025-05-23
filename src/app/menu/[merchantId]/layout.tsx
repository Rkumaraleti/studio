
// src/app/menu/[merchantId]/layout.tsx
"use client"; 

import { useEffect, useState, use } from "react"; 
import Head from "next/head"; 
import Link from "next/link";
import { CartProvider } from '@/hooks/use-cart';
import { Utensils } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import type { MerchantProfile } from "@/lib/types";

export default function PublicMenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ merchantId: string }>; 
}) {
  const resolvedParams = use(params); 

  const [headerData, setHeaderData] = useState<{ name: string | null; loading: boolean; error: string | null }>({
    name: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/menu/' }) 
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  useEffect(() => {
    if (!resolvedParams.merchantId) { 
      setHeaderData({ name: "Menu", loading: false, error: "Merchant ID missing." });
      return;
    }

    const fetchRestaurantName = async () => {
      setHeaderData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const merchantsCollectionRef = collection(db, "merchants");
        const merchantQuery = query(merchantsCollectionRef, where("publicMerchantId", "==", resolvedParams.merchantId), limit(1));
        const merchantQuerySnapshot = await getDocs(merchantQuery);

        if (!merchantQuerySnapshot.empty) {
          const merchantDoc = merchantQuerySnapshot.docs[0];
          const profile = merchantDoc.data() as MerchantProfile;
          setHeaderData({ name: profile.restaurantName, loading: false, error: null });
        } else {
          setHeaderData({ name: "Menu", loading: false, error: "Restaurant not found." });
        }
      } catch (err) {
        console.error("Error fetching restaurant name for header:", err);
        setHeaderData({ name: "Menu", loading: false, error: "Could not load restaurant info." });
      }
    };

    fetchRestaurantName();
  }, [resolvedParams.merchantId]); 

  return (
    <CartProvider>
      <>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          {/* Updated theme-color to match new Slate Blue primary */}
          <meta name="theme-color" content="#597399" /> 
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" /> 
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href={`/menu/${resolvedParams.merchantId}`} className="flex items-center gap-2 group">
                <Utensils className="h-6 w-6 text-primary group-hover:text-accent transition-colors" />
                {headerData.loading ? (
                  <span className="text-sm font-semibold text-muted-foreground animate-pulse">Loading...</span>
                ) : headerData.error ? (
                  <span className="text-sm font-semibold text-destructive">{headerData.name || "Error"}</span>
                ) : (
                  <span className="text-lg font-semibold text-primary group-hover:text-accent transition-colors truncate max-w-[200px] sm:max-w-xs">
                    {headerData.name || "Menu"}
                  </span>
                )}
              </Link>
            </div>
          </header>
          <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-28">
            {children}
          </main>
        </div>
      </>
    </CartProvider>
  );
}
