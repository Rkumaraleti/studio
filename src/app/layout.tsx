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
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon_io/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon_io/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon_io/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon_io/favicon.ico" />
        <link rel="canonical" href="https://qrplus.menu/" />
        <meta
          name="description"
          content="Create, customize, and share your digital menu with QR Plus. QR Plus makes digital menus easy for restaurants, cafes, and more."
        />
        <meta property="og:title" content="QR Plus - Digital Menus Made Easy" />
        <meta
          property="og:description"
          content="Create, customize, and share your digital menu with QR Plus. QR Plus makes digital menus easy for restaurants, cafes, and more."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://qrplus.menu/" />
        <meta property="og:image" content="/qrplus_logo.png" />
        <meta property="og:site_name" content="QR Plus" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="QR Plus - Digital Menus Made Easy"
        />
        <meta
          name="twitter:description"
          content="Create, customize, and share your digital menu with QR Plus. QR Plus makes digital menus easy for restaurants, cafes, and more."
        />
        <meta name="twitter:image" content="/qrplus_logo.png" />
        <meta name="twitter:site" content="@qrplusmenu" />
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
