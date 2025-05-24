
// src/app/(app)/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Info, Hourglass, CheckCircle2, XCircle, RefreshCw, ThumbsUp, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

const orderStatusMap: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; textColor?: string }> = {
  pending: { label: "Pending", icon: Hourglass, color: "bg-yellow-500", textColor: "text-yellow-50" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "bg-green-600", textColor: "text-green-50" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-600", textColor: "text-red-50" },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { publicMerchantId, isLoadingProfile } = useMerchantProfile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || isLoadingProfile) {
      setIsLoadingOrders(true);
      return;
    }
    if (!user || !publicMerchantId) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);
    const ordersCollectionRef = collection(db, "orders");
    const q = query(
      ordersCollectionRef,
      where("merchantPublicId", "==", publicMerchantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);
      setIsLoadingOrders(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: `Could not fetch orders. ${error.message}`, variant: "destructive" });
      setIsLoadingOrders(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading, publicMerchantId, isLoadingProfile, toast]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderDocRef = doc(db, "orders", orderId);
      await updateDoc(orderDocRef, { status: newStatus, updatedAt: serverTimestamp() });
      toast({ title: "Order Status Updated", description: `Order #${orderId.substring(0,8)}... is now ${newStatus}.` });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({ title: "Update Error", description: "Could not update order status.", variant: "destructive" });
    }
  };

  const getRelativeTime = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) {
      return 'just now';
    }
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      console.warn("Error formatting date:", error, "Timestamp:", timestamp);
      return 'a while ago';
    }
  };

  if (authLoading || isLoadingProfile || (isLoadingOrders && user && publicMerchantId)) {
    return (
      <div className="flex justify-center items-center h-64 p-4 md:p-6 lg:p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading orders...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
     return null; // AuthProvider handles redirect
  }

  if (user && !publicMerchantId && !isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-64 p-4 md:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-md">Waiting for merchant profile to initialize...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders Management
        </h1>
        <p className="text-muted-foreground">
          View and manage incoming orders from your customers. New orders appear in real-time.
        </p>
      </div>

      {isLoadingOrders ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-md">Fetching latest orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card p-8 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Orders Yet</h2>
          <p className="text-muted-foreground mt-1">
            When customers place orders through your QR menu, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map(order => {
            const statusInfo = orderStatusMap[order.status] || { label: order.status, icon: Info, color: "bg-gray-500", textColor: "text-gray-50" };
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Order #{order.displayOrderId || order.id.substring(0, 8)}</CardTitle>
                    <Badge className={`${statusInfo.color} ${statusInfo.textColor || 'text-white'} font-medium`}>
                      <StatusIcon className="h-4 w-4 mr-1.5" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardDescription>
                    Placed {getRelativeTime(order.createdAt)} {order.customerName ? `by ${order.customerName}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-grow">
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Items</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                      {order.items.map(item => (
                        <li key={item.id}>{item.quantity}x {item.name} (${item.price.toFixed(2)} each)</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">Total Amount</p>
                    <p className="text-lg font-semibold text-primary">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  {order.notes && (
                     <div>
                       <p className="text-sm font-medium leading-none">Notes</p>
                       <p className="text-sm text-muted-foreground italic">
                         "{order.notes}"
                       </p>
                     </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-3 md:flex-row md:justify-between md:items-center border-t pt-4 mt-auto">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1" /> Updated {getRelativeTime(order.updatedAt || order.createdAt)}
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                      >
                        <Ban className="mr-2 h-4 w-4" /> Cancel Order
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" /> Complete Order
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
