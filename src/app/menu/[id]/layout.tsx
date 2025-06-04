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
  return <CartProvider>{children}</CartProvider>;
}
