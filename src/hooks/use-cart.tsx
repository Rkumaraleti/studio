
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

  const getCartStorageKey = useCallback(() => {
    if (currentUser) {
      return `qrPlusCart_${currentUser.uid}`;
    }
    return null;
  }, [currentUser]);

  useEffect(() => {
    setIsLoadingCart(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            setCurrentUser(userCredential.user);
          })
          .catch((error) => {
            console.error("Error signing in anonymously:", error);
            toast({
              title: "Cart Initialization Error",
              description: "Could not create a cart session. Please refresh.",
              variant: "destructive",
            });
            setCurrentUser(null);
            setIsLoadingCart(false); // Stop loading if anonymous sign-in fails
          });
      }
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    const storageKey = getCartStorageKey();
    if (storageKey && typeof window !== 'undefined') {
      setIsLoadingCart(true);
      const storedCart = localStorage.getItem(storageKey);
      if (storedCart) {
        try {
          const parsedItems = JSON.parse(storedCart);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          } else {
            localStorage.removeItem(storageKey);
            setItems([]); // Initialize as empty if data is corrupt
          }
        } catch (error) {
          console.error(`Failed to parse cart from localStorage for key ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
          setItems([]); // Initialize as empty if parsing fails
        }
      } else {
        setItems([]); // No cart found for this user, initialize as empty
      }
      setIsLoadingCart(false);
    } else if (!currentUser) {
      // Still waiting for user (anonymous or otherwise)
      setIsLoadingCart(true);
    } else {
      // Current user exists, but storage key is somehow null (should not happen if logic is correct)
      // Or, window is not defined (server-side rendering context, no localStorage access)
      // In SSR, items will be empty, and loaded client-side.
      if (typeof window === 'undefined') {
          setIsLoadingCart(false); // Not loading on server, cart will be empty
      } else {
          setIsLoadingCart(false); // Default to not loading if key is missing but user exists
      }
    }
  }, [currentUser, getCartStorageKey]);

  useEffect(() => {
    const storageKey = getCartStorageKey();
    // Only save if we are not in the initial loading phase AND a storage key is available
    if (storageKey && typeof window !== 'undefined' && !isLoadingCart && items.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } else if (storageKey && typeof window !== 'undefined' && !isLoadingCart && items.length === 0) {
      // If cart becomes empty, remove it from localStorage for this user
      localStorage.removeItem(storageKey);
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
