"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Tag, ImageOff, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formatPrice = (price: number, currencyCode: string = "INR") => {
  const symbol = currencyCode === "INR" ? "₹" : "$";
  // Use Intl.NumberFormat for better locale-aware currency formatting if needed in future.
  return `${symbol}${price.toFixed(2)}`;
};

interface MenuItemCardDisplayProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  currencyCode: string; // Added currencyCode prop
}

export function MenuItemCardDisplay({
  item,
  onEdit,
  onDelete,
  currencyCode,
}: MenuItemCardDisplayProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
          <Badge variant={item.isAvailable ? "default" : "secondary"}>
            {item.isAvailable ? (
              <Eye className="h-3 w-3 mr-1" />
            ) : (
              <EyeOff className="h-3 w-3 mr-1" />
            )}
            {item.isAvailable ? "Available" : "Hidden"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {item.imageUrl ? (
          <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 mb-4 rounded-md bg-muted flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Tag className="h-5 w-5 mr-1" />
            <span className="text-sm text-muted-foreground">
              {item.category}
            </span>
          </div>
          <span className="font-semibold">
            {formatPrice(item.price, currencyCode)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
