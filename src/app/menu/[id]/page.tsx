// src/app/menu/[id]/page.tsx
"use client";

import { use } from "react";
import { supabase } from "@/lib/supabase/config";
import { MenuDisplay } from "./components/menu-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { usePublicMenu } from "@/hooks/use-public-menu";
import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, X, Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDisplayOrderId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSupabaseAnonymousAuth } from "@/hooks/use-supabase-anonymous-auth";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicMenuPage({ params }: PageProps) {
  const { id } = use(params);
  const { menuItems, loading, error } = usePublicMenu(id);
  const [restaurant, setRestaurant] = useState<{
    name: string;
    description?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [debugError, setDebugError] = useState<any>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(() => {
    // Check session storage on initial load
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`menu_${id}_closed`);
      return stored !== "true";
    }
    return true;
  });
  const {
    items: cartItems,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{
    id: string;
    status: "pending" | "confirmed" | "cancelled";
    display_order_id?: string;
  } | null>(null);
  const { toast } = useToast();
  const { createOrder } = usePublicMenu(id);
  const { user, loading: authLoading } = useSupabaseAnonymousAuth();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      setProfileLoading(true);
      // Fetch the merchant profile using the public_merchant_id
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("id, restaurant_name, description")
        .eq("public_merchant_id", id)
        .maybeSingle();
      setDebugError(error);
      setDebugData(data);
      console.log("[DEBUG] merchant_profiles query result:", { data, error });
      if (data) {
        setRestaurant({
          name: data.restaurant_name,
          description: data.description,
        });
      } else {
        // Profile not found for this public ID
        setRestaurant(null);
        // Do NOT attempt to create a profile here for anonymous users
      }
      setProfileLoading(false);
    }
    if (id) fetchProfile();
  }, [id]);

  // Effect to automatically close dialog on confirmed/cancelled status
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      orderStatus &&
      (orderStatus.status === "confirmed" || orderStatus.status === "cancelled")
    ) {
      timer = setTimeout(() => {
        setOrderStatus(null);
      }, 5000); // Close after 5 seconds
    }
    return () => clearTimeout(timer);
  }, [orderStatus?.status]);

  // Effect to subscribe to real-time order updates
  useEffect(() => {
    if (!orderStatus?.id) return;

    const channel = supabase.channel(`order_${orderStatus.id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          filter: `id=eq.${orderStatus.id}`,
        },
        (payload) => {
          console.log("[Realtime] Order update received:", payload);
          const newStatus = payload.new as typeof orderStatus;
          console.log("[Realtime] New status from payload:", newStatus);
          console.log(
            "[Realtime] Current orderStatus state before update:",
            orderStatus
          );

          // Ensure the payload contains the expected status before updating
          if (
            newStatus &&
            (newStatus.status === "confirmed" ||
              newStatus.status === "cancelled")
          ) {
            console.log("[Realtime] Processing confirmed or cancelled status.");
            console.log(
              "[Realtime] Updating orderStatus state with:",
              newStatus
            );
            setOrderStatus(newStatus);

            // Show appropriate toast message
            toast({
              title:
                newStatus.status === "confirmed"
                  ? "Order Confirmed!"
                  : "Order Cancelled",
              description:
                newStatus.status === "confirmed"
                  ? "Your order has been confirmed. Redirecting to order history..."
                  : "Your order has been cancelled. Redirecting to order history...",
            });

            // Redirect to order history after a short delay
            setTimeout(() => {
              router.push(`/menu/${id}/order-history`);
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderStatus?.id, toast, router, id]);

  // Fetch order history for this user and merchant
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
  }, [user?.id, id, orderStatus]); // refetch on new order

  const handlePayment = async () => {
    if (cartItems.length === 0) return;
    if (authLoading || !user) {
      toast({
        title: "Error",
        description: "User session not ready. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        public_merchant_id: id,
        customer_uid: user.id, // anonymous or authenticated user id
        items: cartItems,
        total: getTotalPrice(),
        status: "pending" as const,
      };
      console.log("[handlePayment] Creating order with payload:", payload);
      const order = await createOrder(payload);
      setOrderStatus({
        id: order.id,
        status: "pending",
        display_order_id: order.display_order_id,
      });
      clearCart();
      toast({
        title: "Order Placed Successfully",
        description: `Your order has been sent to the merchant.`,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading menu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error || !restaurant) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error Loading Menu</AlertTitle>
          <AlertDescription>
            {error === "Merchant not found" || !restaurant
              ? "The merchant you're looking for doesn't exist or has been removed."
              : "There was an error loading the merchant's menu. Please try again later."}
            <pre className="mt-4 text-xs text-muted-foreground overflow-x-auto">
              {debugError ? JSON.stringify(debugError, null, 2) : null}
            </pre>
            <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
              {debugData ? JSON.stringify(debugData, null, 2) : null}
            </pre>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!showMenu) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground text-center">
              Thank you for your order. The menu is now closed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuUrl = `${window.location.origin}/menu/${restaurant.name}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="text-muted-foreground">{restaurant.description}</p>
            )}
          </div>
          {/* Order History Icon */}
          <Link
            href={`/menu/${id}/order-history`}
            className="ml-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="View your order history"
          >
            <Clock className="h-7 w-7 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl px-4 py-8 pb-32">
        <MenuDisplay
          public_merchant_id={id}
          currencyCode="INR"
          menuItems={menuItems}
          restaurantName={restaurant.name}
          restaurantDescription={restaurant.description}
        />
      </div>

      {/* Order Status Dialog */}
      <Dialog
        open={!!orderStatus}
        onOpenChange={(open) => {
          if (!open && orderStatus?.status === "pending") {
            // Prevent closing if status is pending
            return;
          }
          // Allow closing if status is confirmed or cancelled - now handled by the timeout in the effect
          if (
            !open &&
            (orderStatus?.status === "confirmed" ||
              orderStatus?.status === "cancelled")
          ) {
            setOrderStatus(null); // Still allow manual closing of the dialog
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {orderStatus?.display_order_id
                ? `Order #${orderStatus.display_order_id}`
                : orderStatus?.id
                ? `Order #${orderStatus.id.substring(0, 8)}`
                : "Order Status"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {orderStatus?.status === "pending" && (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <p className="text-lg font-medium">
                  Waiting for merchant confirmation
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Your order has been sent to the merchant. They will confirm or
                  cancel your order shortly.
                </p>
              </>
            )}
            {orderStatus?.status === "confirmed" && (
              <>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-lg font-medium">Order Confirmed!</p>
                <p className="text-sm text-muted-foreground text-center">
                  The merchant has confirmed your order. The menu will close
                  shortly.
                </p>
              </>
            )}
            {orderStatus?.status === "cancelled" && (
              <>
                <div className="rounded-full bg-red-100 p-3">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <p className="text-lg font-medium">Order Cancelled</p>
                <p className="text-sm text-muted-foreground text-center">
                  The merchant has cancelled your order. Please contact them for
                  more information.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh]">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 py-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Add some items to your cart to place an order
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  disabled={cartItems.length === 0}
                >
                  Clear Cart
                </Button>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{getTotalPrice().toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={cartItems.length === 0 || isSubmitting}
                onClick={handlePayment}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cart Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-background border-t z-50">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
              disabled={getTotalItems() === 0}
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {getTotalItems() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">
                  ₹{getTotalPrice().toFixed(2)}
                </p>
              </div>
              <Button
                size="lg"
                disabled={getTotalItems() === 0 || isSubmitting}
                onClick={handlePayment}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
