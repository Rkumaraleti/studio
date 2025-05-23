
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, MenuItem } from '@/lib/types';
import { useToast } from './use-toast';

const CART_STORAGE_KEY = 'qrPlusCart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // This might be vestigial if cart is always a sheet
  const { toast } = useToast();

  // Load cart from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        try {
          const parsedItems = JSON.parse(storedCart);
          if (Array.isArray(parsedItems)) { // Basic validation
            setItems(parsedItems);
          } else {
            console.error("Invalid cart data in localStorage:", parsedItems);
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error);
          localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
    toast({ title: `${item.name} added to cart`, description: `Quantity: ${quantity}` });
  }, [toast]);

  const removeItem = useCallback((itemId: string) => {
    const removedItem = items.find(i => i.id === itemId); // Find before filtering for toast
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    if (removedItem) {
      toast({ title: `${removedItem.name} removed from cart`, variant: "destructive" });
    }
  }, [items, toast]); // items dependency for removedItem name

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

  const toggleCart = useCallback(() => { // May not be used if Sheet is the only interface
    setIsCartOpen(prev => !prev);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []); // May not be used
  const closeCart = useCallback(() => setIsCartOpen(false), []); // May not be used

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen, // Potentially unused
    toggleCart, // Potentially unused
    openCart,   // Potentially unused
    closeCart,  // Potentially unused
  };
}

