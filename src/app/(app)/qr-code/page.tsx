
// src/app/(app)/qr-code/page.tsx
"use client"; 

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Download, QrCode as QrCodeIcon, Share2, Copy, Smartphone, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useMerchantProfile } from '@/hooks/use-merchant-profile'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function QrCodePage() {
  const [currentDisplayMenuUrl, setCurrentDisplayMenuUrl] = useState('');
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState('');
  const { toast } = useToast();
  const { profile, publicMerchantId, isLoadingProfile, regenerateAndSaveStaticMenuUrl } = useMerchantProfile();

  useEffect(() => {
    if (profile && profile.staticMenuUrl) {
      setCurrentDisplayMenuUrl(profile.staticMenuUrl);
      setQrCodeImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profile.staticMenuUrl)}&format=png&qzone=1&margin=10&ecc=M`);
    } else if (!isLoadingProfile && profile && !profile.staticMenuUrl) {
      // This case means profile is loaded but staticMenuUrl is somehow missing/pending creation by the hook
      setCurrentDisplayMenuUrl('Generating menu URL...');
      setQrCodeImageUrl('');
    } else if (!isLoadingProfile && !publicMerchantId) { // Or !profile
      setCurrentDisplayMenuUrl('');
      setQrCodeImageUrl('');
    }
    // If isLoadingProfile, we wait for profile data
  }, [profile, isLoadingProfile, publicMerchantId]);

  const handleDownload = () => {
    if (!qrCodeImageUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeImageUrl; 
    link.download = `menu-qr-code-${publicMerchantId || 'merchant'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: "Your QR code is downloading." });
  };
  
  const handleCopyUrl = () => {
    if (!currentDisplayMenuUrl || currentDisplayMenuUrl === 'Generating menu URL...') return;
    navigator.clipboard.writeText(currentDisplayMenuUrl)
      .then(() => {
        toast({ title: "URL Copied!", description: "Menu URL copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy URL.", variant: "destructive" });
        console.error('Failed to copy: ', err);
      });
  };

  const handleRegenerateUrl = async () => {
    if (regenerateAndSaveStaticMenuUrl) {
      await regenerateAndSaveStaticMenuUrl();
      // Toast notification is handled within the hook
    } else {
      toast({ title: "Error", description: "Could not regenerate URL at this time.", variant: "destructive" });
    }
  };


  if (isLoadingProfile) {
    return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
          <p className="text-muted-foreground flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading merchant details...
          </p>
        </div>
        <div className="space-y-8 max-w-2xl mx-auto">
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
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">QR Code Unavailable</h1>
        </div>
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Merchant ID Not Found</AlertTitle>
          <AlertDescription>
            We couldn't load your public Merchant ID. Please ensure your profile is set up.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!profile?.staticMenuUrl && !isLoadingProfile) {
     return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">QR Code Pending</h1>
        </div>
        <Alert variant="default" className="max-w-2xl mx-auto">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Menu URL Finalizing</AlertTitle>
          <AlertDescription>
            Your unique menu URL is being prepared. This page will update shortly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
        <p className="text-muted-foreground">
          Share this QR code with your customers. Your Public Menu ID: <strong>{publicMerchantId}</strong>
        </p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto">
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <QrCodeIcon className="mr-2 h-7 w-7" /> Scan Me!
            </CardTitle>
            <CardDescription>Point your camera here to view the menu.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {qrCodeImageUrl ? (
              <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                <Image 
                  src={qrCodeImageUrl} 
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
              <Label htmlFor="menu-url" className="text-sm font-medium text-left block">Your Static Menu URL:</Label>
              <div className="flex gap-2">
                <Input id="menu-url" type="text" value={currentDisplayMenuUrl} readOnly className="bg-muted text-muted-foreground"/>
                <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copy URL" disabled={!currentDisplayMenuUrl || currentDisplayMenuUrl === 'Generating menu URL...'}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <Button onClick={handleDownload} size="lg" disabled={!qrCodeImageUrl}>
                <Download className="mr-2 h-5 w-5" /> Download QR
              </Button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button variant="outline" onClick={() => navigator.share({ title: 'Our Digital Menu', url: currentDisplayMenuUrl })} size="lg" disabled={!currentDisplayMenuUrl || currentDisplayMenuUrl === 'Generating menu URL...'}>
                  <Share2 className="mr-2 h-5 w-5" /> Share Menu Link
                </Button>
              )}
               <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="outline" size="lg" disabled={!regenerateAndSaveStaticMenuUrl || isLoadingProfile}>
                    <RefreshCw className="mr-2 h-5 w-5" /> Refresh/Update URL
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Update Menu URL?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update the stored menu URL for your QR code to use the current browser origin: <br/>
                      <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/menu/{publicMerchantId}</strong>.
                      <br/><br/>
                      If you have already printed QR codes, they will point to the old URL unless you regenerate and replace them.
                      This is useful if your application's hosting domain has changed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateUrl}>Confirm Update</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
              <p>• The QR code always points to your unique Static Menu URL shown above.</p>
              <p>• If your website's main address changes, use "Refresh/Update URL" to update this link, then download the new QR code.</p>
              <p>• Print the QR code and place it on tables, entrances, or flyers.</p>
              <p>• Ensure good lighting and a clear, non-reflective surface for easy scanning.</p>
          </CardContent>
        </Card>

        <Button asChild variant="secondary" className="w-full" disabled={!currentDisplayMenuUrl || currentDisplayMenuUrl === 'Generating menu URL...'}>
          <a href={currentDisplayMenuUrl || '#'} target="_blank" rel="noopener noreferrer">
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
