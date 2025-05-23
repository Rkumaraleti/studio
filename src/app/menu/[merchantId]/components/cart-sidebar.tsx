
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { MinusCircle, PlusCircle, ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast"; // Import useToast

export function CartSidebar() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    closeCart,
  } = useCart();
  const { toast } = useToast(); // Initialize useToast

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }
    // Placeholder for actual payment gateway integration
    toast({
      title: "Proceeding to Payment (Demo)",
      description: `You would now be redirected to a payment gateway to pay $${totalPrice.toFixed(2)}. This is a demo.`,
      duration: 5000, // Show toast for a bit longer
    });
    // In a real app, you would redirect to your payment provider here.
    // e.g., router.push('/checkout') or call a payment API.
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(isOpen) => !isOpen && closeCart()}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center text-2xl">
            <ShoppingCart className="mr-3 h-7 w-7" /> Your Order
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="text-xl font-semibold text-muted-foreground">Your cart is empty.</p>
            <p className="text-sm text-muted-foreground">Add some items from the menu to get started!</p>
            <SheetClose asChild>
                <Button variant="outline" className="mt-6">Continue Shopping</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-3 border rounded-lg shadow-sm">
                    {item.imageUrl ? (
                       <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint="food item"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                        <ShoppingCart size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter className="px-6 pb-6 space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal ({totalItems} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCart} className="w-1/3">
                  Clear Cart
                </Button>
                <Button 
                  onClick={handleProceedToCheckout} 
                  className="w-2/3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={items.length === 0} // Disable if cart is empty
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay ${totalPrice.toFixed(2)}
                </Button>
              </div>
               <p className="text-xs text-center text-muted-foreground">
                This is a demo. Actual payment integration is required for real transactions.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
