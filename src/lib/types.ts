
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

export interface MerchantProfile {
  id: string; // Firebase UID, this IS the document ID in 'merchants' collection
  publicMerchantId: string; // The new publicly shareable, generated merchant ID
  restaurantName: string;
  restaurantDescription?: string; // Optional description for the restaurant
  staticMenuUrl?: string; // The canonical URL for the QR code
  paymentGatewayConfigured: boolean;
  paymentGatewayAccountId?: string;
  currency: string; // e.g., "USD"
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

// Updated OrderStatus type
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Order {
  id: string; // Firestore document ID (auto-generated)
  displayOrderId: string; // User-friendly Order ID (e.g., ORD-AB12CD)
  customerUid: string; // UID of the customer (can be anonymous)
  merchantPublicId: string; // The public ID of the merchant
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: any; // Firestore serverTimestamp
  updatedAt: any; // Firestore serverTimestamp
  customerName?: string; // Optional: if user provides a name
  notes?: string; // Optional: special instructions from customer
}
