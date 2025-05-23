
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
import { /* Alert, AlertDescription, AlertTitle */ } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';

// Map order statuses to labels, icons, and colors
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
      await updateDoc(orderDocRef, { status: newStatus, updatedAt: new Date() });
      toast({ title: "Order Status Updated", description: `Order ${orderId.substring(0,8)}... is now ${newStatus}.` });
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
     return null; // AuthProvider handles redirect
  }

  if (user && !publicMerchantId && !isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-md">Waiting for merchant profile to initialize...</p>
      </div>
    );
  }

  if (orders.length === 0 && !isLoadingOrders) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8" /> Orders
          </h1>
          <p className="text-muted-foreground">
            View and manage incoming orders.
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <Info className="h-8 w-8 text-muted-foreground mr-3" />
          <p className="text-lg text-muted-foreground">No orders found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders
        </h1>
        <p className="text-muted-foreground">
          View and manage incoming orders.
        </p>
      </div>
      {/* Display Orders */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {orders.map(order => {
          const statusInfo = orderStatusMap[order.status] || { label: order.status, icon: Info, color: "bg-gray-500" };
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={order.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Order #{order.id.substring(0, 8)}</CardTitle>
                  <Badge className={`${statusInfo.color} text-white`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <CardDescription>
                  Placed {getRelativeTime(order.createdAt)} by {order.customerName || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-grow">
                <div className="flex items-center space-x-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">Items</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">Total Amount</p>
                    <p className="text-sm text-muted-foreground">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                {order.notes && (
                   <div className="flex items-center space-x-4">
                     <div className="grid gap-1">
                       <p className="text-sm font-medium leading-none">Notes</p>
                       <p className="text-sm text-muted-foreground">
                         {order.notes}
                       </p>
                     </div>
                   </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mr-1" /> Updated {getRelativeTime(order.updatedAt || order.createdAt)}
                </div>
                 <div className="w-full md:w-auto">
                  <Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} value={order.status}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(orderStatusMap).map(statusKey => {
                        const status = statusKey as OrderStatus;
                        const statusInfo = orderStatusMap[status];
                        const StatusIcon = statusInfo.icon;
                        return (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center">
                              <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.color.replace('bg-', 'text-')}`} />
                              {statusInfo.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
