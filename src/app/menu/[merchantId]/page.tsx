
// src/app/menu/[merchantId]/page.tsx
"use client"; 

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MenuItem, MenuCategory, MerchantProfile, CartItem } from "@/lib/types";
import { MenuDisplayItem } from "./components/menu-display-item";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Info, ShoppingBag, AlertTriangle, Loader2, Trash2, PlusCircle, MinusCircle, CreditCard, ShoppingCart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/components/common/app-logo";

// Helper to group items by category
const groupByCategory = (items: MenuItem[]): MenuCategory[] => {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  return Object.keys(categories).sort().map(categoryName => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
    name: categoryName,
    items: categories[categoryName].sort((a,b) => a.name.localeCompare(b.name)),
  }));
};

export default function MerchantMenuPage() {
  const params = useParams();
  const publicIdFromUrl = params.merchantId as string;
  
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    items: cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getTotalItems, 
    getTotalPrice 
  } = useCart();
  const { toast } = useToast();

  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  useEffect(() => {
    if (!publicIdFromUrl) {
      setError("Public Menu ID is missing from URL.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setMerchantProfile(null);
      setMenuItems([]);
      setMenuCategories([]);

      try {
        const merchantsCollectionRef = collection(db, "merchants");
        const merchantQuery = query(merchantsCollectionRef, where("publicMerchantId", "==", publicIdFromUrl), limit(1));
        const merchantQuerySnapshot = await getDocs(merchantQuery);

        if (!merchantQuerySnapshot.empty) {
          const merchantDoc = merchantQuerySnapshot.docs[0];
          setMerchantProfile({ id: merchantDoc.id, ...merchantDoc.data() } as MerchantProfile);
        } else {
          setError("Restaurant profile not found for this ID.");
          setIsLoading(false);
          return;
        }

        const menuItemsCollectionRef = collection(db, "menuItems");
        const itemsQuery = query(
          menuItemsCollectionRef, 
          where("merchantId", "==", publicIdFromUrl),
          orderBy("createdAt", "desc")
        );
        const itemsQuerySnapshot = await getDocs(itemsQuery);
        
        const fetchedItems: MenuItem[] = [];
        itemsQuerySnapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        setMenuItems(fetchedItems);
        setMenuCategories(groupByCategory(fetchedItems));

      } catch (err) {
        console.error("Error fetching menu data:", err);
        setError("Could not load menu. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [publicIdFromUrl]);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Proceeding to Payment (Demo)",
      description: `You would now be redirected to a payment gateway to pay $${totalCartPrice.toFixed(2)}. This is a demo.`,
      duration: 5000,
    });
  };
  
  const restaurantName = merchantProfile?.restaurantName || `Digital Menu`;

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="text-center border-b pb-8">
          <Skeleton className="w-full h-48 md:h-64 object-cover rounded-lg mb-6 shadow-lg" />
          <Skeleton className="h-10 w-3/4 sm:w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-full max-w-md mx-auto" />
        </div>
        <div className="text-center py-10 flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Loading Menu...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the delicious items.</p>
        </div>
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
    <div className="space-y-12">
      <div className="text-center border-b pb-8">
        <Image 
            src={`https://placehold.co/1200x300.png`} 
            alt={`${restaurantName} Banner`}
            width={1200} 
            height={300} 
            className="w-full h-auto max-h-64 object-cover rounded-lg mb-6 shadow-lg" 
            data-ai-hint="restaurant food"
            priority 
        />
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl mb-2">
          {restaurantName}
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Browse our delicious offerings and add your favorites to the cart.
        </p>
      </div>

      {cartItems.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ShoppingCart className="mr-3 h-6 w-6" /> Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-3 border rounded-lg">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                    data-ai-hint="food item"
                  />
                ) : (
                  <div className="h-[60px] w-[60px] bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                    <UtensilsCrossed size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
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
                <div className="text-right">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-7 w-7 mt-1"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-semibold text-lg">
              <p>Subtotal:</p>
              <p>${totalCartPrice.toFixed(2)}</p>
            </div>
            {cartItems.length > 0 && (
                 <Button variant="outline" onClick={clearCart} className="w-full sm:w-auto">
                    Clear Cart
                </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && menuItems.length === 0 && !error && (
        <Alert variant="default" className="max-w-md mx-auto">
          <ShoppingBag className="h-5 w-5" />
          <AlertTitle>Menu Coming Soon!</AlertTitle>
          <AlertDescription>
            This restaurant is still setting up their menu or has no items listed. Please check back later!
          </AlertDescription>
        </Alert>
      )}

      {menuCategories.map((category) => (
        <section key={category.id} className="scroll-mt-20" id={category.id}>
          <h2 className="text-3xl font-bold text-primary mb-6 pb-2 border-b-2 border-primary/30">
            {category.name}
          </h2>
          {category.items.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.items.map((item) => (
                <MenuDisplayItem key={item.id} item={item} />
              ))}
            </div>
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

      {/* Sticky Bottom Bar */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {totalCartItems} item{totalCartItems > 1 ? 's' : ''} in cart
              </p>
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-primary">${totalCartPrice.toFixed(2)}</span>
              </p>
            </div>
            <Button 
              onClick={handleProceedToCheckout} 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={cartItems.length === 0}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ${totalCartPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
       <footer className="py-6 md:px-6 md:py-0 border-t mt-12">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Powered by <AppLogo showText={false} size={16} className="inline-block align-middle" /> QR Plus.
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {restaurantName}. All Rights Reserved.
            </p>
          </div>
        </footer>
    </div>
  );
}
