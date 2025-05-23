
"use client";

import type { CartItem, MenuItem } from '@/lib/types';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useToast } from './use-toast';

const CART_STORAGE_KEY = 'qrPlusCart';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        try {
          const parsedItems = JSON.parse(storedCart);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          } else {
            console.error("Invalid cart data in localStorage:", parsedItems);
            localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error);
          localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = prevItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
        return updatedItems;
      } else {
        // Item does not exist, add new item
        return [...prevItems, { ...item, quantity }];
      }
    });
    toast({ title: `${item.name} added to cart`, description: `Quantity: ${quantity}` });
  }, [toast]);

  const removeItem = useCallback((itemId: string) => {
    const itemToRemove = items.find(i => i.id === itemId);
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    if (itemToRemove) {
      toast({ title: `${itemToRemove.name} removed from cart`, variant: "destructive" });
    }
  }, [toast, items]); // Added items dependency

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast({ title: "Cart cleared" });
  }, [toast]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);


  const contextValue: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    toggleCart,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
