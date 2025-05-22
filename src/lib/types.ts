export interface MenuItem {
  id: string; // Firestore document ID
  merchantId: string; // Firebase UID of the merchant
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  aiSuggestions?: string[];
  dataAiHint?: string; 
  createdAt?: any; // Firestore Timestamp or serverTimestamp() placeholder
  updatedAt?: any; // Firestore Timestamp or serverTimestamp() placeholder
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface CartItem extends MenuItem { // CartItem likely won't need merchantId directly if derived from MenuItem
  quantity: number;
}

export interface Order {
  id: string; // Firestore document ID
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: any; // Firestore Timestamp
  merchantId: string; // Firebase UID of the merchant
  customerId?: string; // Optional: if you have customer accounts
}

export interface MerchantProfile {
  id: string; // Firebase UID, serves as merchantId
  restaurantName: string;
  paymentGatewayConfigured: boolean; 
  stripeAccountId?: string;
  currency: string; // e.g., "USD"
  // Add other profile fields as needed, e.g., address, contact, logoUrl
  createdAt?: any; 
  updatedAt?: any;
}
