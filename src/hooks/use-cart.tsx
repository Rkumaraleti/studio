
"use client";

import type { CartItem, MenuItem } from '@/lib/types';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';

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
  isLoadingCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isAuthResolved, setIsAuthResolved] = useState(false); // New state

  const getCartStorageKey = useCallback(() => {
    if (currentUser) {
      return `qrPlusCart_${currentUser.uid}`;
    }
    return null;
  }, [currentUser]);

  useEffect(() => {
    // This effect only handles auth state resolution
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            setCurrentUser(userCredential.user);
          })
          .catch((error) => {
            console.error("Error signing in anonymously for cart:", error);
            toast({
              title: "Cart Session Error",
              description: "Could not initialize a cart session. Please refresh.",
              variant: "destructive",
            });
            setCurrentUser(null);
          });
      }
      setIsAuthResolved(true); // Mark auth as resolved
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    // This effect handles localStorage loading and setting isLoadingCart
    if (!isAuthResolved) { // Don't do anything until auth state is known
      setIsLoadingCart(true);
      return;
    }

    const storageKey = getCartStorageKey();
    if (storageKey && typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(storageKey);
      if (storedCart) {
        try {
          const parsedItems = JSON.parse(storedCart);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          } else {
            localStorage.removeItem(storageKey);
            setItems([]);
          }
        } catch (error) {
          console.error(`Failed to parse cart from localStorage for key ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } else if (typeof window !== 'undefined' && !storageKey && currentUser === null) {
        // This case means anonymous sign-in failed and currentUser is explicitly null.
        // Cart should be empty.
        setItems([]);
    } else if (typeof window === 'undefined') {
      // SSR: cart is empty initially
      setItems([]);
    }
    setIsLoadingCart(false); // Loading is complete once auth is resolved and localStorage is checked/loaded
  }, [isAuthResolved, currentUser, getCartStorageKey]);


  useEffect(() => {
    const storageKey = getCartStorageKey();
    if (storageKey && typeof window !== 'undefined' && !isLoadingCart) { // Only save if not loading and key exists
      if (items.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } else {
        localStorage.removeItem(storageKey); // Remove if cart is empty
      }
    }
  }, [items, getCartStorageKey, isLoadingCart]);


  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    if (!currentUser || isLoadingCart) {
      toast({ title: "Please wait", description: "Cart is initializing...", variant: "default" });
      return;
    }
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);
      if (existingItemIndex > -1) {
        const updatedItems = prevItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
        return updatedItems;
      } else {
        return [...prevItems, { ...item, quantity }];
      }
    });
    toast({ title: `${item.name} added to cart`, description: `Quantity: ${quantity}` });
  }, [toast, currentUser, isLoadingCart]);

  const removeItem = useCallback((itemId: string) => {
    if (!currentUser || isLoadingCart) return;
    const itemToRemove = items.find(i => i.id === itemId);
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    if (itemToRemove) {
      toast({ title: `${itemToRemove.name} removed from cart`, variant: "destructive" });
    }
  }, [toast, items, currentUser, isLoadingCart]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (!currentUser || isLoadingCart) return;
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
    );
  }, [removeItem, currentUser, isLoadingCart]);

  const clearCart = useCallback(() => {
    if (!currentUser || isLoadingCart) return;
    setItems([]);
    toast({ title: "Cart cleared" });
  }, [toast, currentUser, isLoadingCart]);

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
    isLoadingCart,
  };

  const Provider = CartContext.Provider;
  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
