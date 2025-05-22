"use client"; 

import { useEffect, useState } from "react";
import type { MenuItem, MenuCategory, MerchantProfile } from "@/lib/types"; // Added MerchantProfile
import { MenuDisplayItem } from "./components/menu-display-item";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Info, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

// Sample Data - In a real app, fetch this based on merchantId
const sampleMenuItems: MenuItem[] = [
  { id: "1", name: "Margherita Pizza", description: "Classic delight with 100% real mozzarella cheese", price: 12.99, category: "Pizzas", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "pizza" },
  { id: "2", name: "Pepperoni Passion", description: "Loaded with spicy pepperoni and extra cheese.", price: 14.99, category: "Pizzas", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "pepperoni pizza"},
  { id: "3", name: "Caesar Salad", description: "Crisp romaine lettuce, parmesan, croutons, and Caesar dressing.", price: 8.50, category: "Salads", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "salad" },
  { id: "4", name: "Coca-Cola", description: "Classic refreshing Coca-Cola.", price: 2.50, category: "Drinks", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "beverage" },
  { id: "5", name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs.", price: 5.00, category: "Sides", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "bread appetizer"},
  { id: "6", name: "Veggie Supreme Pizza", description: "A medley of fresh vegetables on a cheesy base.", price: 13.99, category: "Pizzas", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "vegetarian pizza" },
  { id: "7", name: "Chicken Wings", description: "Spicy and tangy chicken wings, served with a dip.", price: 9.99, category: "Sides", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "chicken wings" },
  { id: "8", name: "Iced Tea", description: "Refreshing lemon iced tea.", price: 2.75, category: "Drinks", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "iced tea"},
];

// Helper to group items by category
const groupByCategory = (items: MenuItem[]): MenuCategory[] => {
  const categories: { [key: string]: MenuItem[] } = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  return Object.keys(categories).map(categoryName => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
    name: categoryName,
    items: categories[categoryName],
  }));
};

const PROFILE_STORAGE_KEY = 'qrPlusMerchantProfile'; // Same key as in useMerchantProfile

export default function MerchantMenuPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [restaurantName, setRestaurantName] = useState("Welcome");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    console.log("Displaying menu for merchant:", merchantId);
    
    // Attempt to load restaurant name from localStorage if this merchantId matches the stored one
    if (typeof window !== 'undefined') {
      const storedProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfileData) {
        try {
          const parsedProfile: MerchantProfile = JSON.parse(storedProfileData);
          if (parsedProfile.id === merchantId) {
            setRestaurantName(parsedProfile.restaurantName);
          } else {
             setRestaurantName(`Menu for ID: ${merchantId.substring(0,8)}...`); // Fallback if ID doesn't match
          }
        } catch (e) {
          console.error("Error parsing profile for menu page:", e);
          setRestaurantName(`Menu (ID: ${merchantId.substring(0,8)}...)`);
        }
      } else {
         setRestaurantName(`Digital Menu`); // Generic if no profile stored
      }
    }

    // For now, use sample data for menu items
    // In a real app, you would fetch menu items specific to merchantId
    setMenuCategories(groupByCategory(sampleMenuItems));
    setIsLoading(false);
  }, [merchantId]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground animate-pulse mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Loading Menu...</h2>
        <p className="text-muted-foreground">Please wait while we fetch the delicious items for you.</p>
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

      {menuCategories.length === 0 && !isLoading && (
        <Alert variant="default" className="max-w-md mx-auto">
          <ShoppingBag className="h-5 w-5" />
          <AlertTitle>Menu Coming Soon!</AlertTitle>
          <AlertDescription>
            This restaurant is setting up their menu. Please check back later!
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
                There are currently no items available in the {category.name} category for this restaurant.
              </AlertDescription>
            </Alert>
          )}
        </section>
      ))}
    </div>
  );
}
