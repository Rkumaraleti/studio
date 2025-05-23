
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
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group w-60 flex-shrink-0"> {/* Reduced width to w-60 */}
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
            <ImageOff className="h-12 w-12 text-muted-foreground" /> {/* Adjusted icon size */}
          </div>
        )}
      </div>
      <CardHeader className="pb-2 pt-3"> {/* Adjusted padding */}
        <CardTitle className="text-lg truncate">{item.name}</CardTitle> {/* Adjusted font size and truncate */}
      </CardHeader>
      <CardContent className="flex-grow pb-2 pt-1"> {/* Adjusted padding */}
        <CardDescription className="text-xs line-clamp-2 mb-1 h-8"> {/* Adjusted font, line-clamp, margin, height */}
          {item.description}
        </CardDescription>
        <div className="flex items-center font-semibold text-primary text-sm"> {/* Adjusted font size */}
          <DollarSign className="h-4 w-4 mr-1" /> {/* Adjusted icon size */}
          {item.price.toFixed(2)}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3 pb-3"> {/* Adjusted padding */}
        {currentQuantity === 0 ? (
          <Button onClick={handleIncrement} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm h-9"> {/* Adjusted text size and height */}
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="icon" onClick={handleDecrement} aria-label="Decrease quantity" className="h-8 w-8"> {/* Adjusted size */}
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="text-md font-semibold w-8 text-center" aria-live="polite"> {/* Adjusted font size and width */}
              {currentQuantity}
            </span>
            <Button variant="outline" size="icon" onClick={handleIncrement} aria-label="Increase quantity" className="h-8 w-8"> {/* Adjusted size */}
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
