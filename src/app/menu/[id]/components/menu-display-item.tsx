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
    <Card className="flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 p-4 sm:p-0 rounded-xl shadow-sm bg-white dark:bg-zinc-900 h-full">
      <div className="relative flex-shrink-0 w-20 h-20 sm:w-full sm:h-40 rounded-lg sm:rounded-t-xl sm:rounded-b-none overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between h-full min-w-0 sm:p-4">
        <div>
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-base truncate">{item.name}</h3>
            <span className="font-bold text-primary text-base whitespace-nowrap">
              {formatPrice(item.price, currencyCode)}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-end">
          {currentQuantity === 0 ? (
            <Button
              onClick={handleIncrement}
              className="bg-primary hover:bg-primary/90 rounded-full text-sm font-semibold px-4 py-2"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className={cn(
                  "h-8 w-8 rounded-full border border-border",
                  currentQuantity === 0 && "opacity-50 cursor-not-allowed"
                )}
                disabled={currentQuantity === 0}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="font-medium text-base">{currentQuantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-8 w-8 rounded-full border border-border"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
