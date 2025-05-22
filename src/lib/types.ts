export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  aiSuggestions?: string[];
  dataAiHint?: string; // Added to align with current usage in menu display
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
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: number; // Using number for Date.now()
  merchantId: string;
}

export interface MerchantProfile {
  id: string; // This will serve as merchantId
  restaurantName: string;
  paymentGatewayConfigured: boolean; 
  stripeAccountId?: string; // Added field for Stripe ID
  currency: string; // e.g., "USD"
}
