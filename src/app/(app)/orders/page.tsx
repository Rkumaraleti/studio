
// src/app/(app)/orders/page.tsx
"use client";

// import { useEffect, useState } from "react";
// import type { Order, OrderStatus } from "@/lib/types";
// import { useAuth } from "@/contexts/auth-context";
// import { useMerchantProfile } from "@/hooks/use-merchant-profile";
// import { db } from "@/lib/firebase/config";
// import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
// import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Info, /* RefreshCw, PackageCheck, Utensils, Bike, Ban */ } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { formatDistanceToNow } from 'date-fns';

// Commented out as it's not used in this simplified version
// const orderStatusMap: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
//   pending: { label: "Pending", icon: RefreshCw, color: "bg-yellow-500" },
//   paid: { label: "Paid", icon: PackageCheck, color: "bg-blue-500" },
//   confirmed: { label: "Confirmed", icon: PackageCheck, color: "bg-green-500" },
//   preparing: { label: "Preparing", icon: Utensils, color: "bg-orange-500" },
//   ready: { label: "Ready", icon: Bike, color: "bg-purple-500" },
//   delivered: { label: "Delivered", icon: PackageCheck, color: "bg-gray-700" },
//   cancelled: { label: "Cancelled", icon: Ban, color: "bg-red-500" },
// };

export default function OrdersPage() {
  // const { user, loading: authLoading } = useAuth();
  // const { publicMerchantId, isLoadingProfile } = useMerchantProfile();
  // const [orders, setOrders] = useState<Order[]>([]);
  // const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  // const { toast } = useToast();

  // useEffect(() => {
  //   if (authLoading || isLoadingProfile) {
  //     setIsLoadingOrders(true);
  //     return;
  //   }
  //   if (!user || !publicMerchantId) {
  //     setOrders([]);
  //     setIsLoadingOrders(false);
  //     return;
  //   }

  //   setIsLoadingOrders(true);
  //   const ordersCollectionRef = collection(db, "orders");
  //   const q = query(
  //     ordersCollectionRef,
  //     where("merchantPublicId", "==", publicMerchantId),
  //     orderBy("createdAt", "desc")
  //   );

  //   const unsubscribe = onSnapshot(q, (querySnapshot) => {
  //     const fetchedOrders: Order[] = [];
  //     querySnapshot.forEach((doc) => {
  //       fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
  //     });
  //     setOrders(fetchedOrders);
  //     setIsLoadingOrders(false);
  //   }, (error) => {
  //     console.error("Error fetching orders:", error);
  //     toast({ title: "Error", description: `Could not fetch orders. ${error.message}`, variant: "destructive" });
  //     setIsLoadingOrders(false);
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [user, authLoading, publicMerchantId, isLoadingProfile, toast]);

  // const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
  //   try {
  //     const orderDocRef = doc(db, "orders", orderId);
  //     await updateDoc(orderDocRef, { status: newStatus, updatedAt: new Date() });
  //     toast({ title: "Order Status Updated", description: `Order ${orderId.substring(0,8)}... is now ${newStatus}.` });
  //   } catch (error) {
  //     console.error("Error updating order status:", error);
  //     toast({ title: "Update Error", description: "Could not update order status.", variant: "destructive" });
  //   }
  // };

  // const getRelativeTime = (timestamp: any): string => {
  //   if (!timestamp || !timestamp.toDate) {
  //     return 'just now';
  //   }
  //   try {
  //     return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  //   } catch (error) {
  //     console.warn("Error formatting date:", error, "Timestamp:", timestamp);
  //     return 'a while ago';
  //   }
  // }; // Explicit semicolon

  // Simplified early returns for debugging
  // if (authLoading || isLoadingProfile || (isLoadingOrders && user && publicMerchantId)) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-4 text-lg">Loading orders...</p>
  //     </div>
  //   );
  // }

  // if (!user && !authLoading) {
  //    return null; // AuthProvider handles redirect
  // }

  // if (user && !publicMerchantId && !isLoadingProfile) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //       <p className="ml-3 text-md">Waiting for merchant profile to initialize...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders Management (Simplified)
        </h1>
        <p className="text-muted-foreground">
          This is a simplified version for debugging the JSX parsing error.
        </p>
      </div>
      {/* {isLoadingOrders ? (
         <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-md">Fetching your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Orders Yet</AlertTitle>
          <AlertDescription>
            When customers place orders, they will appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Order ID: {order.displayOrderId}</span>
                  <Badge
                    className={`${orderStatusMap[order.status]?.color || 'bg-gray-400'} text-white text-xs`}
                  >
                    {orderStatusMap[order.status]?.label || order.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Placed: {getRelativeTime(order.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Items:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {order.items.map(item => (
                      <li key={item.id}>{item.name} (x{item.quantity}) - ${item.price.toFixed(2)} each</li>
                    ))}
                  </ul>
                </div>
                <p className="font-semibold text-lg">Total: ${order.totalAmount.toFixed(2)}</p>
                 <p className="text-xs text-muted-foreground">Customer UID: {order.customerUid.substring(0,10)}...</p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 border-t pt-4">
                 <Select
                    value={order.status}
                    onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(orderStatusMap).map((statusKey) => (
                        <SelectItem key={statusKey} value={statusKey}>
                          <div className="flex items-center">
                            {React.createElement(orderStatusMap[statusKey as OrderStatus].icon, {className: "mr-2 h-4 w-4"})}
                            {orderStatusMap[statusKey as OrderStatus].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </CardFooter>
            </Card>
          ))}
        </div>
      )} */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Debugging Mode</AlertTitle>
        <AlertDescription>
          If you see this, the basic JSX structure is working. The error might be in the commented-out logic.
        </AlertDescription>
      </Alert>
    </div>
  );
}
