// src/app/menu/[public_merchant_id]/layout.tsx
import { CartProvider } from "@/hooks/use-cart";
import { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";

interface LayoutProps {
  children: React.ReactNode;
  params: {
    public_merchant_id: string;
  };
}

// Server-side metadata generation
export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { public_merchant_id } = await params;
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("merchant_profiles")
    .select("restaurant_name, restaurant_description")
    .eq("public_merchant_id", public_merchant_id)
    .single();

  return {
    title: profile?.restaurant_name || "Menu",
    description: profile?.restaurant_description || "View our menu",
  };
}

// Server Component (default export)
export default function MenuLayout({ children }: LayoutProps) {
  return (
    <>
      <head>
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon_io/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon_io/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon_io/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon_io/favicon.ico" />
        <meta
          name="description"
          content="View and order from our digital menu. Powered by QR Plus."
        />
        <meta property="og:title" content="QR Plus Menu" />
        <meta
          property="og:description"
          content="View and order from our digital menu. Powered by QR Plus."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/qrplus_logo.png" />
        <meta property="og:site_name" content="QR Plus" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="QR Plus Menu" />
        <meta
          name="twitter:description"
          content="View and order from our digital menu. Powered by QR Plus."
        />
        <meta name="twitter:image" content="/qrplus_logo.png" />
      </head>
      <CartProvider>{children}</CartProvider>
    </>
  );
}
