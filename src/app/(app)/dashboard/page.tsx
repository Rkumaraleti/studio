
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, UserCircle, DollarSign, ListChecks, Loader2, LineChart as LineChartIcon } from "lucide-react"; // Renamed LineChart to LineChartIcon
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, Timestamp, orderBy, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  todaysOrders: number | null;
  totalMenuItems: number | null;
}

interface DailyOrderData {
  date: string; // e.g., 'Mon', 'Tue' or 'MM/DD'
  orders: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { publicMerchantId, isLoadingProfile } = useMerchantProfile();
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: null,
    totalMenuItems: null,
  });
  const [last7DaysOrdersData, setLast7DaysOrdersData] = useState<DailyOrderData[] | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [errorFetchingStats, setErrorFetchingStats] = useState<string | null>(null);
  const [errorFetchingChart, setErrorFetchingChart] = useState<string | null>(null);


  useEffect(() => {
    console.log("[Dashboard] useEffect triggered. publicMerchantId:", publicMerchantId, "authLoading:", authLoading, "isLoadingProfile:", isLoadingProfile);
    if (!publicMerchantId || authLoading || isLoadingProfile) {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      console.log("[Dashboard] useEffect dependencies not ready, returning early.");
      return;
    }

    const fetchDashboardData = async () => {
      console.log("[Dashboard] fetchDashboardData called for merchant:", publicMerchantId);
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      setErrorFetchingStats(null);
      setErrorFetchingChart(null);

      // Fetch stats
      try {
        console.log("[Dashboard] Fetching stats...");
        const today = new Date();
        const startOfTodayTimestamp = Timestamp.fromDate(startOfDay(today));
        const endOfTodayTimestamp = Timestamp.fromDate(endOfDay(today));
        
        const ordersQuery = query(
          collection(db, "orders"),
          where("merchantPublicId", "==", publicMerchantId),
          where("createdAt", ">=", startOfTodayTimestamp),
          where("createdAt", "<=", endOfTodayTimestamp),
          orderBy("createdAt", "desc") 
        );
        const ordersSnapshot = await getCountFromServer(ordersQuery);
        const todaysOrdersCount = ordersSnapshot.data().count;
        console.log("[Dashboard] Today's orders count:", todaysOrdersCount);

        const menuItemsQuery = query(
          collection(db, "menuItems"),
          where("merchantId", "==", publicMerchantId) 
        );
        const menuItemsSnapshot = await getCountFromServer(menuItemsQuery);
        const totalMenuItemsCount = menuItemsSnapshot.data().count;
        console.log("[Dashboard] Total menu items count:", totalMenuItemsCount);

        setStats({
          todaysOrders: todaysOrdersCount,
          totalMenuItems: totalMenuItemsCount,
        });

      } catch (error: any) {
        console.error("[Dashboard] Error fetching dashboard stats:", error);
        setErrorFetchingStats(error.message || "Failed to load dashboard statistics.");
        setStats({ todaysOrders: 0, totalMenuItems: 0 });
      } finally {
        setIsLoadingStats(false);
        console.log("[Dashboard] Finished fetching stats.");
      }

      // Fetch orders for the last 7 days for the chart
      try {
        console.log("[Dashboard] Fetching chart data for publicMerchantId:", publicMerchantId);
        const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
        const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
        const endOfTodayForChart = Timestamp.fromDate(endOfDay(new Date()));

        console.log("[Dashboard] Chart date range: from", sevenDaysAgo.toISOString(), "to", new Date().toISOString());
        console.log("[Dashboard] Chart Firestore Timestamps: from", sevenDaysAgoTimestamp.toDate(), "to", endOfTodayForChart.toDate());

        const last7DaysOrdersQuery = query(
            collection(db, "orders"),
            where("merchantPublicId", "==", publicMerchantId),
            where("createdAt", ">=", sevenDaysAgoTimestamp),
            where("createdAt", "<=", endOfTodayForChart),
            orderBy("createdAt", "desc") // Changed to "desc" to match existing index
        );
        const querySnapshot = await getDocs(last7DaysOrdersQuery);
        console.log("[Dashboard] Chart querySnapshot size:", querySnapshot.size);
        if (querySnapshot.size > 0) {
            console.log("[Dashboard] First order data for chart:", querySnapshot.docs[0].id, querySnapshot.docs[0].data());
            if(querySnapshot.docs[0].data().createdAt){
                 console.log("[Dashboard] First order createdAt (JS Date):", querySnapshot.docs[0].data().createdAt.toDate());
            }
        }
        
        const dailyCounts: { [key: string]: number } = {};
        for (let i = 0; i < 7; i++) {
            const d = subDays(new Date(), i);
            dailyCounts[format(d, 'yyyy-MM-dd')] = 0;
        }
        console.log("[Dashboard] Initialized dailyCounts:", JSON.stringify(dailyCounts));


        querySnapshot.forEach(doc => {
            const orderData = doc.data();
            if (orderData.createdAt && typeof orderData.createdAt.toDate === 'function') {
                const orderDate = format(orderData.createdAt.toDate(), 'yyyy-MM-dd');
                if (dailyCounts[orderDate] !== undefined) {
                    dailyCounts[orderDate]++;
                } else {
                    console.warn("[Dashboard] Order date", orderDate, "not found in pre-initialized dailyCounts. Order ID:", doc.id);
                }
            } else {
                 console.warn("[Dashboard] Order missing createdAt or not a Timestamp. Order ID:", doc.id, "Data:", orderData);
            }
        });
        console.log("[Dashboard] Populated dailyCounts:", JSON.stringify(dailyCounts));
        
        const chartData = Object.keys(dailyCounts)
            .sort((a,b) => new Date(a).getTime() - new Date(b).getTime()) // Sort by date string asc for chart
            .map(dateStr => ({
                date: format(new Date(dateStr), 'EEE'), // Format date for X-axis display (e.g., 'Mon')
                orders: dailyCounts[dateStr]
            }));
            
        console.log("[Dashboard] Final chartData for Recharts:", JSON.stringify(chartData));
        setLast7DaysOrdersData(chartData);

      } catch (error: any) {
        console.error("[Dashboard] Error fetching chart data:", error);
        setErrorFetchingChart(error.message || "Failed to load chart data.");
        setLast7DaysOrdersData([]);
      } finally {
        setIsLoadingChart(false);
        console.log("[Dashboard] Finished fetching chart data.");
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
  ];
  
  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
  };

  // Log state before rendering chart
  console.log("[Dashboard UI Render] Chart state:", {
    isLoadingChart, authLoading, isLoadingProfile, errorFetchingChart,
    last7DaysOrdersData: last7DaysOrdersData ? JSON.parse(JSON.stringify(last7DaysOrdersData)) : null
  });

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <Card className="shadow-lg bg-card border-border">
        <CardHeader className="bg-gradient-to-r from-primary to-[hsl(var(--primary-hsl),0.8)] text-primary-foreground rounded-t-lg p-6">
          <CardTitle className="text-3xl">Welcome Back, Merchant!</CardTitle>
          <CardDescription className="text-primary-foreground/80">Here's what's happening with your QR Plus menu today.</CardDescription>
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
          {/* Chart Card */}
           <Card className="hover:shadow-lg transition-shadow duration-300 border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Orders Last 7 Days</CardTitle>
                <LineChartIcon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent className="h-[200px] pt-4">
                {(() => {
                    if (isLoadingChart || authLoading || isLoadingProfile) {
                        return (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin mr-2 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm">Loading chart...</span>
                            </div>
                        );
                    }
                    if (errorFetchingChart) {
                        return (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-xs text-destructive mt-1 text-center">
                                    Failed to load chart. Error: {errorFetchingChart}. 
                                    <br />
                                    Ensure Firestore index is built. Check console for details.
                                </p>
                            </div>
                        );
                    }
                    if (!last7DaysOrdersData || last7DaysOrdersData.length === 0) {
                        return (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground">No order data for the last 7 days.</p>
                            </div>
                        );
                    }
                    return (
                        <ChartContainer config={chartConfig} className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={last7DaysOrdersData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickMargin={8}
                                        fontSize={12} 
                                    />
                                    <YAxis 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickMargin={8} 
                                        fontSize={12}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    );
                })()}
              </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
