
// src/app/(app)/menu-builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MenuItemForm } from "./components/menu-item-form";
import { MenuItemCardDisplay } from "./components/menu-item-card-display";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ListChecks, Info, Loader2, Eye, Smartphone } from "lucide-react"; // Added Eye
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy // Ensure orderBy is imported
} from "firebase/firestore";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


export default function MenuBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const { publicMerchantId, isLoadingProfile: isLoadingMerchantProfile } = useMerchantProfile();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const { toast } = useToast();
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [previewMenuUrl, setPreviewMenuUrl] = useState('');

  useEffect(() => {
    if (authLoading || isLoadingMerchantProfile) {
      setIsLoadingItems(true);
      return;
    }
    if (!user || !publicMerchantId) {
      setMenuItems([]);
      setIsLoadingItems(false);
      setPreviewMenuUrl('');
      return;
    }

    if (typeof window !== 'undefined' && publicMerchantId) {
      const currentOrigin = window.location.origin;
      setPreviewMenuUrl(`${currentOrigin}/menu/${publicMerchantId}`);
    }


    setIsLoadingItems(true);
    const menuItemsCollectionRef = collection(db, "menuItems");
    const q = query(
      menuItemsCollectionRef,
      where("merchantId", "==", publicMerchantId),
      orderBy("category"), // Changed: Order by category
      orderBy("name")      // Changed: Then by name
    );

    console.log("[MenuBuilderPage] Subscribing to menu items for merchant:", publicMerchantId);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
      setIsLoadingItems(false);
      console.log(`[MenuBuilderPage] Received ${items.length} menu items.`);
    }, (error) => {
      console.error("[MenuBuilderPage] Error fetching menu items:", error);
      toast({ title: "Error", description: `Could not fetch menu items. ${error.message}`, variant: "destructive" });
      setIsLoadingItems(false);
    });

    return () => {
      console.log("[MenuBuilderPage] Unsubscribing from menu items.");
      unsubscribe();
    };
  }, [user, authLoading, publicMerchantId, isLoadingMerchantProfile, toast]);

  const handleAddItem = async (data: Omit<MenuItem, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !publicMerchantId) {
      toast({ title: "Authentication or Profile Error", description: "You must be logged in and have a merchant profile.", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        const itemDocRef = doc(db, "menuItems", editingItem.id);
        // Ensure merchantId is not part of the data being updated directly if it's derived
        const { merchantId: currentItemMerchantId, ...restOfData } = data as any;
        const updatedData = {
            ...restOfData,
            merchantId: publicMerchantId, // Ensure correct merchantId is set
            updatedAt: serverTimestamp()
        };
        console.log("[MenuBuilderPage] Attempting to update item:", editingItem.id, "with data:", updatedData);
        await updateDoc(itemDocRef, updatedData);
        toast({ title: "Item Updated", description: `${data.name} has been updated successfully.` });
        setEditingItem(undefined);
      } else {
        const newItemData: Omit<MenuItem, 'id'> = {
          ...data,
          merchantId: publicMerchantId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        console.log("[MenuBuilderPage] Attempting to add new item with data:", newItemData);
        const docRef = await addDoc(collection(db, "menuItems"), newItemData);
        console.log("[MenuBuilderPage] Item added with ID:", docRef.id);
        toast({ title: "Item Added", description: `${data.name} has been added to your menu.` });
      }
    } catch (error: any) {
      console.error("[MenuBuilderPage] Error saving menu item:", error);
      let description = "Could not save menu item.";
      if (error instanceof Error) {
        description += ` Details: ${error.message}`;
      }
      toast({ title: "Save Error", description, variant: "destructive" });
    }
  };

  const handleEditItem = (itemToEdit: MenuItem) => {
    setEditingItem(itemToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      console.log("[MenuBuilderPage] Attempting to delete item:", itemId);
      await deleteDoc(doc(db, "menuItems", itemId));
      toast({ title: "Item Deleted", description: "The menu item has been removed." });
      if (editingItem?.id === itemId) {
        setEditingItem(undefined);
      }
    } catch (error: any) {
      console.error("[MenuBuilderPage] Error deleting menu item:", error);
      let description = "Could not delete menu item.";
      if (error instanceof Error) {
        description += ` Details: ${error.message}`;
      }
      toast({ title: "Delete Error", description, variant: "destructive" });
    }
  };

  if (authLoading || isLoadingMerchantProfile || (isLoadingItems && user && publicMerchantId)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading menu data...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
     return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Menu Builder</h1>
         <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Please log in to manage your menu.
            </AlertDescription>
          </Alert>
      </div>
     )
  }

  if (user && !publicMerchantId && !isLoadingMerchantProfile) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Menu Builder</h1>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Menu Builder</h1>
        <p className="text-muted-foreground">
          Create and manage your digital menu. Add items, set prices, and craft enticing descriptions.
        </p>
      </div>

      <MenuItemForm
        onSubmit={handleAddItem}
        initialData={editingItem}
        isEditing={!!editingItem}
        key={editingItem ? editingItem.id : 'add-new-item-form'}
      />
      {editingItem && (
        <Button variant="outline" onClick={() => setEditingItem(undefined)} className="mb-6">
          Cancel Editing
        </Button>
      )}

      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-primary">
          <ListChecks className="mr-2 h-6 w-6" /> Your Menu Items
        </h2>
        {isLoadingItems && user ? (
           <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-md">Fetching your items...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Your menu is empty!</AlertTitle>
            <AlertDescription>
              Start by adding your first menu item using the form above.
              You can add dishes, drinks, desserts, and more.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item) => (
              <MenuItemCardDisplay
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
         <p className="mt-6 text-sm text-muted-foreground">
            Items are automatically saved to your secure cloud database.
          </p>
      </div>

      <Separator className="my-8" />

      {publicMerchantId && (
        <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary flex items-center">
              <Eye className="mr-2 h-6 w-6" /> Live Menu Preview
            </h2>
            <Card className="shadow-lg">
              <CardContent className="p-2 sm:p-4">
                <div className="aspect-[9/19.5] w-full max-w-sm mx-auto bg-muted rounded-xl p-2 sm:p-3 shadow-2xl border-4 border-foreground/70">
                  <div className="w-full h-4 bg-foreground/70 rounded-t-md flex items-center justify-center mb-1">
                    <span className="w-10 h-1 bg-muted/50 rounded-full"></span>
                  </div>
                  {previewMenuUrl ? (
                    <iframe
                      src={previewMenuUrl}
                      title="Menu Preview"
                      className="w-full h-full border-0 rounded-md bg-background"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-3 text-md">Loading preview...</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground text-center w-full">
                  This is a live preview of your public menu. Changes may take a moment to reflect after saving.
                </p>
                <Button asChild variant="outline" size="sm" disabled={!previewMenuUrl}>
                  <a href={previewMenuUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <Smartphone className="mr-2 h-4 w-4" /> Open Menu in New Tab
                  </a>
                </Button>
              </CardFooter>
            </Card>
        </section>
      )}
    </div>
  );
}

