import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, QrCode, UserCircle, DollarSign, BarChart3, Star } from "lucide-react";

export default function DashboardPage() {
  const quickActions = [
    { title: "Manage Menu", description: "Add or update your menu items.", href: "/menu-builder", icon: ClipboardList, color: "text-blue-500" },
    { title: "View QR Code", description: "Get your scannable menu QR code.", href: "/qr-code", icon: QrCode, color: "text-green-500" },
    { title: "Edit Profile", description: "Update your restaurant details.", href: "/profile", icon: UserCircle, color: "text-purple-500" },
  ];

  const stats = [
    { title: "Today's Orders", value: "12", icon: DollarSign, color: "text-yellow-500" },
    { title: "Menu Views", value: "150", icon: BarChart3, color: "text-indigo-500" },
    { title: "Average Rating", value: "4.5", icon: Star, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome Back, Merchant!</CardTitle>
          <CardDescription>Here's what's happening with your QR Plus menu today.</CardDescription>
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
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
