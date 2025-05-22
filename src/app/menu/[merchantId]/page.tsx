
// src/app/menu/[merchantId]/page.tsx
"use client"; 

import { useEffect, useState } from "react";
import type { MenuItem, MenuCategory, MerchantProfile } from "@/lib/types";
import { MenuDisplayItem } from "./components/menu-display-item";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Info, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

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
  const publicIdFromUrl = params.merchantId as string; // This is now the publicMerchantId
  
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicIdFromUrl) {
      setError("Public Menu ID is missing from URL.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setMerchantProfile(null); // Reset profile on new fetch
      setMenuItems([]);
      setMenuCategories([]);

      try {
        // Fetch merchant profile using publicMerchantId
        const merchantsCollectionRef = collection(db, "merchants");
        const merchantQuery = query(merchantsCollectionRef, where("publicMerchantId", "==", publicIdFromUrl), limit(1));
        const merchantQuerySnapshot = await getDocs(merchantQuery);

        let foundMerchant: MerchantProfile | null = null;
        if (!merchantQuerySnapshot.empty) {
          const merchantDoc = merchantQuerySnapshot.docs[0];
          foundMerchant = { id: merchantDoc.id, ...merchantDoc.data() } as MerchantProfile;
          setMerchantProfile(foundMerchant);
        } else {
          setError("Restaurant profile not found for this ID.");
          setIsLoading(false);
          return;
        }

        // Fetch menu items using publicMerchantId (which is stored as merchantId in menuItems)
        const menuItemsCollectionRef = collection(db, "menuItems");
        const itemsQuery = query(
          menuItemsCollectionRef, 
          where("merchantId", "==", publicIdFromUrl), // Query by publicMerchantId
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
  
  const restaurantName = merchantProfile?.restaurantName || `Digital Menu`;

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
          Browse our delicious offerings and add your favorites to the cart. Public Menu ID: {publicIdFromUrl}
        </p>
      </div>

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
    </div>
  );
}
