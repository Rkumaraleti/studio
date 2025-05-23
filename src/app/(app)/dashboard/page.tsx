
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, UserCircle, DollarSign, ListChecks, Loader2, Star, LineChart } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, Timestamp, orderBy, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    if (!publicMerchantId || authLoading || isLoadingProfile) {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      setErrorFetchingStats(null);
      setErrorFetchingChart(null);

      try {
        // Fetch today's orders
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

        // Fetch total menu items
        const menuItemsQuery = query(
          collection(db, "menuItems"),
          where("merchantId", "==", publicMerchantId) 
        );
        const menuItemsSnapshot = await getCountFromServer(menuItemsQuery);
        const totalMenuItemsCount = menuItemsSnapshot.data().count;

        setStats({
          todaysOrders: todaysOrdersCount,
          totalMenuItems: totalMenuItemsCount,
        });

      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        setErrorFetchingStats(error.message || "Failed to load dashboard statistics.");
        setStats({
          todaysOrders: 0, 
          totalMenuItems: 0, 
        });
      } finally {
        setIsLoadingStats(false);
      }

      // Fetch orders for the last 7 days for the chart
      try {
        const sevenDaysAgo = startOfDay(subDays(new Date(), 6)); // Inclusive of today, so 6 days ago
        const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
        const endOfTodayForChart = Timestamp.fromDate(endOfDay(new Date()));


        const last7DaysOrdersQuery = query(
            collection(db, "orders"),
            where("merchantPublicId", "==", publicMerchantId),
            where("createdAt", ">=", sevenDaysAgoTimestamp),
            where("createdAt", "<=", endOfTodayForChart), // Ensure we cap at end of today
            orderBy("createdAt", "asc") // Ascending for easier processing
        );
        const querySnapshot = await getDocs(last7DaysOrdersQuery);
        
        const dailyCounts: { [key: string]: number } = {};
        for (let i = 0; i < 7; i++) {
            const d = subDays(new Date(), i);
            dailyCounts[format(d, 'yyyy-MM-dd')] = 0;
        }

        querySnapshot.forEach(doc => {
            const orderData = doc.data();
            if (orderData.createdAt) {
                const orderDate = format(orderData.createdAt.toDate(), 'yyyy-MM-dd');
                if (dailyCounts[orderDate] !== undefined) {
                    dailyCounts[orderDate]++;
                }
            }
        });
        
        const chartData = Object.keys(dailyCounts)
            .sort((a,b) => new Date(a).getTime() - new Date(b).getTime()) // Sort by date
            .map(dateStr => ({
                date: format(new Date(dateStr), 'EEE'), // Format as 'Mon', 'Tue', etc.
                orders: dailyCounts[dateStr]
            }));
            
        setLast7DaysOrdersData(chartData);

      } catch (error: any) {
        console.error("Error fetching chart data:", error);
        setErrorFetchingChart(error.message || "Failed to load chart data.");
        setLast7DaysOrdersData([]);
      } finally {
        setIsLoadingChart(false);
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
    // "Average Rating" card is replaced by the chart
  ];
  
  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
  };

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
                <LineChart className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent className="h-[200px] pt-4"> {/* Adjusted height and padding */}
                {isLoadingChart || authLoading || isLoadingProfile ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">Loading chart...</span>
                  </div>
                ) : errorFetchingChart ? (
                    <div className="flex items-center justify-center h-full">
                         <p className="text-xs text-destructive mt-1 text-center">Chart error: {errorFetchingChart}. Firestore index might be building.</p>
                    </div>
                ) : !last7DaysOrdersData || last7DaysOrdersData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No order data for the last 7 days.</p>
                    </div>
                ) : (
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last7DaysOrdersData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}> {/* Adjusted margins */}
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
                )}
              </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}

