
// src/app/menu/[merchantId]/page.tsx
"use client"; 

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MenuItem, MenuCategory, MerchantProfile, Order } from "@/lib/types";
import { MenuDisplayItem } from "./components/menu-display-item";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Info, ShoppingBag, AlertTriangle, Loader2, Trash2, PlusCircle, MinusCircle, CreditCard, ShoppingCart, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase/config"; // Import auth
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to group items by category
const groupByCategory = (items: MenuItem[]): MenuCategory[] => {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach(item => {
    const categoryKey = item.category || 'Uncategorized';
    if (!categories[categoryKey]) {
      categories[categoryKey] = [];
    }
    categories[categoryKey].push(item);
  });
  return Object.keys(categories).sort().map(categoryName => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
    name: categoryName,
    items: categories[categoryName].sort((a,b) => (a.name || '').localeCompare(b.name || '')),
  }));
};

// Helper to generate a user-friendly Order ID
const generateDisplayOrderId = () => {
  const prefix = "ORD";
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
};


export default function MerchantMenuPage() {
  const params = useParams();
  const publicIdFromUrl = params.merchantId as string;
  
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const { 
    items: cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getTotalItems, 
    getTotalPrice,
    isLoadingCart,
  } = useCart();
  const { toast } = useToast();

  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  useEffect(() => {
    console.log("[MerchantMenuPage] useEffect triggered. publicIdFromUrl:", publicIdFromUrl);

    if (!publicIdFromUrl || publicIdFromUrl.trim() === "") {
      console.error("[MerchantMenuPage] Public Menu ID is missing or invalid in URL.");
      setError("Public Menu ID is missing or invalid in URL.");
      setIsLoadingPage(false);
      return;
    }

    const fetchData = async () => {
      console.log("[MerchantMenuPage] fetchData called for publicId:", publicIdFromUrl);
      setIsLoadingPage(true);
      setError(null);
      setMerchantProfile(null);
      setMenuCategories([]);

      try {
        console.log("[MerchantMenuPage] Fetching merchant profile for publicId:", publicIdFromUrl);
        const merchantsCollectionRef = collection(db, "merchants");
        const merchantQuery = query(merchantsCollectionRef, where("publicMerchantId", "==", publicIdFromUrl), limit(1));
        const merchantQuerySnapshot = await getDocs(merchantQuery);

        if (!merchantQuerySnapshot.empty) {
          const merchantDoc = merchantQuerySnapshot.docs[0];
          const fetchedMerchantProfile = { id: merchantDoc.id, ...merchantDoc.data() } as MerchantProfile;
          console.log("[MerchantMenuPage] Merchant profile found:", fetchedMerchantProfile);
          setMerchantProfile(fetchedMerchantProfile);
        } else {
          console.warn("[MerchantMenuPage] Restaurant profile not found for this ID:", publicIdFromUrl);
          setError("Restaurant profile not found for this ID.");
          setIsLoadingPage(false);
          return;
        }

        console.log("[MerchantMenuPage] Fetching menu items for merchant (publicId):", publicIdFromUrl);
        const menuItemsCollectionRef = collection(db, "menuItems");
        const itemsQuery = query(
          menuItemsCollectionRef, 
          where("merchantId", "==", publicIdFromUrl),
          orderBy("category"), 
          orderBy("name")
        );
        const itemsQuerySnapshot = await getDocs(itemsQuery);
        
        const fetchedItems: MenuItem[] = [];
        itemsQuerySnapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        console.log(`[MerchantMenuPage] Fetched ${fetchedItems.length} raw menu items.`);

        const groupedCategories = groupByCategory(fetchedItems);
        console.log("[MerchantMenuPage] Menu items grouped by category:", groupedCategories);
        setMenuCategories(groupedCategories);

      } catch (err: any) {
        console.error("[MerchantMenuPage] Error fetching menu data:", err);
        setError(`Could not load menu. ${err.message || 'Please try again later.'}`);
      } finally {
        console.log("[MerchantMenuPage] fetchData finished. Setting setIsLoadingPage to false.");
        setIsLoadingPage(false);
      }
    };

    fetchData();
  }, [publicIdFromUrl]);

  const handleProceedToCheckout = async () => {
    if (totalCartItems === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }
    if (!auth.currentUser) {
        toast({
            title: "Authentication Error",
            description: "Could not identify user for order. Please refresh.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmittingOrder(true);
    const displayOrderId = generateDisplayOrderId();
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      displayOrderId,
      customerUid: auth.currentUser.uid,
      merchantPublicId: publicIdFromUrl,
      items: cartItems,
      totalAmount: totalCartPrice,
      status: 'paid', // Initial status, assuming payment gateway handles this
    };

    try {
      const ordersCollectionRef = collection(db, "orders");
      await addDoc(ordersCollectionRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Order Placed Successfully!",
        description: `Your Order ID is: ${displayOrderId}. Thank you!`,
        duration: 10000, // Longer duration to see ID
      });
      clearCart();
      // Attempt to close the window/tab
      // Note: This might not work in all browsers or if the tab wasn't opened by script.
      setTimeout(() => {
        window.close();
      }, 2000); // Short delay to allow toast to be seen

    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Placement Failed",
        description: `Could not place your order. ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  
  if (isLoadingPage) {
    return (
      <div className="space-y-8">
        <div className="text-center py-10 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Menu...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we fetch the delicious items.</p>
        </div>
        <Skeleton className="h-4 w-3/4 mx-auto mb-6" /> 
        {[1, 2].map(i => (
          <section key={i} className="mb-6">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <div className="flex space-x-4 overflow-hidden pb-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-72 w-60 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Loading Menu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {merchantProfile?.restaurantDescription && (
        <p className="text-xs text-muted-foreground text-center -mt-2 mb-4 px-2">
          {merchantProfile.restaurantDescription}
        </p>
       )}
       {!merchantProfile?.restaurantDescription && !isLoadingPage && menuCategories.length > 0 && (
         <p className="text-xs text-muted-foreground text-center -mt-2 mb-4 px-2">
          Welcome! Browse our menu and add your favorites to your order.
        </p>
       )}

      {menuCategories.length === 0 && !error && (
        <Alert variant="default" className="max-w-md mx-auto mt-8">
          <ShoppingBag className="h-5 w-5" />
          <AlertTitle>Menu Coming Soon!</AlertTitle>
          <AlertDescription>
            This restaurant is still setting up their menu or has no items listed. Please check back later!
          </AlertDescription>
        </Alert>
      )}

      {menuCategories.map((category) => (
        <section key={category.id} className="scroll-mt-20" id={category.id}>
          <h2 className="text-lg font-semibold text-primary mb-2 pb-1 border-b-2 border-primary/20">
            {category.name}
          </h2>
          {category.items.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-4">
                {category.items.map((item) => (
                  <MenuDisplayItem key={item.id} item={item} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No items yet!</AlertTitle>
              <AlertDescription>
                There are currently no items available in the {category.name} category.
              </AlertDescription>
            </Alert>
          )}
        </section>
      ))}

      {/* Sticky Bottom Bar - Always visible */}
       <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex-grow cursor-pointer flex items-center group">
                {isLoadingCart ? (
                  <div className="flex items-center">
                     <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                     <p className="text-md font-semibold group-hover:text-primary transition-colors">Loading cart...</p>
                  </div>
                ) : cartItems.length > 0 ? (
                  <div>
                    <p className="text-md font-semibold group-hover:text-primary transition-colors">
                      {totalCartItems} item{totalCartItems !== 1 ? 's' : ''} in cart
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Total: <span className="font-bold text-primary">${totalCartPrice.toFixed(2)}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-md font-semibold group-hover:text-primary transition-colors">
                      Your Order
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Cart is empty
                    </p>
                  </div>
                )}
                <ChevronUp className="ml-2 h-5 w-5 text-primary group-hover:text-accent transition-colors" />
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh] h-auto flex flex-col rounded-t-lg p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-2xl flex items-center">
                  <ShoppingCart className="mr-3 h-6 w-6" /> Your Order
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-grow">
                <div className="p-4 space-y-4">
                  {isLoadingCart ? (
                     <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3 text-md">Loading cart items...</p>
                      </div>
                  ) : cartItems.length > 0 ? (
                    cartItems.map((cartItemEntry) => (
                      <div key={cartItemEntry.id} className="flex items-start gap-4 p-3 border rounded-lg bg-card hover:shadow-md transition-shadow">
                        {cartItemEntry.imageUrl ? (
                          <Image
                            src={cartItemEntry.imageUrl}
                            alt={cartItemEntry.name}
                            width={60}
                            height={60}
                            className="rounded-md object-cover aspect-square"
                            data-ai-hint="food item"
                          />
                        ) : (
                          <div className="h-[60px] w-[60px] bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                            <UtensilsCrossed size={24} />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{cartItemEntry.name}</h4>
                          <p className="text-sm text-muted-foreground">${cartItemEntry.price.toFixed(2)} each</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => cartItemEntry.quantity > 1 ? updateQuantity(cartItemEntry.id, cartItemEntry.quantity - 1) : removeItem(cartItemEntry.id)}
                              aria-label="Decrease quantity"
                              disabled={isLoadingCart}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-medium">{cartItemEntry.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(cartItemEntry.id, cartItemEntry.quantity + 1)}
                              aria-label="Increase quantity"
                              disabled={isLoadingCart}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">${(cartItemEntry.price * cartItemEntry.quantity).toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-7 w-7 mt-1"
                              onClick={() => removeItem(cartItemEntry.id)}
                              aria-label="Remove item"
                              disabled={isLoadingCart}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                      <p className="text-muted-foreground text-center py-4">Your cart is empty.</p>
                  )}
                </div>
              </ScrollArea>
              {cartItems.length > 0 && !isLoadingCart && (
                <SheetFooter className="p-4 border-t bg-background">
                  <SheetClose asChild>
                    <Button variant="outline" onClick={clearCart} className="w-full sm:w-auto">
                      Clear Cart
                    </Button>
                  </SheetClose>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>

          <Button 
            onClick={handleProceedToCheckout} 
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[140px]"
            disabled={totalCartItems === 0 || isLoadingCart || isSubmittingOrder}
          >
            {isSubmittingOrder ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Pay ${totalCartPrice.toFixed(2)}
          </Button>
        </div>
      </div>
      
       <footer className="py-6 md:px-6 md:py-0 border-t mt-12">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <div className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Powered by QR Plus
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {merchantProfile?.restaurantName || "Your Restaurant"}. All Rights Reserved.
            </p>
          </div>
        </footer>
    </div>
  );
}
