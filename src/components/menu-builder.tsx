"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { MenuDisplayItem } from "@/app/menu/[public_merchant_id]/components/menu-display-item";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_currency: string;
  imageUrl?: string;
  category?: string;
  merchant_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuBuilderProps {
  merchantId: string;
  isPublicView: boolean;
  restaurantName: string;
  restaurantDescription?: string;
}

// Helper to group items by category
const groupByCategory = (items: MenuItem[]): MenuCategory[] => {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach((item) => {
    const categoryKey = item.category?.trim() || "Uncategorized";
    if (!categories[categoryKey]) {
      categories[categoryKey] = [];
    }
    categories[categoryKey].push(item);
  });
  return Object.keys(categories)
    .sort()
    .map((categoryName) => ({
      id: categoryName.toLowerCase().replace(/\s+/g, "-"),
      name: categoryName,
      items: categories[categoryName].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      ),
    }));
};

export function MenuBuilder({
  merchantId,
  isPublicView,
  restaurantName,
  restaurantDescription,
}: MenuBuilderProps) {
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: items, error: fetchError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("merchantId", merchantId)
          .order("category")
          .order("name");

        if (fetchError) throw fetchError;

        const groupedCategories = groupByCategory(items || []);
        setMenuCategories(groupedCategories);
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("Failed to load menu items. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, [merchantId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-10 flex flex-col items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        {[1, 2].map((i) => (
          <section key={i} className="mb-6">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <div className="flex space-x-4 overflow-hidden pb-2">
              {[1, 2, 3].map((j) => (
                <Skeleton
                  key={j}
                  className="h-72 w-60 rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTitle>Error Loading Menu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {restaurantDescription && (
        <p className="text-xs text-muted-foreground text-center mb-4 px-2">
          {restaurantDescription}
        </p>
      )}

      {menuCategories.length === 0 && !error && (
        <Alert variant="default" className="max-w-md mx-auto mt-8">
          <ShoppingBag className="h-5 w-5" />
          <AlertTitle>Menu Coming Soon!</AlertTitle>
          <AlertDescription>
            This restaurant is still setting up their menu or has no items
            listed. Please check back later!
          </AlertDescription>
        </Alert>
      )}

      {menuCategories.map((category) => (
        <section key={category.id} className="scroll-mt-20" id={category.id}>
          <h2 className="text-lg font-semibold text-primary mb-2 pb-1 border-b-2 border-primary/20">
            {category.name}
          </h2>
          {category.items.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-4">
                {category.items.map((item) => (
                  <MenuDisplayItem
                    key={item.id}
                    item={item}
                    currencyCode="INR"
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No items yet!</AlertTitle>
              <AlertDescription>
                There are currently no items available in the {category.name}{" "}
                category.
              </AlertDescription>
            </Alert>
          )}
        </section>
      ))}
    </div>
  );
}
