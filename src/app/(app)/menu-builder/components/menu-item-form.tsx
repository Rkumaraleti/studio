
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MenuItem } from "@/lib/types";
import { AiDescriptionGenerator } from "./ai-description-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required").trim(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  onSubmit: (data: MenuItemFormData) => void;
  initialData?: Partial<MenuItem>;
  isEditing?: boolean;
  existingCategories?: string[];
}

export function MenuItemForm({ onSubmit, initialData, isEditing = false, existingCategories = [] }: MenuItemFormProps) {
  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      category: initialData?.category || "",
      imageUrl: initialData?.imageUrl || "",
    },
  });

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Reset category search when initial data changes or form is reset
  useEffect(() => {
    setCategorySearch(initialData?.category || "");
  }, [initialData?.category]);


  const currentItemName = form.watch("name");

  function handleFormSubmit(data: MenuItemFormData) {
    onSubmit(data);
    if (!isEditing) {
      form.reset(); // Reset form only if adding new item
      setCategorySearch(""); // Reset search with form
    }
  }

  const filteredCategories = existingCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          {isEditing ? <Save className="mr-2 h-6 w-6" /> : <PlusCircle className="mr-2 h-6 w-6" />}
          {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Classic Burger" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your menu item..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <AiDescriptionGenerator
                    itemName={currentItemName}
                    onSuggestionAccept={(suggestion) => form.setValue("description", suggestion)}
                  />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Category</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? existingCategories.find(
                                  (cat) => cat.toLowerCase() === field.value.toLowerCase()
                                ) || field.value
                              : "Select or create category..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search category or type new..."
                            value={categorySearch}
                            onValueChange={setCategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {categorySearch.trim() === "" ? "Type to search or create." : `No category found for "${categorySearch}".`}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredCategories.map((cat) => (
                                <CommandItem
                                  value={cat}
                                  key={cat}
                                  onSelect={() => {
                                    form.setValue("category", cat);
                                    setCategorySearch(cat); // Update search to reflect selection
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      cat.toLowerCase() === field.value?.toLowerCase()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {cat}
                                </CommandItem>
                              ))}
                              {categorySearch.trim() !== "" &&
                               !existingCategories.some(c => c.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                                <CommandItem
                                  value={categorySearch.trim()}
                                  onSelect={() => {
                                    form.setValue("category", categorySearch.trim());
                                    // setCategorySearch(categorySearch.trim()); // Keep search as is or clear
                                    setPopoverOpen(false);
                                  }}
                                  className="text-primary italic"
                                >
                                  Create new: "{categorySearch.trim()}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/600x400.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto" size="lg">
              {isEditing ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
