"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MenuItemForm } from "./components/menu-item-form";
import { MenuItemCardDisplay } from "./components/menu-item-card-display";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ListChecks, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MenuBuilderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const { toast } = useToast();

  const handleAddItem = (data: Omit<MenuItem, 'id' | 'aiSuggestions'>) => {
    if (editingItem) {
      // Update existing item
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? { ...editingItem, ...data } : item));
      toast({ title: "Item Updated", description: `${data.name} has been updated successfully.` });
      setEditingItem(undefined);
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: Date.now().toString(), // Simple ID generation
        ...data,
      };
      setMenuItems([newItem, ...menuItems]);
      toast({ title: "Item Added", description: `${newItem.name} has been added to your menu.` });
    }
  };

  const handleEditItem = (itemToEdit: MenuItem) => {
    setEditingItem(itemToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form for editing
  };

  const handleDeleteItem = (itemId: string) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId));
    toast({ title: "Item Deleted", description: "The menu item has been removed." });
    if (editingItem?.id === itemId) {
      setEditingItem(undefined); // Clear editing state if deleted item was being edited
    }
  };

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
        key={editingItem ? editingItem.id : 'add-new-item-form'} // Force re-render of form when editingItem changes
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
        {menuItems.length === 0 ? (
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
            Note: Drag-and-drop functionality for reordering items is a planned feature.
            For now, items are displayed in reverse order of addition.
          </p>
      </div>
    </div>
  );
}
