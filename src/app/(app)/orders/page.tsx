
// src/app/(app)/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Info, RefreshCw, PackageCheck, Utensils, Bike, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';

const orderStatusMap: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: RefreshCw, color: "bg-yellow-500" },
  paid: { label: "Paid", icon: PackageCheck, color: "bg-blue-500" },
  confirmed: { label: "Confirmed", icon: PackageCheck, color: "bg-green-500" },
  preparing: { label: "Preparing", icon: Utensils, color: "bg-orange-500" },
  ready: { label: "Ready", icon: Bike, color: "bg-purple-500" },
  delivered: { label: "Delivered", icon: PackageCheck, color: "bg-gray-700" },
  cancelled: { label: "Cancelled", icon: Ban, color: "bg-red-500" },
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
      await updateDoc(orderDocRef, { status: newStatus, updatedAt: new Date() }); // Using new Date() for client-side timestamp
      toast({ title: "Order Status Updated", description: `Order ${orderId.substring(0,8)}... is now ${newStatus}.` });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({ title: "Update Error", description: "Could not update order status.", variant: "destructive" });
    }
  };
  
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) {
      return 'just now';
    }
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      console.warn("Error formatting date:", error, "Timestamp:", timestamp);
      return 'a while ago';
    }
  }; // Explicit semicolon

  if (authLoading || isLoadingProfile || (isLoadingOrders && user && publicMerchantId)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading orders...</p>
      </div>
    );
  }
  
  if (!user && !authLoading) {
     return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders Management
        </h1>
        <p className="text-muted-foreground">
          View and manage incoming orders for your restaurant.
        </p>
      </div>

      {isLoadingOrders && user && publicMerchantId ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-md">Fetching your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Orders Yet!</AlertTitle>
          <AlertDescription>
            When customers place orders through your QR menu, they will appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Order: {order.displayOrderId}</CardTitle>
                    <CardDescription>
                      Received {getRelativeTime(order.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className={`${orderStatusMap[order.status]?.color || 'bg-gray-500'} text-white`}>
                     {orderStatusMap[order.status]?.icon && <orderStatusMap[order.status].icon className="mr-1 h-3 w-3" />}
                    {orderStatusMap[order.status]?.label || order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {order.customerUid && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Customer UID (short): {order.customerUid.substring(0,8)}...
                    </p>
                )}
              </CardContent>
              <CardFooter>
                <Select
                  value={order.status}
                  onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(orderStatusMap).map((statusKey) => {
                      const statusInfo = orderStatusMap[statusKey as OrderStatus];
                      return (
                        <SelectItem key={statusKey} value={statusKey}>
                          <div className="flex items-center">
                            {statusInfo.icon && <statusInfo.icon className="mr-2 h-4 w-4" />}
                            {statusInfo.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
