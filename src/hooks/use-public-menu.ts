"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MenuItem, Order, CartItem } from '@/lib/types';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase/config';
import { generateDisplayOrderId } from '@/lib/utils';

export function usePublicMenu(publicMerchantId: string) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    if (!publicMerchantId) {
      setError("Merchant ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the merchant profile to ensure it exists
      const { data: merchant, error: merchantError } = await supabase
        .from("merchant_profiles")
        .select("id")
        .eq("public_merchant_id", publicMerchantId)
        .maybeSingle();

      if (merchantError) {
        throw new Error("Merchant not found");
      }

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      // Then fetch menu items using the internal merchant ID
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform snake_case to camelCase for frontend
      const transformedItems = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        priceCurrency: item.price_currency,
        imageUrl: item.image_url,
        category: item.category,
        merchantId: item.merchant_id,
        isAvailable: true, // Set default value since column doesn't exist
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setMenuItems(transformedItems);
    } catch (err: any) {
      console.error("[usePublicMenu] Error fetching menu items:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicMerchantId]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const createOrder = useCallback(async (payload: {
    public_merchant_id: string;
    customer_uid: string;
    items: CartItem[];
    total: number;
    status: 'pending' | 'confirmed' | 'cancelled';
  }): Promise<Order> => {
    try {
      console.log('[usePublicMenu] Creating order with payload:', payload);
      const displayOrderId = generateDisplayOrderId();
      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
          public_merchant_id: payload.public_merchant_id,
          customer_uid: payload.customer_uid,
          display_order_id: displayOrderId,
          items: payload.items,
          total: payload.total,
          status: payload.status
        }])
        .select()
        .single();

      if (error) {
        console.error('[usePublicMenu] Supabase error:', error);
        throw error;
      }
      return order;
    } catch (err: any) {
      console.error('[usePublicMenu] Error creating order:', JSON.stringify(err, null, 2));
      throw err;
    }
  }, []);

  return { menuItems, loading, error, createOrder };
} 