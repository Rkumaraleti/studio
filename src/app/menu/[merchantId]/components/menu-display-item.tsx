
"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MinusCircle, ImageOff, DollarSign, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface MenuDisplayItemProps {
  item: MenuItem;
}

export function MenuDisplayItem({ item }: MenuDisplayItemProps) {
  const { addItem, updateQuantity, removeItem, items: cartItems } = useCart();

  const cartItem = cartItems.find(ci => ci.id === item.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(item.id, currentQuantity + 1);
    } else {
      addItem(item, 1); // Add item with quantity 1 if not in cart
    }
  };

  const handleDecrement = () => {
    if (currentQuantity > 1) {
      updateQuantity(item.id, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      removeItem(item.id); // Remove item if quantity becomes 0
    }
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group">
      <div className="relative w-full aspect-[4/3]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="food dish"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <ImageOff className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{item.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <CardDescription className="text-sm line-clamp-3 mb-2">
          {item.description}
        </CardDescription>
        <div className="flex items-center font-semibold text-primary">
          <DollarSign className="h-5 w-5 mr-1" />
          {item.price.toFixed(2)}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        {currentQuantity === 0 ? (
          <Button onClick={handleIncrement} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="icon" onClick={handleDecrement} aria-label="Decrease quantity">
              <MinusCircle className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold w-10 text-center" aria-live="polite">
              {currentQuantity}
            </span>
            <Button variant="outline" size="icon" onClick={handleIncrement} aria-label="Increase quantity">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
