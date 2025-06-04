"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { MenuDisplayItem } from "./menu-display-item";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MenuDisplayProps {
  public_merchant_id: string;
  currencyCode: string;
  menuItems: MenuItem[];
  restaurantName: string;
  restaurantDescription?: string;
}

function groupByCategory(items: MenuItem[]) {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach((item) => {
    const category = item.category?.trim() || "Uncategorized";
    if (!categories[category]) categories[category] = [];
    categories[category].push(item);
  });
  return categories;
}

export function MenuDisplay({
  public_merchant_id,
  currencyCode,
  menuItems,
  restaurantName,
  restaurantDescription,
}: MenuDisplayProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group items by category
  const categories = groupByCategory(menuItems);

  // Filter items by search
  const filteredCategories = Object.entries(categories).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) acc[category] = filtered;
      return acc;
    },
    {} as { [key: string]: MenuItem[] }
  );

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Carousels */}
      {Object.keys(filteredCategories).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(filteredCategories).map(([category, items]) => (
          <section key={category} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight px-1 sticky top-0 bg-background z-10 pb-1">
              {category}
            </h2>
            <div
              className="flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[260px] max-w-[90vw] sm:min-w-[220px] sm:max-w-xs snap-start"
                >
                  <MenuDisplayItem item={item} currencyCode={currencyCode} />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
