
"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MinusCircle, ImageOff, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart"; // Corrected path

const formatPrice = (price: number, currencyCode: string = 'INR') => {
  const symbol = currencyCode === 'INR' ? '₹' : '$';
  return `${symbol}${price.toFixed(2)}`;
};

interface MenuDisplayItemProps {
  item: MenuItem;
  currencyCode: string; // Added currencyCode prop
}

export function MenuDisplayItem({ item, currencyCode }: MenuDisplayItemProps) {
  const { addItem, updateQuantity, removeItem, items: cartItems } = useCart();

  const cartItem = cartItems.find(ci => ci.id === item.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const itemName = typeof item.name === 'string' && item.name.trim() !== '' ? item.name : "Unnamed Item";
  const itemDescription = typeof item.description === 'string' ? item.description : "No description available.";

  if (typeof item.name !== 'string' || item.name.trim() === '') {
    console.warn(`[MenuDisplayItem] Item with ID ${item.id} has a missing or invalid name. Displaying as "${itemName}".`, item);
  }

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(item.id, currentQuantity + 1);
    } else {
      addItem(item, 1); 
    }
  };

  const handleDecrement = () => {
    if (currentQuantity > 1) {
      updateQuantity(item.id, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      removeItem(item.id); 
    }
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group w-60 flex-shrink-0">
      <div className="relative w-full aspect-[4/3]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={itemName} 
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="food dish"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" /> 
          </div>
        )}
      </div>
      <CardHeader className="pb-2 pt-3"> 
        <CardTitle className="text-lg truncate">{itemName}</CardTitle> 
      </CardHeader>
      <CardContent className="flex-grow pb-2 pt-1"> 
        <CardDescription className="text-xs line-clamp-2 mb-1 h-8"> 
          {itemDescription}
        </CardDescription>
        <div className="flex items-center font-semibold text-primary text-sm"> 
          {formatPrice(item.price, currencyCode)}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3 pb-3"> 
        {currentQuantity === 0 ? (
          <Button onClick={handleIncrement} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm h-9"> 
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="icon" onClick={handleDecrement} aria-label="Decrease quantity" className="h-8 w-8"> 
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="text-md font-semibold w-8 text-center" aria-live="polite"> 
              {currentQuantity}
            </span>
            <Button variant="outline" size="icon" onClick={handleIncrement} aria-label="Increase quantity" className="h-8 w-8"> 
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
