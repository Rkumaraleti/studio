
export interface MenuItem {
  id: string; // Firestore document ID
  merchantId: string; // This will store the publicMerchantId
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

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string; // Firestore document ID
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: any; // Firestore Timestamp
  merchantId: string; // This will also store the publicMerchantId
  customerId?: string; // Optional: if you have customer accounts
}

export interface MerchantProfile {
  id: string; // Firebase UID, this IS the document ID in 'merchants' collection
  publicMerchantId: string; // The new publicly shareable, generated merchant ID
  restaurantName: string;
  restaurantDescription?: string; // Optional description for the restaurant
  paymentGatewayConfigured: boolean; 
  paymentGatewayAccountId?: string;
  currency: string; // e.g., "USD"
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

