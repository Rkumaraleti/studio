// src/app/(app)/layout.tsx
"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  QrCode as QrCodeIcon,
  Settings,
  PanelLeft,
  ShoppingBag,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/common/app-logo";
import { UserNav } from "@/components/common/user-nav";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/menu-builder", icon: ClipboardList, label: "Menu Builder" },
  { href: "/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/qr-code", icon: QrCodeIcon, label: "QR Code" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-full bg-gradient-to-br from-background to-background/95">
        <Sidebar
          className="border-r bg-background/50 backdrop-blur-sm hidden md:block"
          collapsible="icon"
        >
          <SidebarHeader className="border-b border-border/40">
            <Link
              href="/dashboard"
              className="block group-data-[collapsible=icon]:hidden"
            >
              <AppLogo size={40} className="text-2xl font-bold" />
            </Link>
            <Link
              href="/dashboard"
              className="hidden group-data-[collapsible=icon]:block"
            >
              <AppLogo size={40} showText={false} />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label, side: "right" }}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="responsive-text">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/40">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: "Settings", side: "right" }}
                  disabled
                >
                  <Link href="#">
                    <Settings className="h-5 w-5" />
                    <span className="responsive-text">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <MobileSidebarToggle />
            <div className="ml-auto">
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto responsive-padding">
            <div className="responsive-container space-y-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function MobileSidebarToggle() {
  const { toggleSidebar, isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
}
