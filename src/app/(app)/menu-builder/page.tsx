// src/app/(app)/menu-builder/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MenuItemForm } from "./components/menu-item-form";
import { MenuItemCardDisplay } from "./components/menu-item-card-display";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  ListChecks,
  Info,
  Loader2,
  Eye,
  Smartphone,
  Utensils,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { supabase } from "@/lib/supabase/config";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const formatPrice = (price: number, currencyCode: string = "INR") => {
  const symbol = currencyCode === "INR" ? "₹" : "$";
  return `${symbol}${price.toFixed(2)}`;
};

export default function MenuBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useMerchantProfile();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(
    undefined
  );
  const { toast } = useToast();
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Fetch menu items only when profile ID changes
  const fetchMenuItems = useCallback(async () => {
    if (authLoading || profileLoading || !profile?.id) {
      setIsLoadingItems(true);
      return;
    }

    try {
      setIsLoadingItems(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("merchant_id", profile.id)
        .order("category")
        .order("name");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error("[MenuBuilderPage] Error fetching menu items:", err);
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingItems(false);
    }
  }, [profile?.id, authLoading, profileLoading, toast]);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile?.id) {
      fetchMenuItems();
    }
  }, [authLoading, profileLoading, profile?.id, fetchMenuItems]);

  const uniqueCategories = useMemo(() => {
    const categories = menuItems
      .map((item) => item.category)
      .filter(
        (category): category is string =>
          typeof category === "string" && category.trim() !== ""
      )
      .map((category) => category.trim());
    return Array.from(new Set(categories)).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [menuItems]);

  const handleAddItem = useCallback(
    async (data: {
      name: string;
      description: string;
      price: number;
      category: string;
      isAvailable: boolean;
      imageUrl?: string;
    }) => {
      if (!user || !profile?.id || !profile?.currency) {
        toast({
          title: "Authentication or Profile Error",
          description:
            "You must be logged in and have a merchant profile with a currency set.",
          variant: "destructive",
        });
        return;
      }

      try {
        if (editingItem) {
          // Update existing item
          const dbData = {
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            image_url: data.imageUrl,
            is_available: data.isAvailable,
          };
          const { data: updatedItem, error } = await supabase
            .from("menu_items")
            .update(dbData)
            .eq("id", editingItem.id)
            .eq("merchant_id", profile.id)
            .select()
            .single();

          if (error) throw error;

          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id ? updatedItem : item
            )
          );
          setEditingItem(undefined);
          toast({
            title: "Item Updated",
            description: `${data.name} has been updated.`,
          });
        } else {
          // Add new item
          const dbData = {
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            image_url: data.imageUrl,
            is_available: data.isAvailable,
            merchant_id: profile.id,
          };

          const { data: newItem, error } = await supabase
            .from("menu_items")
            .insert([dbData])
            .select()
            .single();

          if (error) throw error;

          setMenuItems((prev) => [...prev, newItem]);
          toast({
            title: "Item Added",
            description: `${data.name} has been added to your menu.`,
          });
        }
      } catch (error: any) {
        console.error("[MenuBuilderPage] Error saving menu item:", error);
        toast({
          title: "Save Error",
          description: error.message || "Could not save menu item.",
          variant: "destructive",
        });
      }
    },
    [user, profile?.id, profile?.currency, editingItem, toast]
  );

  const handleEditItem = useCallback((itemToEdit: MenuItem) => {
    setEditingItem(itemToEdit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!user || !profile?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in.",
          variant: "destructive",
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", itemId)
          .eq("merchant_id", profile.id);

        if (error) throw error;

        setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
        toast({
          title: "Item Deleted",
          description: "The menu item has been removed.",
        });
        if (editingItem?.id === itemId) {
          setEditingItem(undefined);
        }
      } catch (error: any) {
        console.error("[MenuBuilderPage] Error deleting menu item:", error);
        toast({
          title: "Delete Error",
          description: error.message || "Could not delete menu item.",
          variant: "destructive",
        });
      }
    },
    [user, profile?.id, editingItem?.id, toast]
  );

  const currentCurrencyCode = useMemo(
    () => profile?.currency || "INR",
    [profile?.currency]
  );

  if (
    authLoading ||
    profileLoading ||
    (isLoadingItems && user && profile?.id)
  ) {
    return (
      <div className="flex justify-center items-center h-64 p-4 md:p-6 lg:p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading menu data...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="space-y-8 text-center p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          Menu Builder
        </h1>
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Please log in to manage your menu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user && !profile?.id && !profileLoading) {
    return (
      <div className="space-y-8 text-center p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          Menu Builder
        </h1>
        <Alert variant="default">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Setting up Profile</AlertTitle>
          <AlertDescription>
            Finalizing your merchant profile. This page will load shortly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="responsive-container py-8">
      <div className="mb-8">
        <h1 className="responsive-heading text-primary mb-2 flex items-center">
          <Utensils className="mr-3 h-8 w-8" /> Menu Builder
        </h1>
        <p className="responsive-text text-muted-foreground">
          Create and manage your menu items. Add categories, prices, and
          descriptions to showcase your offerings.
        </p>
      </div>

      {isLoadingItems ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 responsive-text">Loading menu items...</p>
        </div>
      ) : (
        <>
          {/* Menu Items Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Menu Items</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingItem(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </div>

            {menuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg bg-card p-8 text-center">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                  No Menu Items Yet
                </h3>
                <p className="text-muted-foreground mt-1">
                  Start by adding your first menu item
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAddingItem(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                  <div className="flex gap-4 min-w-min">
                    {menuItems.map((item) => (
                      <Card
                        key={item.id}
                        className="min-w-[280px] flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                      >
                        {item.imageUrl && (
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {item.name}
                            </CardTitle>
                            <Badge variant="secondary">
                              {item.category || "Uncategorized"}
                            </Badge>
                          </div>
                          <CardDescription>
                            {formatPrice(item.price, profile?.currency)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={() => setIsAddingItem(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Menu Item Form */}
          {(isAddingItem || editingItem) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </CardTitle>
                <CardDescription>
                  {editingItem
                    ? "Update your menu item details below"
                    : "Fill in the details to add a new menu item"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MenuItemForm
                  initialData={editingItem}
                  isEditing={!!editingItem}
                  existingCategories={uniqueCategories}
                  disabled={!profile || !profile.currency}
                  onSubmit={handleAddItem}
                  onCancel={() => {
                    setIsAddingItem(false);
                    setEditingItem(undefined);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
