"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { MenuDisplayItem } from "./menu-display-item";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Group items by category
  const categories = groupByCategory(menuItems);
  const allCategories = [
    "All",
    ...Object.keys(categories).filter((c) => c !== "Uncategorized"),
  ];

  // Filter items by search and category
  const filteredItems = menuItems.filter(
    (item) =>
      (activeCategory === "All" || item.category?.trim() === activeCategory) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-full bg-muted"
        />
      </div>
      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full mb-4"
      >
        <TabsList className="flex gap-2 overflow-x-auto rounded-full bg-background/80 p-1">
          {allCategories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="px-4 py-2 rounded-full text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-white transition-colors whitespace-nowrap"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuDisplayItem
              key={item.id}
              item={item}
              currencyCode={currencyCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
