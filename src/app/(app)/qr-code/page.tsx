"use client"; 

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Download, QrCode as QrCodeIcon, Share2, Copy, Eye, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useMerchantProfile } from '@/hooks/use-merchant-profile'; // Import the hook
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function QrCodePage() {
  const [menuUrl, setMenuUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();
  const { merchantId, isLoadingProfile } = useMerchantProfile(); // Use the hook

  useEffect(() => {
    if (typeof window !== 'undefined' && merchantId) {
      const currentOrigin = window.location.origin;
      const url = `${currentOrigin}/menu/${merchantId}`;
      setMenuUrl(url);
      // Using a more robust QR code generator API, ensure it's free and reliable for your use case
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&format=png&qzone=1&margin=10&ecc=M`);
    }
  }, [merchantId]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    // For qrserver, direct link usually works for download if it's a GET request
    link.href = qrCodeUrl; 
    link.download = `menu-qr-code-${merchantId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: "Your QR code is downloading." });
  };
  
  const handleCopyUrl = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl)
      .then(() => {
        toast({ title: "URL Copied!", description: "Menu URL copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy URL.", variant: "destructive" });
        console.error('Failed to copy: ', err);
      });
  };

  if (isLoadingProfile || !merchantId) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto text-center">
        <div>
          <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-1" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Skeleton className="h-[280px] w-[280px] rounded-lg" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-grow" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Skeleton className="h-12 w-36" />
              <Skeleton className="h-12 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
          <p className="text-muted-foreground">
            Share this QR code with your customers for instant access to your digital menu. Your Merchant ID: <strong>{merchantId}</strong>
          </p>
        </div>

        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <QrCodeIcon className="mr-2 h-7 w-7" /> Scan Me!
            </CardTitle>
            <CardDescription>Point your camera here to view the menu.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {qrCodeUrl ? (
              <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                <Image 
                  src={qrCodeUrl} 
                  alt="Menu QR Code" 
                  width={280} 
                  height={280}
                  className="rounded-md"
                  data-ai-hint="qr code" 
                  priority // Prioritize loading the QR code image
                />
              </div>
            ) : (
              <Skeleton className="h-[280px] w-[280px] rounded-lg bg-muted" />
            )}
            
            <div className="w-full space-y-2">
              <Label htmlFor="menu-url" className="text-sm font-medium text-left block">Your Menu URL:</Label>
              <div className="flex gap-2">
                <Input id="menu-url" type="text" value={menuUrl} readOnly className="bg-muted text-muted-foreground"/>
                <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copy URL" disabled={!menuUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Button onClick={handleDownload} size="lg" disabled={!qrCodeUrl}>
                <Download className="mr-2 h-5 w-5" /> Download QR
              </Button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button variant="outline" onClick={() => navigator.share({ title: 'Our Digital Menu', url: menuUrl })} size="lg" disabled={!menuUrl}>
                  <Share2 className="mr-2 h-5 w-5" /> Share Menu Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
              <p>• Print the QR code and place it on tables, entrances, or flyers.</p>
              <p>• Add the QR code to your website or social media profiles.</p>
              <p>• Ensure good lighting and a clear, non-reflective surface for easy scanning.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary flex items-center">
          <Eye className="mr-2 h-6 w-6" /> Live Menu Preview
        </h2>
        <Card className="shadow-lg">
          <CardContent className="p-2 sm:p-4">
            <div className="aspect-[9/19.5] w-full max-w-sm mx-auto bg-muted rounded-xl p-2 sm:p-3 shadow-2xl border-4 border-foreground/70">
               <div className="w-full h-4 bg-foreground/70 rounded-t-md flex items-center justify-center mb-1">
                <span className="w-10 h-1 bg-muted/50 rounded-full"></span>
              </div>
              {menuUrl ? (
                <iframe
                  src={menuUrl}
                  title="Menu Preview"
                  className="w-full h-full border-0 rounded-md bg-background"
                  sandbox="allow-scripts allow-same-origin" // Restrict iframe capabilities for security
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-background rounded-md">
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              )}
            </div>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              This is a live preview of your public menu. Changes made in the Menu Builder will reflect here after a page refresh.
            </p>
          </CardFooter>
        </Card>
         <Button asChild variant="secondary" className="w-full">
          <a href={menuUrl} target="_blank" rel="noopener noreferrer">
            <Smartphone className="mr-2 h-5 w-5" /> Open Menu in New Tab
          </a>
        </Button>
      </div>
    </div>
  );
}

// Small Label component as it's not imported by default in ui/input.tsx
// but often used with inputs
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-foreground ${className}`}>
    {children}
  </label>
);
