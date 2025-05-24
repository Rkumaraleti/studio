
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
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  const getCartStorageKey = useCallback(() => {
    if (currentUser) {
      return `qrPlusCart_${currentUser.uid}`;
    }
    return null;
  }, [currentUser]);

  useEffect(() => {
    console.log("[CartProvider] Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[CartProvider] Auth state changed. User found:", user.uid, "isAnonymous:", user.isAnonymous);
        setCurrentUser(user);
        setIsAuthResolved(true); // Mark auth as resolved if user was already present
      } else {
        console.log("[CartProvider] Auth state changed. No user found. Attempting anonymous sign-in.");
        signInAnonymously(auth)
          .then((userCredential) => {
            console.log("[CartProvider] Anonymous sign-in successful. User UID:", userCredential.user.uid);
            setCurrentUser(userCredential.user);
          })
          .catch((error) => {
            console.error("[CartProvider] Error signing in anonymously for cart:", error);
            toast({
              title: "Cart Session Error",
              description: "Could not initialize a cart session. Please refresh.",
              variant: "destructive",
            });
            setCurrentUser(null); // Explicitly set to null on failure
          })
          .finally(() => {
            console.log("[CartProvider] Anonymous sign-in attempt finished.");
            setIsAuthResolved(true); // Mark auth as resolved after attempt
          });
        // Removed early return; setIsAuthResolved is handled in .finally()
      }
    });
    return () => {
      console.log("[CartProvider] Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    if (!isAuthResolved) {
      console.log("[CartProvider] Auth not resolved yet. Cart loading deferred.");
      setIsLoadingCart(true);
      return;
    }
    console.log("[CartProvider] Auth resolved. Current user for cart:", currentUser?.uid);

    const storageKey = getCartStorageKey();
    if (storageKey && typeof window !== 'undefined') {
      console.log(`[CartProvider] Loading cart from localStorage with key: ${storageKey}`);
      const storedCart = localStorage.getItem(storageKey);
      if (storedCart) {
        try {
          const parsedItems = JSON.parse(storedCart);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
            console.log(`[CartProvider] Cart loaded from localStorage: ${parsedItems.length} item types.`);
          } else {
            console.warn(`[CartProvider] Invalid cart data in localStorage for key ${storageKey}. Clearing.`);
            localStorage.removeItem(storageKey);
            setItems([]);
          }
        } catch (error) {
          console.error(`[CartProvider] Failed to parse cart from localStorage for key ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
          setItems([]);
        }
      } else {
        console.log(`[CartProvider] No cart data found in localStorage for key ${storageKey}.`);
        setItems([]);
      }
    } else if (typeof window !== 'undefined' && !storageKey && currentUser === null) {
        console.log("[CartProvider] No storage key (anonymous sign-in might have failed or pending) and currentUser is null. Cart empty.");
        setItems([]);
    } else if (typeof window === 'undefined') {
      console.log("[CartProvider] SSR context. Cart initialized empty.");
      setItems([]);
    }
    setIsLoadingCart(false);
    console.log("[CartProvider] Cart loading finished. isLoadingCart: false");
  }, [isAuthResolved, currentUser, getCartStorageKey]);


  useEffect(() => {
    const storageKey = getCartStorageKey();
    if (storageKey && typeof window !== 'undefined' && !isLoadingCart) {
      if (items.length > 0) {
        console.log(`[CartProvider] Saving cart to localStorage with key ${storageKey}: ${items.length} item types.`);
        localStorage.setItem(storageKey, JSON.stringify(items));
      } else {
        console.log(`[CartProvider] Cart is empty, removing from localStorage with key ${storageKey}.`);
        localStorage.removeItem(storageKey);
      }
    }
  }, [items, getCartStorageKey, isLoadingCart]);


  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    if (isLoadingCart || !isAuthResolved) { 
      toast({ title: "Please wait", description: "Cart is initializing...", variant: "default" });
      return;
    }
    if (!currentUser) { 
        toast({ title: "Session Error", description: "Cannot add to cart. Please refresh.", variant: "destructive"});
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
  }, [toast, currentUser, isLoadingCart, isAuthResolved]);

  const removeItem = useCallback((itemId: string) => {
    if (isLoadingCart || !isAuthResolved || !currentUser) return;
    const itemToRemove = items.find(i => i.id === itemId);
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    if (itemToRemove) {
      toast({ title: `${itemToRemove.name} removed from cart`, variant: "destructive" });
    }
  }, [toast, items, currentUser, isLoadingCart, isAuthResolved]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (isLoadingCart || !isAuthResolved || !currentUser) return;
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
    );
  }, [removeItem, currentUser, isLoadingCart, isAuthResolved]);

  const clearCart = useCallback(() => {
    if (isLoadingCart || !isAuthResolved || !currentUser) return;
    setItems([]);
    toast({ title: "Cart cleared" });
  }, [toast, currentUser, isLoadingCart, isAuthResolved]);

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
