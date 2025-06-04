"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, MinusCircle, ShoppingCart, ImageOff } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface MenuDisplayItemProps {
  item: MenuItem;
  currencyCode: string;
}

const formatPrice = (price: number, currencyCode: string = "INR") => {
  const symbol = currencyCode === "INR" ? "₹" : "$";
  return `${symbol}${price.toFixed(2)}`;
};

export function MenuDisplayItem({ item, currencyCode }: MenuDisplayItemProps) {
  const { addItem, updateQuantity, items: cartItems } = useCart();
  const currentQuantity =
    cartItems.find((i) => i.id === item.id)?.quantity || 0;

  const handleIncrement = () => {
    if (currentQuantity === 0) {
      addItem(item);
    } else {
      updateQuantity(item.id, currentQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (currentQuantity > 0) {
      updateQuantity(item.id, currentQuantity - 1);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-none tracking-tight">
              {item.name}
            </h3>
            <p className="font-medium text-primary">
              {formatPrice(item.price, currencyCode)}
            </p>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {currentQuantity === 0 ? (
          <Button
            onClick={handleIncrement}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              className={cn(
                "h-8 w-8",
                currentQuantity === 0 && "opacity-50 cursor-not-allowed"
              )}
              disabled={currentQuantity === 0}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="font-medium">{currentQuantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              className="h-8 w-8"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
