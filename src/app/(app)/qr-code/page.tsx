
// src/app/(app)/qr-code/page.tsx
"use client"; 

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Download, QrCode as QrCodeIcon, Share2, Copy, Smartphone, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useMerchantProfile } from '@/hooks/use-merchant-profile'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function QrCodePage() {
  const [menuUrl, setMenuUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();
  const { publicMerchantId, isLoadingProfile } = useMerchantProfile();

  useEffect(() => {
    if (typeof window !== 'undefined' && publicMerchantId) {
      const currentOrigin = window.location.origin;
      const url = `${currentOrigin}/menu/${publicMerchantId}`;
      setMenuUrl(url);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&format=png&qzone=1&margin=10&ecc=M`);
    } else if (!isLoadingProfile && !publicMerchantId) {
      setMenuUrl('');
      setQrCodeUrl('');
    }
  }, [publicMerchantId, isLoadingProfile]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl; 
    link.download = `menu-qr-code-${publicMerchantId || 'unknown'}.png`;
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

  if (isLoadingProfile) {
    return (
      <div className="p-4 md:p-6 lg:p-8"> {/* Standard page padding */}
        <div className="space-y-8 max-w-xl mx-auto text-center"> {/* Centered content */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
            <p className="text-muted-foreground flex items-center justify-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading merchant details...
            </p>
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
      </div>
    );
  }

  if (!publicMerchantId && !isLoadingProfile) {
    return (
      <div className="p-4 md:p-6 lg:p-8"> {/* Standard page padding */}
        <div className="space-y-8 max-w-xl mx-auto"> {/* Centered content */}
           <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">QR Code Unavailable</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Merchant ID Not Found</AlertTitle>
            <AlertDescription>
              We couldn't load your public Merchant ID. Please ensure you are logged in, your profile is set up, and try again.
              If this issue persists, your profile might still be finalizing.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8"> {/* Standard page padding */}
      <div className="space-y-8 max-w-xl mx-auto"> {/* Centered content wrapper */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
          <p className="text-muted-foreground">
            Share this QR code with your customers. Your Public Menu ID: <strong>{publicMerchantId}</strong>
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
                  priority 
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

        <Button asChild variant="secondary" className="w-full" disabled={!menuUrl}>
          <a href={menuUrl || '#'} target="_blank" rel="noopener noreferrer">
            <Smartphone className="mr-2 h-5 w-5" /> Open Menu in New Tab
          </a>
        </Button>
      </div>
    </div>
  );
}

const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-foreground ${className}`}>
    {children}
  </label>
);

