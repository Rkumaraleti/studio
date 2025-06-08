// src/app/(app)/orders/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/use-orders";
import {
  Loader2,
  ShoppingBag,
  Info,
  Hourglass,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ThumbsUp,
  Ban,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  motion,
  PanInfo,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";

const orderStatusMap: Record<
  OrderStatus | "paid",
  { label: string; icon: React.ElementType; color: string; textColor?: string }
> = {
  pending: {
    label: "Pending",
    icon: Hourglass,
    color: "bg-yellow-500",
    textColor: "text-yellow-50",
  },
  paid: {
    label: "Paid (Needs Action)",
    icon: Hourglass,
    color: "bg-yellow-500",
    textColor: "text-yellow-50",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-green-600",
    textColor: "text-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-600",
    textColor: "text-red-50",
  },
};

const formatPrice = (price: number, currencyCode: string = "INR") => {
  const symbol = currencyCode === "INR" ? "₹" : "$";
  return `${symbol}${price.toFixed(2)}`;
};

interface OrderCardProps {
  order: Order;
  statusInfo: {
    label: string;
    icon: React.ElementType;
    color: string;
    textColor?: string;
  };
  currentCurrencyCode: string;
  getRelativeTime: (timestamp: string) => string;
  handleStatusChange: (
    orderId: string,
    newStatus: OrderStatus
  ) => Promise<void>;
  draggedOrderId: string | null;
  setDraggedOrderId: Dispatch<SetStateAction<string | null>>;
  handleDrag: (orderId: string, info: PanInfo) => Promise<void>;
  isMobile: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const FIVE_SECONDS = 5000;

function OrderCard({
  order,
  statusInfo,
  currentCurrencyCode,
  getRelativeTime,
  handleStatusChange,
  draggedOrderId,
  setDraggedOrderId,
  handleDrag,
  isMobile,
  onDragStart,
  onDragEnd,
}: OrderCardProps) {
  const isDragging = draggedOrderId === order.id;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const confirmOpacity = useTransform(x, [0, 100], [0, 1]);
  const cancelOpacity = useTransform(x, [-100, 0], [1, 0]);
  const StatusIcon = statusInfo.icon;
  const totalAmount = order.items.reduce(
    (sum: number, item: { price: number; quantity?: number }) =>
      sum + item.price * (item.quantity || 1),
    0
  );

  const isPending = order.status === "pending";

  const [showRestore, setShowRestore] = useState(false);
  const restoreTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (order.status === "cancelled") {
      setShowRestore(true);
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
      restoreTimer.current = setTimeout(() => {
        setShowRestore(false);
      }, 5000);
    } else {
      setShowRestore(false);
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    }
    // Clean up timer on unmount
    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [order.status]);

  // Only show restore if cancelled_at is within 5 seconds
  const canRestore =
    order.status === "cancelled" &&
    order.cancelled_at &&
    Date.now() - new Date(order.cancelled_at).getTime() < 5000;

  return (
    <div className="relative">
      <motion.div
        {...(isPending
          ? {
              drag: "x",
              dragConstraints: { left: 0, right: 0 },
              onDragStart: () => {
                setDraggedOrderId(order.id);
                if (onDragStart) onDragStart();
              },
              onDragEnd: (_event: any, info: PanInfo) => {
                handleDrag(order.id, info);
                setDraggedOrderId(null);
                if (onDragEnd) onDragEnd();
              },
              style: { x, rotate },
              whileDrag: { cursor: "grabbing" },
            }
          : {
              style: {},
            })}
        className={`relative touch-manipulation ${
          isPending ? "" : "cursor-default"
        }`}
      >
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
            <motion.div
              style={{ opacity: cancelOpacity }}
              className="bg-red-500/10 text-red-500 rounded-lg p-4 transform -rotate-12"
            >
              <XCircle className="h-8 w-8" />
              <span className="text-sm font-medium">Cancel</span>
            </motion.div>
            <motion.div
              style={{ opacity: confirmOpacity }}
              className="bg-green-500/10 text-green-500 rounded-lg p-4 transform rotate-12"
            >
              <CheckCircle2 className="h-8 w-8" />
              <span className="text-sm font-medium">Confirm</span>
            </motion.div>
          </div>
        )}
        <Card
          className={`flex flex-col shadow-md hover:shadow-lg transition-all duration-200 relative bg-background ${
            isDragging
              ? "cursor-grabbing"
              : isPending
              ? "cursor-grab"
              : "cursor-default"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Order Info Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${statusInfo.color} ${
                      statusInfo.textColor || "text-white"
                    } font-medium`}
                  >
                    <StatusIcon className="mr-1 h-4 w-4" />
                    {statusInfo.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getRelativeTime(order.created_at)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Order #{order.display_order_id || order.id.substring(0, 8)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Order Items
              </h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium">
                      {item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {formatPrice(
                        item.price * (item.quantity || 1),
                        currentCurrencyCode
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Actions Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-semibold text-primary">
                  {formatPrice(totalAmount, currentCurrencyCode)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "confirmed")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Order
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(order.id, "cancelled")}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
                {canRestore && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(order.id, "pending")}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Restore Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    publicMerchantId,
  } = useMerchantProfile();
  const {
    orders,
    loading: isLoadingOrders,
    error: ordersError,
    updateOrder,
  } = useOrders();
  const { toast } = useToast();
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [draggedOrderStatus, setDraggedOrderStatus] =
    useState<OrderStatus | null>(null);
  const router = useRouter();
  const [isMobileStack, setIsMobileStack] = useState(false);

  // Deck view toggles
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllNonPending, setShowAllNonPending] = useState(false);
  const DECK_VISIBLE = 3; // Number of cards visible in deck mode

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsMobileStack(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      let updateData: any = { status: newStatus };
      if (newStatus === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        await updateOrder(orderId, updateData);
        toast({
          title: "Order Cancelled",
          description: "You can restore this order within 5 seconds.",
          duration: 5000,
        });
      } else if (newStatus === "pending") {
        updateData.cancelled_at = null;
        await updateOrder(orderId, updateData);
        toast({
          title: "Order Restored",
          description: "The order has been restored to pending status.",
        });
      } else {
        await updateOrder(orderId, updateData);
        toast({
          title: "Order Status Updated",
          description: `Order #${orderId.substring(
            0,
            8
          )}... is now ${newStatus}.`,
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRelativeTime = (timestamp: string): string => {
    if (!timestamp) {
      return "just now";
    }
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.warn("Error formatting date:", error, "Timestamp:", timestamp);
      return "a while ago";
    }
  };

  const currentCurrencyCode = profile?.currency || "INR";

  const handleDrag = useCallback(
    async (orderId: string, info: PanInfo) => {
      const threshold = isMobile ? 100 : 160; // More intentional drag required
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      // Trigger on either distance or velocity
      if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
        if (offset > 0 || velocity > 500) {
          // Drag right - Confirm
          await handleStatusChange(orderId, "confirmed");
        } else if (offset < 0 || velocity < -500) {
          // Drag left - Cancel
          await handleStatusChange(orderId, "cancelled");
        }
      }
    },
    [handleStatusChange, isMobile]
  );

  // Update draggedOrderStatus when dragging starts
  const handleDragStart = (order: Order) => {
    setDraggedOrderId(order.id);
    setDraggedOrderStatus(order.status);
  };
  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDraggedOrderStatus(null);
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await handleStatusChange(orderId, "confirmed");
      toast({
        title: "Order Confirmed",
        description: "The order has been confirmed successfully.",
      });
      // Redirect to order history page instead of closing
      router.push(`/menu/${profile?.public_merchant_id}/order-history`);
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Error",
        description: "Failed to confirm the order. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Split orders into pending and non-pending
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const nonPendingOrders = orders.filter((o) => o.status !== "pending");

  if (authLoading || profileLoading || isLoadingOrders) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return null;
  }

  if (user && !publicMerchantId && !profileLoading) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Waiting for merchant profile to initialize...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative responsive-container py-8">
      {/* Edge rim glow overlays when dragging a pending order */}
      {draggedOrderId && draggedOrderStatus === "pending" && (
        <>
          <div
            className="pointer-events-none fixed left-0 top-0 h-screen w-10 z-40 transition-opacity duration-200"
            style={{
              opacity: 0.45,
              background:
                "linear-gradient(90deg, #ef4444 60%, transparent 100%)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="pointer-events-none fixed right-0 top-0 h-screen w-10 z-40 transition-opacity duration-200"
            style={{
              opacity: 0.45,
              background:
                "linear-gradient(270deg, #22c55e 60%, transparent 100%)",
              filter: "blur(8px)",
            }}
          />
        </>
      )}
      <div className="mb-8">
        <h1 className="responsive-heading text-primary mb-2 flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8" /> Orders Management
        </h1>
        <p className="responsive-text text-muted-foreground">
          View and manage incoming orders from your customers. New orders appear
          in real-time.
        </p>
      </div>
      {isLoadingOrders ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 responsive-text">Fetching latest orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card p-8 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            No Orders Yet
          </h2>
          <p className="text-muted-foreground mt-1">
            When customers place orders through your QR menu, they will appear
            here.
          </p>
        </div>
      ) : isMobileStack ? (
        <div className="relative w-full max-w-[420px] mx-auto">
          {/* Pending Orders Stack */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Pending Orders</h2>
            <div className="relative min-h-[180px]">
              {(showAllPending
                ? pendingOrders
                : pendingOrders.slice(0, DECK_VISIBLE)
              ).map((order, idx) => {
                const isTop = idx === 0;
                const offset = idx * 12;
                const scale = 1 - idx * 0.04;
                const z = pendingOrders.length - idx;
                const statusInfo = orderStatusMap[
                  order.status as OrderStatus | "paid"
                ] || {
                  label: order.status,
                  icon: Info,
                  color: "bg-gray-500",
                  textColor: "text-gray-50",
                };
                return (
                  <div
                    key={order.id}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${offset}px`,
                      zIndex: z,
                      pointerEvents: isTop ? "auto" : "none",
                      opacity: isTop ? 1 : 0.85,
                      transform: `scale(${scale})`,
                      transition: "top 0.3s, transform 0.3s, opacity 0.3s",
                    }}
                  >
                    <OrderCard
                      order={order}
                      statusInfo={statusInfo}
                      currentCurrencyCode={currentCurrencyCode}
                      getRelativeTime={getRelativeTime}
                      handleStatusChange={handleStatusChange}
                      draggedOrderId={draggedOrderId}
                      setDraggedOrderId={setDraggedOrderId}
                      handleDrag={handleDrag}
                      isMobile={isMobile}
                      onDragStart={() => handleDragStart(order)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                );
              })}
              {pendingOrders.length > DECK_VISIBLE && !showAllPending && (
                <button
                  className="block mx-auto mt-[48px] text-primary underline text-sm"
                  onClick={() => setShowAllPending(true)}
                >
                  View More
                </button>
              )}
              {showAllPending && pendingOrders.length > DECK_VISIBLE && (
                <button
                  className="block mx-auto mt-2 text-primary underline text-sm"
                  onClick={() => setShowAllPending(false)}
                >
                  View Less
                </button>
              )}
            </div>
          </div>
          {/* Orders (non-pending) Stack */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Orders</h2>
            {showAllNonPending ? (
              <div className="flex flex-col gap-4">
                {nonPendingOrders.map((order) => {
                  const statusInfo = orderStatusMap[
                    order.status as OrderStatus | "paid"
                  ] || {
                    label: order.status,
                    icon: Info,
                    color: "bg-gray-500",
                    textColor: "text-gray-50",
                  };
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      statusInfo={statusInfo}
                      currentCurrencyCode={currentCurrencyCode}
                      getRelativeTime={getRelativeTime}
                      handleStatusChange={handleStatusChange}
                      draggedOrderId={draggedOrderId}
                      setDraggedOrderId={setDraggedOrderId}
                      handleDrag={handleDrag}
                      isMobile={isMobile}
                      onDragStart={() => handleDragStart(order)}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })}
                <button
                  className="block mx-auto mt-2 text-primary underline text-sm"
                  onClick={() => setShowAllNonPending(false)}
                >
                  View Less
                </button>
              </div>
            ) : (
              <div className="relative min-h-[180px]">
                {nonPendingOrders.slice(0, DECK_VISIBLE).map((order, idx) => {
                  const isTop = idx === 0;
                  const offset = idx * 12;
                  const scale = 1 - idx * 0.04;
                  const z = nonPendingOrders.length - idx;
                  const statusInfo = orderStatusMap[
                    order.status as OrderStatus | "paid"
                  ] || {
                    label: order.status,
                    icon: Info,
                    color: "bg-gray-500",
                    textColor: "text-gray-50",
                  };
                  return (
                    <div
                      key={order.id}
                      className="absolute left-0 right-0"
                      style={{
                        top: `${offset}px`,
                        zIndex: z,
                        pointerEvents: isTop ? "auto" : "none",
                        opacity: isTop ? 1 : 0.85,
                        transform: `scale(${scale})`,
                        transition: "top 0.3s, transform 0.3s, opacity 0.3s",
                      }}
                    >
                      <OrderCard
                        order={order}
                        statusInfo={statusInfo}
                        currentCurrencyCode={currentCurrencyCode}
                        getRelativeTime={getRelativeTime}
                        handleStatusChange={handleStatusChange}
                        draggedOrderId={draggedOrderId}
                        setDraggedOrderId={setDraggedOrderId}
                        handleDrag={handleDrag}
                        isMobile={isMobile}
                        onDragStart={() => handleDragStart(order)}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  );
                })}
                {nonPendingOrders.length > DECK_VISIBLE &&
                  !showAllNonPending && (
                    <button
                      className="block mx-auto mt-[48px] text-primary underline text-sm"
                      onClick={() => setShowAllNonPending(true)}
                    >
                      View More
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          {orders.map((order) => {
            const statusInfo = orderStatusMap[
              order.status as OrderStatus | "paid"
            ] || {
              label: order.status,
              icon: Info,
              color: "bg-gray-500",
              textColor: "text-gray-50",
            };
            return (
              <OrderCard
                key={order.id}
                order={order}
                statusInfo={statusInfo}
                currentCurrencyCode={currentCurrencyCode}
                getRelativeTime={getRelativeTime}
                handleStatusChange={handleStatusChange}
                draggedOrderId={draggedOrderId}
                setDraggedOrderId={setDraggedOrderId}
                handleDrag={handleDrag}
                isMobile={isMobile}
                onDragStart={() => handleDragStart(order)}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
