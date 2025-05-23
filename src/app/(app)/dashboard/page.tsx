
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, UserCircle, DollarSign, BarChart3, Star, ListChecks, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

interface DashboardStats {
  todaysOrders: number | null;
  totalMenuItems: number | null;
  averageRating: string; // Keeping static for now
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

  useEffect(() => {
    if (!publicMerchantId || authLoading || isLoadingProfile) {
      setIsLoadingStats(true);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      try {
        // Fetch today's orders
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const ordersQuery = query(
          collection(db, "orders"),
          where("merchantPublicId", "==", publicMerchantId),
          where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
          where("createdAt", "<=", Timestamp.fromDate(endOfToday))
        );
        const ordersSnapshot = await getCountFromServer(ordersQuery);
        const todaysOrdersCount = ordersSnapshot.data().count;

        // Fetch total menu items
        const menuItemsQuery = query(
          collection(db, "menuItems"),
          where("merchantId", "==", publicMerchantId) // merchantId in menuItems stores publicMerchantId
        );
        const menuItemsSnapshot = await getCountFromServer(menuItemsQuery);
        const totalMenuItemsCount = menuItemsSnapshot.data().count;

        setStats(prev => ({
          ...prev,
          todaysOrders: todaysOrdersCount,
          totalMenuItems: totalMenuItemsCount,
        }));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats(prev => ({
          ...prev,
          todaysOrders: 0, // Default to 0 on error
          totalMenuItems: 0, // Default to 0 on error
        }));
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [publicMerchantId, authLoading, isLoadingProfile]);

  const quickActions = [
    { title: "Manage Menu", description: "Add or update your menu items.", href: "/menu-builder", icon: ClipboardList, color: "text-primary" },
    { title: "View QR Code", description: "Get your scannable menu QR code.", href: "/qr-code", icon: QrCode, color: "text-green-500" }, // Kept green for QR
    { title: "Edit Profile", description: "Update your restaurant details.", href: "/profile", icon: UserCircle, color: "text-accent" },
  ];

  const displayStats = [
    { title: "Today's Orders", value: stats.todaysOrders, icon: DollarSign, color: "text-primary" },
    { title: "Total Menu Items", value: stats.totalMenuItems, icon: ListChecks, color: "text-blue-500" }, // Changed icon & color
    { title: "Average Rating", value: stats.averageRating, icon: Star, color: "text-accent" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-br from-card via-card to-secondary/10">
        <CardHeader className="bg-primary/5 dark:bg-primary/10 rounded-t-lg">
          <CardTitle className="text-3xl text-primary">Welcome Back, Merchant!</CardTitle>
          <CardDescription className="text-muted-foreground">Here's what's happening with your QR Plus menu today.</CardDescription>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{action.title}</CardTitle>
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
        <h2 className="text-2xl font-semibold mb-4 text-primary">At a Glance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayStats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
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
                {stat.title === "Total Menu Items" && !isLoadingStats && (
                  <p className="text-xs text-muted-foreground mt-1">Represents current item count</p>
                )}
                 {stat.title === "Average Rating" && !isLoadingStats && (
                  <p className="text-xs text-muted-foreground mt-1">Static display for now</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
