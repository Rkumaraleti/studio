
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, UserCircle, DollarSign, ListChecks, Loader2, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, Timestamp, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";

interface DashboardStats {
  todaysOrders: number | null;
  totalMenuItems: number | null;
  averageRating: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { publicMerchantId, isLoadingProfile } = useMerchantProfile();
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: null,
    totalMenuItems: null,
    averageRating: "4.5", // Static for now
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorFetchingStats, setErrorFetchingStats] = useState<string | null>(null);


  useEffect(() => {
    if (!publicMerchantId || authLoading || isLoadingProfile) {
      setIsLoadingStats(true);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      setErrorFetchingStats(null);
      try {
        // Fetch today's orders
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);
        const endOfTodayTimestamp = Timestamp.fromDate(endOfToday);
        
        console.log("[Dashboard] Fetching orders for merchant:", publicMerchantId, "between", startOfToday, "and", endOfToday);

        const ordersQuery = query(
          collection(db, "orders"),
          where("merchantPublicId", "==", publicMerchantId),
          where("createdAt", ">=", startOfTodayTimestamp),
          where("createdAt", "<=", endOfTodayTimestamp),
          orderBy("createdAt", "desc") // Added this to align with existing enabled index
        );
        const ordersSnapshot = await getCountFromServer(ordersQuery);
        const todaysOrdersCount = ordersSnapshot.data().count;
        console.log("[Dashboard] Today's orders count:", todaysOrdersCount);

        // Fetch total menu items
        const menuItemsQuery = query(
          collection(db, "menuItems"),
          where("merchantId", "==", publicMerchantId) // merchantId in menuItems stores publicMerchantId
        );
        const menuItemsSnapshot = await getCountFromServer(menuItemsQuery);
        const totalMenuItemsCount = menuItemsSnapshot.data().count;
        console.log("[Dashboard] Total menu items count:", totalMenuItemsCount);

        setStats(prev => ({
          ...prev,
          todaysOrders: todaysOrdersCount,
          totalMenuItems: totalMenuItemsCount,
        }));

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setErrorFetchingStats(error.message || "Failed to load dashboard statistics.");
        setStats(prev => ({
          ...prev,
          todaysOrders: 0, 
          totalMenuItems: 0, 
        }));
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [publicMerchantId, authLoading, isLoadingProfile]);

  const quickActions = [
    { title: "Manage Menu", description: "Add or update your menu items.", href: "/menu-builder", icon: ClipboardList, color: "text-primary" },
    { title: "View QR Code", description: "Get your scannable menu QR code.", href: "/qr-code", icon: QrCode, color: "text-accent" },
    { title: "Edit Profile", description: "Update your restaurant details.", href: "/profile", icon: UserCircle, color: "text-secondary-foreground" },
  ];

  const displayStats = [
    { title: "Today's Orders", value: stats.todaysOrders, icon: DollarSign, color: "text-primary", note: "Orders received since midnight" },
    { title: "Total Menu Items", value: stats.totalMenuItems, icon: ListChecks, color: "text-blue-500", note: "Current items in your menu"},
    { title: "Average Rating", value: stats.averageRating, icon: Star, color: "text-accent", note: "Feature coming soon" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-br from-card via-card to-secondary/10 border-border">
        <CardHeader className="bg-primary/5 dark:bg-primary/10 rounded-t-lg p-6">
          <CardTitle className="text-3xl text-primary">Welcome Back, Merchant!</CardTitle>
          <CardDescription className="text-muted-foreground">Here's what's happening with your QR Plus menu today.</CardDescription>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-xl transition-shadow duration-300 border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <Button asChild variant="default" className="w-full">
                  <Link href={action.href}>{action.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">At a Glance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayStats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300 border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoadingStats || authLoading || isLoadingProfile || stat.value === null ? (
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-muted-foreground" /> 
                    <span className="text-muted-foreground text-sm">Loading...</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                )}
                {!isLoadingStats && stat.note && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
                )}
                {errorFetchingStats && (stat.title === "Today's Orders" || stat.title === "Total Menu Items") && (
                   <p className="text-xs text-destructive mt-1">Could not load. Firestore index might be building.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

