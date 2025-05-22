import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'QR Plus - Digital Menus Made Easy',
  description: 'Create, customize, and share your digital menu with QR Plus.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased h-full flex flex-col`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
