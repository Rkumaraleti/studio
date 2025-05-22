"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, DollarSign, Tag, ImageOff } from "lucide-react";

interface MenuItemCardDisplayProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
}

export function MenuItemCardDisplay({ item, onEdit, onDelete }: MenuItemCardDisplayProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {item.imageUrl ? (
        <div className="relative w-full h-48">
          <Image
            src={item.imageUrl}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="food item"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-secondary flex items-center justify-center">
          <ImageOff className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{item.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{item.description}</p>
        <div className="flex items-center text-sm text-primary mb-1">
          <DollarSign className="h-4 w-4 mr-1" /> Price: ${item.price.toFixed(2)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Tag className="h-4 w-4 mr-1" /> Category: {item.category}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Edit2 className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
