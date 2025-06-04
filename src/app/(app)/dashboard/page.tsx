"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  QrCode,
  UserCircle,
  DollarSign,
  ListChecks,
  Loader2,
  LineChart as LineChartIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/lib/supabase/config";

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
  const { profile, loading } = useMerchantProfile();
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: null,
    totalMenuItems: null,
  });
  const [last7DaysOrdersData, setLast7DaysOrdersData] = useState<
    DailyOrderData[] | null
  >(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [errorFetchingStats, setErrorFetchingStats] = useState<string | null>(
    null
  );
  const [errorFetchingChart, setErrorFetchingChart] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!profile?.public_merchant_id || authLoading || loading) {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      setErrorFetchingStats(null);
      setErrorFetchingChart(null);

      // Fetch stats using Supabase
      try {
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const endOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );
        // Today's orders
        const {
          data: ordersData,
          count: todaysOrdersCount,
          error: ordersError,
        } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("merchant_id", profile.id)
          .gte("created_at", startOfToday.toISOString())
          .lt("created_at", endOfToday.toISOString());
        console.log("[Dashboard] orders query:", {
          ordersData,
          todaysOrdersCount,
          ordersError,
        });
        // Total menu items
        const {
          data: menuData,
          count: totalMenuItemsCount,
          error: menuError,
        } = await supabase
          .from("menu_items")
          .select("*", { count: "exact", head: true })
          .eq("merchant_id", profile.id);
        console.log("[Dashboard] menu_items query:", {
          menuData,
          totalMenuItemsCount,
          menuError,
        });
        setStats({
          todaysOrders: todaysOrdersCount ?? 0,
          totalMenuItems: totalMenuItemsCount ?? 0,
        });
      } catch (error: any) {
        setErrorFetchingStats(
          error.message || "Failed to load dashboard statistics."
        );
        setStats({ todaysOrders: 0, totalMenuItems: 0 });
      } finally {
        setIsLoadingStats(false);
      }

      // Fetch last 7 days orders for chart
      try {
        const chartData: DailyOrderData[] = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          const start = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate()
          );
          const end = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate() + 1
          );
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("public_merchant_id", profile.public_merchant_id)
            .gte("created_at", start.toISOString())
            .lt("created_at", end.toISOString());
          chartData.push({ date: format(day, "EEE"), orders: count ?? 0 });
        }
        setLast7DaysOrdersData(chartData);
      } catch (error: any) {
        setErrorFetchingChart(error.message || "Failed to load chart data.");
        setLast7DaysOrdersData([]);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchDashboardData();
  }, [profile?.public_merchant_id, authLoading, loading]);

  // DEBUG LOGS
  console.log("[Dashboard] user:", user);
  console.log("[Dashboard] profile:", profile);
  console.log(
    "[Dashboard] authLoading:",
    authLoading,
    "profileLoading:",
    loading
  );
  console.log("[Dashboard] stats:", stats);
  console.log("[Dashboard] last7DaysOrdersData:", last7DaysOrdersData);
  console.log("[Dashboard] errorFetchingStats:", errorFetchingStats);
  console.log("[Dashboard] errorFetchingChart:", errorFetchingChart);

  const quickActions = [
    {
      title: "Manage Menu",
      description: "Add or update your menu items.",
      href: "/menu-builder",
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      title: "View QR Code",
      description: "Get your scannable menu QR code.",
      href: "/qr-code",
      icon: QrCode,
      color: "text-accent",
    },
    {
      title: "Edit Profile",
      description: "Update your restaurant details.",
      href: "/profile",
      icon: UserCircle,
      color: "text-secondary-foreground",
    },
  ];

  const displayStats = [
    {
      title: "Today's Orders",
      value: stats.todaysOrders,
      icon: DollarSign,
      color: "text-primary",
      note: "Orders received since midnight",
    },
    {
      title: "Total Menu Items",
      value: stats.totalMenuItems,
      icon: ListChecks,
      color: "text-blue-500",
      note: "Current items in your menu",
    },
  ];

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
  };

  const restaurantName = profile?.restaurant_name || "";

  return (
    <div className="space-y-8">
      <Card className="mb-8 p-8 shadow-lg rounded-2xl bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2">
            {restaurantName
              ? `Welcome, ${restaurantName}!`
              : "Welcome to your Dashboard!"}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {profile?.description
              ? profile.description
              : "Manage your restaurant, menu, and orders all in one place."}
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-2">
          <span className="h-8 w-1 bg-primary rounded-full"></span>
          Quick Actions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="hover:shadow-xl transition-all duration-300 border-border group hover:border-primary/50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                  {action.title}
                </CardTitle>
                <action.icon
                  className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`}
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {action.description}
                </p>
                <Button
                  asChild
                  variant="default"
                  className="w-full group-hover:bg-primary/90 transition-colors"
                >
                  <Link href={action.href}>{action.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-2">
          <span className="h-8 w-1 bg-primary rounded-full"></span>
          At a Glance
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayStats.map((stat) => (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all duration-300 border-border group hover:border-primary/50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`}
                />
              </CardHeader>
              <CardContent>
                {isLoadingStats ||
                authLoading ||
                loading ||
                stat.value === null ? (
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </div>
                )}
                {!isLoadingStats && stat.note && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.note}
                  </p>
                )}
                {errorFetchingStats &&
                  (stat.title === "Today's Orders" ||
                    stat.title === "Total Menu Items") && (
                    <p className="text-xs text-destructive mt-2">
                      Could not load. Firestore index might be building.
                    </p>
                  )}
              </CardContent>
            </Card>
          ))}
          {/* Chart Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-border group hover:border-primary/50 col-span-full lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                Orders Last 7 Days
              </CardTitle>
              <LineChartIcon className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {(() => {
                if (isLoadingChart || authLoading || loading) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        Loading chart...
                      </span>
                    </div>
                  );
                }
                if (errorFetchingChart) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-destructive mt-1 text-center">
                        Failed to load chart. Error: {errorFetchingChart}.
                        <br />
                        Ensure Firestore index is built. Check console for
                        details.
                      </p>
                    </div>
                  );
                }
                if (!last7DaysOrdersData || last7DaysOrdersData.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        No order data for the last 7 days.
                      </p>
                    </div>
                  );
                }
                return (
                  <ChartContainer
                    config={chartConfig}
                    className="w-full h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={last7DaysOrdersData}
                        margin={{ top: 5, right: 0, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          fontSize={12}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          fontSize={12}
                          allowDecimals={false}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar
                          dataKey="orders"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]} // Rounded top corners only
                        />
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
