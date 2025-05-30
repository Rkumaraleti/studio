
// src/app/menu/[merchantId]/page.tsx
"use client"; 

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MenuItem, MenuCategory, MerchantProfile, Order, OrderStatus } from "@/lib/types";
import { MenuDisplayItem } from "./components/menu-display-item";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Info, ShoppingBag, AlertTriangle, Loader2, Trash2, PlusCircle, MinusCircle, CreditCard, ShoppingCart, ChevronUp, CheckCircle2, XCircle, Hourglass } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/hooks/use-cart"; // Corrected path
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, doc, onSnapshot, DocumentReference } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/components/common/app-logo";


// Helper to group items by category
const groupByCategory = (items: MenuItem[]): MenuCategory[] => {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach(item => {
    const categoryKey = item.category?.trim() || 'Uncategorized';
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

const formatPrice = (price: number, currencyCode: string = 'INR') => {
  const symbol = currencyCode === 'INR' ? '₹' : '$';
  return `${symbol}${price.toFixed(2)}`;
};


export default function MerchantMenuPage() {
  const params = useParams();
  const publicIdFromUrl = params.merchantId as string;

  console.log("[MerchantMenuPage] Component invoked. Raw params:", params, "Extracted publicIdFromUrl:", publicIdFromUrl);

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [viewMode, setViewMode] = useState<'menu' | 'tracking'>('menu'); 
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null); 
  const [activeDisplayOrderId, setActiveDisplayOrderId] = useState<string | null>(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState<OrderStatus | null>(null);

  const { 
    items: cartItems, 
    addItem, // Added addItem to destructuring
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
  const currentCurrencyCode = merchantProfile?.currency || "INR";

  useEffect(() => {
    console.log("[MerchantMenuPage] useEffect for initial data. publicIdFromUrl:", publicIdFromUrl);

    if (!publicIdFromUrl || typeof publicIdFromUrl !== 'string' || publicIdFromUrl.trim() === "") {
      console.error("[MerchantMenuPage] Public Menu ID is missing or invalid in URL. Params:", params);
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

  useEffect(() => {
    if (!activeOrderId || viewMode !== 'tracking') {
      return; 
    }

    console.log(`[MerchantMenuPage] Setting up listener for order ${activeOrderId}`);
    const orderDocRef = doc(db, "orders", activeOrderId);
    const unsubscribe = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data() as Order;
        setActiveOrderStatus(orderData.status);
        console.log(`[MerchantMenuPage] Order ${activeOrderId} status updated to: ${orderData.status}`);

        if (orderData.status === 'confirmed') {
          toast({
            title: "Order Confirmed!",
            description: `Your order #${activeDisplayOrderId} has been confirmed by the restaurant.`,
            variant: "default",
            duration: 7000, 
          });
          setTimeout(() => {
             try { if (typeof window !== 'undefined' && window.close) window.close(); } catch (e) { console.warn("Could not close window:", e); }
          }, 3000); 
        } else if (orderData.status === 'cancelled') {
          toast({
            title: "Order Cancelled",
            description: `Your order #${activeDisplayOrderId} has been cancelled.`,
            variant: "destructive",
            duration: 7000,
          });
           setTimeout(() => {
             try { if (typeof window !== 'undefined' && window.close) window.close(); } catch (e) { console.warn("Could not close window:", e); }
           }, 3000);
        }
      } else {
        console.warn(`[MerchantMenuPage] Active order document ${activeOrderId} not found.`);
        setError("Your order details could not be retrieved. It might have been removed.");
        setViewMode('menu'); 
        setActiveOrderId(null);
      }
    }, (error) => {
      console.error(`[MerchantMenuPage] Error listening to order ${activeOrderId}:`, error);
      toast({
        title: "Tracking Error",
        description: "Could not get real-time updates for your order.",
        variant: "destructive",
      });
    });

    return () => {
      console.log(`[MerchantMenuPage] Unsubscribing from order ${activeOrderId}`);
      unsubscribe();
    };
  }, [activeOrderId, activeDisplayOrderId, toast, viewMode]);


  const handleProceedToCheckout = async () => {
    if (totalCartItems === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (isLoadingCart) { 
      toast({ title: "Please wait", description: "Cart is still initializing.", variant: "default" });
      return;
    }

    const currentUserForOrder = auth.currentUser; 
    if (!currentUserForOrder) {
        toast({
            title: "Authentication Error",
            description: "Could not identify user for order. Please refresh or try again in a moment.",
            variant: "destructive",
        });
        setIsSubmittingOrder(false);
        return;
    }
    console.log("[MerchantMenuPage] Proceeding to checkout with user:", currentUserForOrder.uid);


    setIsSubmittingOrder(true);
    const displayOrderId = generateDisplayOrderId();
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      displayOrderId,
      customerUid: currentUserForOrder.uid, 
      merchantPublicId: publicIdFromUrl,
      items: cartItems,
      totalAmount: totalCartPrice,
      status: 'pending', 
    };

    try {
      const ordersCollectionRef = collection(db, "orders");
      const docRef: DocumentReference = await addDoc(ordersCollectionRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setActiveOrderId(docRef.id); 
      setActiveDisplayOrderId(displayOrderId);
      setActiveOrderStatus('pending');
      setViewMode('tracking'); 
      clearCart();
      
      // No immediate toast, the tracking view will provide updates.
      console.log(`Order ${displayOrderId} placed successfully. Firestore ID: ${docRef.id}`);

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

  if (viewMode === 'tracking' && activeDisplayOrderId) {
    let statusMessage = "Waiting for confirmation...";
    let StatusIcon = Hourglass;
    let iconColor = "text-yellow-500";

    if (activeOrderStatus === 'pending') {
      statusMessage = "Your order is pending confirmation.";
      StatusIcon = Hourglass;
      iconColor = "text-yellow-500 animate-pulse";
    } else if (activeOrderStatus === 'confirmed') {
      statusMessage = "Your order has been confirmed!";
      StatusIcon = CheckCircle2;
      iconColor = "text-green-500";
    } else if (activeOrderStatus === 'cancelled') {
      statusMessage = "Your order has been cancelled.";
      StatusIcon = XCircle;
      iconColor = "text-red-500";
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full">
          <StatusIcon className={`h-16 w-16 mx-auto mb-6 ${iconColor}`} />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Order Status</h2>
          <p className="text-lg text-muted-foreground mb-1">
            Order ID: <strong className="text-primary">{activeDisplayOrderId}</strong>
          </p>
          <p className="text-md text-muted-foreground mb-6">{statusMessage}</p>
          
          {(activeOrderStatus === 'pending') && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Please keep this window open for updates.</span>
            </div>
          )}
           {(activeOrderStatus === 'confirmed' || activeOrderStatus === 'cancelled') && (
             <p className="text-sm text-muted-foreground">This window will attempt to close shortly.</p>
           )}
        </div>
         <footer className="py-6 md:px-6 md:py-8 mt-12 text-center w-full">
            <div className="text-balance text-xs leading-loose text-muted-foreground">
              Powered by <AppLogo showText={false} size={14} className="inline-block align-middle" /> QR Plus.
            </div>
          </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {merchantProfile?.restaurantDescription && (
        <p className="text-xs text-muted-foreground text-center mb-4 px-2">
          {merchantProfile.restaurantDescription}
        </p>
       )}
       {!merchantProfile?.restaurantDescription && !isLoadingPage && menuCategories.length > 0 && (
         <p className="text-xs text-muted-foreground text-center mb-4 px-2">
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
                  <MenuDisplayItem key={item.id} item={item} currencyCode={currentCurrencyCode} />
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex-grow cursor-pointer flex items-center group">
                {isLoadingCart ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                    <p className="text-md font-semibold group-hover:text-primary transition-colors">Loading cart...</p>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div>
                    <p className="text-md font-semibold group-hover:text-primary transition-colors">
                      Your Order
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Cart is empty
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-md font-semibold group-hover:text-primary transition-colors">
                      {totalCartItems} item{totalCartItems !== 1 ? 's' : ''} in cart
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Total: <span className="font-bold text-primary">{formatPrice(totalCartPrice, currentCurrencyCode)}</span>
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
                          <p className="text-sm text-muted-foreground">{formatPrice(cartItemEntry.price, currentCurrencyCode)} each</p>
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
                            <p className="font-semibold">{formatPrice(cartItemEntry.price * cartItemEntry.quantity, currentCurrencyCode)}</p>
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
            className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]"
            disabled={totalCartItems === 0 || isLoadingCart || isSubmittingOrder}
          >
            {isSubmittingOrder ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Pay {formatPrice(totalCartPrice, currentCurrencyCode)}
          </Button>
        </div>
      </div>
      
       <footer className="py-6 md:px-6 md:py-8 border-t mt-12 text-center w-full">
            <div className="text-balance text-xs leading-loose text-muted-foreground">
              Powered by <AppLogo showText={false} size={14} className="inline-block align-middle" /> QR Plus.
            </div>
          </footer>
    </div>
  );
}
