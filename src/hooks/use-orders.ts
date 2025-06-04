"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { useToast } from './use-toast';
import { useMerchantProfile } from './use-merchant-profile';

export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useMerchantProfile();

  useEffect(() => {
    fetchOrders();
  }, [profile?.public_merchant_id]);

  // Add real-time subscription for new orders
  useEffect(() => {
    if (!profile?.public_merchant_id) return;
    const channel = supabase.channel(`orders-${profile.public_merchant_id}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `public_merchant_id=eq.${profile.public_merchant_id}`,
        },
        (payload) => {
          const newOrder = payload.new;
          setOrders(prev => [newOrder, ...prev]);
          if (Notification.permission === "granted") {
            new Notification("New Order Received", {
              body: `Order #${newOrder.display_order_id || newOrder.id.substring(0, 8)} has been added.`,
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("New Order Received", {
                  body: `Order #${newOrder.display_order_id || newOrder.id.substring(0, 8)} has been added.`,
                });
              }
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.public_merchant_id]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    if (!profile?.public_merchant_id) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, display_order_id")
        .eq("public_merchant_id", profile.public_merchant_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useOrders] Error fetching orders:", error);
        setError(error.message);
        setOrders([]);
      } else {
        console.log("[useOrders] Fetched orders:", data);
        setOrders(data || []);
      }
    } catch (err: any) {
      console.error("[useOrders] Unexpected error:", err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(orderId: string, updates: any) {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, ...updates } : order));
      return data;
    } catch (err: any) {
      console.error("[useOrders] Error updating order:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const createOrder = async (orderData: Omit<any, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (insertError) throw insertError;

      setOrders(prev => [data, ...prev]);
      toast({
        title: "Order Created",
        description: "Your order has been created successfully.",
      });
      return data;
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create order',
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: any['status']) => {
    try {
      const data = await updateOrder(orderId, { status });
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
      return data;
    } catch (err: any) {
      console.error('[useOrders] Error updating order status:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update order',
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: any['payment_status']) => {
    try {
      const data = await updateOrder(orderId, { payment_status: paymentStatus });
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, payment_status: paymentStatus } : order
      ));
      toast({
        title: "Payment Updated",
        description: "Payment status has been updated successfully.",
      });
      return data;
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update payment status',
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    fetchOrders,
    updateOrder,
  };
} 