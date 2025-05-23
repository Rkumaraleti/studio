
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
      <div className="flex justify-center items-center h-64 p-4 md:p-6 lg:p-8"> {/* Added padding here */}
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
      <div className="flex justify-center items-center h-64 p-4 md:p-6 lg:p-8"> {/* Added padding here */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-md">Waiting for merchant profile to initialize...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8"> {/* Added padding here */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders Management
        </h1>
        <p className="text-muted-foreground">
          View and manage incoming orders from your customers.
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
            const statusInfo = orderStatusMap[order.status] || { label: order.status, icon: Info, color: "bg-gray-500" };
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Order #{order.displayOrderId || order.id.substring(0, 8)}</CardTitle>
                    <Badge className={`${statusInfo.color} text-white`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
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
                <CardFooter className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0 border-t pt-4 mt-auto">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" /> Updated {getRelativeTime(order.updatedAt || order.createdAt)}
                  </div>
                   <div className="w-full md:w-auto">
                    <Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} value={order.status}>
                      <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(orderStatusMap).map(statusKey => {
                          const currentStatus = statusKey as OrderStatus;
                          const currentStatusInfo = orderStatusMap[currentStatus];
                          const CurrentStatusIcon = currentStatusInfo.icon;
                          return (
                            <SelectItem key={currentStatus} value={currentStatus} className="text-sm">
                              <div className="flex items-center">
                                <CurrentStatusIcon className={`h-4 w-4 mr-2 ${currentStatusInfo.color.replace('bg-', 'text-')}`} />
                                {currentStatusInfo.label}
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
      )}
    </div>
  );
}
