"use client";

import { useEffect, useState } from "react";
import { useSupabaseAnonymousAuth } from "@/hooks/use-supabase-anonymous-auth";
import { supabase } from "@/lib/supabase/config";
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export default function OrderHistoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAnonymousAuth();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrderHistory() {
      if (!user?.id || !id) return;
      setOrderHistoryLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, display_order_id, status, created_at, items")
        .eq("customer_uid", user.id)
        .eq("public_merchant_id", id)
        .order("created_at", { ascending: false });
      if (!error && data) setOrderHistory(data);
      setOrderHistoryLoading(false);
    }
    fetchOrderHistory();
  }, [user?.id, id]);

  // Real-time subscription for order status updates
  useEffect(() => {
    if (!user?.id || !id) return;
    const channel = supabase.channel(`order-history-${id}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `public_merchant_id=eq.${id}`,
        },
        (payload) => {
          const updatedOrder = payload.new;
          // Only update if this order belongs to the current user
          if (
            updatedOrder.customer_uid === user.id &&
            updatedOrder.public_merchant_id === id
          ) {
            setOrderHistory((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id
                  ? { ...order, ...updatedOrder }
                  : order
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full border-b bg-background/80 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 py-4 sm:py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Back to menu"
            className="focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 truncate">
            <Clock className="h-6 w-6 shrink-0" />
            <span className="truncate">Your Order History</span>
          </h1>
        </div>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {authLoading || orderHistoryLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span>Loading your orders...</span>
          </div>
        ) : orderHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
            <Clock className="h-8 w-8 mb-2" />
            <span>No previous orders found.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orderHistory.map((order) => (
              <Card key={order.id} className="overflow-hidden w-full">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-1 sm:gap-0">
                  <div className="truncate">
                    <CardTitle className="text-base font-semibold truncate">
                      Order #
                      {order.display_order_id || order.id.substring(0, 8)}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground block">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <Badge
                    className={
                      order.status === "confirmed"
                        ? "bg-green-600 text-white"
                        : order.status === "pending"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <div className="text-sm text-muted-foreground">
                    {order.items && order.items.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="truncate">
                            {item.name} x {item.quantity} — ₹
                            {item.price.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>No items</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
