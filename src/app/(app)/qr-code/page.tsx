"use client"; // For using window.location

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode as QrCodeIcon, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function QrCodePage() {
  const [menuUrl, setMenuUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();

  // Placeholder merchantId. In a real app, this would come from auth/context.
  const merchantId = "merchant123"; 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      const url = `${currentOrigin}/menu/${merchantId}`;
      setMenuUrl(url);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&format=png&qzone=1&margin=10`);
    }
  }, [merchantId]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = qrCodeUrl.replace("&format=png", "&format=png&download=1"); // some APIs support a download param
    link.download = 'menu-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: "Your QR code is downloading." });
  };
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl)
      .then(() => {
        toast({ title: "URL Copied!", description: "Menu URL copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy URL.", variant: "destructive" });
        console.error('Failed to copy: ', err);
      });
  };

  if (!qrCodeUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading QR Code...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Your Menu QR Code</h1>
        <p className="text-muted-foreground">
          Share this QR code with your customers to give them instant access to your digital menu.
        </p>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-center">
            <QrCodeIcon className="mr-2 h-7 w-7" /> Scan Me!
          </CardTitle>
          <CardDescription>Point your camera here to view the menu.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
            <Image 
              src={qrCodeUrl} 
              alt="Menu QR Code" 
              width={280} 
              height={280}
              className="rounded-md"
              data-ai-hint="qr code" 
            />
          </div>
          
          <div className="w-full space-y-2">
            <Label htmlFor="menu-url" className="text-sm font-medium">Your Menu URL:</Label>
            <div className="flex gap-2">
              <Input id="menu-url" type="text" value={menuUrl} readOnly className="bg-muted text-muted-foreground"/>
              <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copy URL">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Button onClick={handleDownload} size="lg">
              <Download className="mr-2 h-5 w-5" /> Download QR
            </Button>
            {navigator.share && (
              <Button variant="outline" onClick={() => navigator.share({ title: 'Our Digital Menu', url: menuUrl })} size="lg">
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
        <CardContent className="text-left space-y-2 text-muted-foreground">
            <p>• Print the QR code and place it on tables, entrances, or flyers.</p>
            <p>• Add the QR code to your website or social media profiles.</p>
            <p>• Ensure good lighting and a clear, non-reflective surface for easy scanning.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Small Label component as it's not imported by default in ui/input.tsx
// but often used with inputs
const Label = ({ htmlFor, className, children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </label>
);
