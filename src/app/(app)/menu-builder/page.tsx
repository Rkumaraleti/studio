
// src/app/(app)/menu-builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MenuItemForm } from "./components/menu-item-form";
import { MenuItemCardDisplay } from "./components/menu-item-card-display";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ListChecks, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
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
  orderBy // Added orderBy
} from "firebase/firestore";

export default function MenuBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] =useState<MenuItem | undefined>(undefined);
  const { toast } = useToast();
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingItems(true);
      return;
    }
    if (!user) {
      setMenuItems([]);
      setIsLoadingItems(false);
      return;
    }

    setIsLoadingItems(true);
    const menuItemsCollectionRef = collection(db, "menuItems");
    // Query items for the current merchant, ordered by creation date
    const q = query(
      menuItemsCollectionRef, 
      where("merchantId", "==", user.uid),
      orderBy("createdAt", "desc") // Order by creation time, newest first
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items); // Rely on Firestore's ordering
      setIsLoadingItems(false);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      toast({ title: "Error", description: "Could not fetch menu items.", variant: "destructive" });
      setIsLoadingItems(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const handleAddItem = async (data: Omit<MenuItem, 'id' | 'aiSuggestions' | 'merchantId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        const itemDocRef = doc(db, "menuItems", editingItem.id);
        const updatedData = {
            ...data,
            updatedAt: serverTimestamp() 
        };
        console.log("Attempting to update item:", editingItem.id, updatedData);
        await updateDoc(itemDocRef, updatedData);
        toast({ title: "Item Updated", description: `${data.name} has been updated successfully.` });
        setEditingItem(undefined);
      } else {
        const newItemData = {
          ...data,
          merchantId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        console.log("Attempting to add new item:", newItemData);
        const docRef = await addDoc(collection(db, "menuItems"), newItemData);
        console.log("Item added with ID:", docRef.id);
        toast({ title: "Item Added", description: `${data.name} has been added to your menu.` });
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
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
      console.log("Attempting to delete item:", itemId);
      await deleteDoc(doc(db, "menuItems", itemId));
      toast({ title: "Item Deleted", description: "The menu item has been removed." });
      if (editingItem?.id === itemId) {
        setEditingItem(undefined);
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      let description = "Could not delete menu item.";
      if (error instanceof Error) {
        description += ` Details: ${error.message}`;
      }
      toast({ title: "Delete Error", description, variant: "destructive" });
    }
  };

  if (authLoading || (isLoadingItems && user)) {
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
    </div>
  );
}
