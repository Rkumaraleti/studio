import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context"; // Import AuthProvider

export const metadata: Metadata = {
  title: "QR Plus - Digital Menus Made Easy",
  description: "Create, customize, and share your digital menu with QR Plus.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased h-full flex flex-col overflow-x-hidden`}
      >
        <AuthProvider>
          {" "}
          {/* Wrap children with AuthProvider */}
          <div className="flex-1 flex flex-col min-h-screen">{children}</div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
