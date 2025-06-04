// src/app/(app)/qr-code/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Download,
  QrCode as QrCodeIcon,
  Share2,
  Copy,
  Smartphone,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState("");
  const { toast } = useToast();
  const {
    profile,
    publicMerchantId,
    loading: isLoadingProfile,
  } = useMerchantProfile();

  // Always generate the menu URL on the fly
  const menuUrl = publicMerchantId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/menu/${publicMerchantId}`
    : "";

  useEffect(() => {
    if (menuUrl) {
      setQrCodeImageUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          menuUrl
        )}&format=png&qzone=1&margin=10&ecc=M`
      );
    } else {
      setQrCodeImageUrl("");
    }
  }, [menuUrl]);

  const handleDownload = () => {
    if (!qrCodeImageUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeImageUrl;
    link.download = `menu-qr-code-${publicMerchantId || "merchant"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download Started",
      description: "Your QR code is downloading.",
    });
  };

  const handleCopyUrl = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "URL Copied",
      description: "Menu URL copied to clipboard.",
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading merchant details...</p>
        </div>
      </div>
    );
  }

  if (!publicMerchantId && !isLoadingProfile) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="responsive-heading text-primary mb-4 text-center">
            QR Code Unavailable
          </h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Merchant ID Not Found</AlertTitle>
            <AlertDescription>
              We couldn't load your public Merchant ID. Please ensure your
              profile is set up.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container py-8">
      <div className="mb-8">
        <h1 className="responsive-heading text-primary mb-2">
          Your Menu QR Code
        </h1>
        <p className="responsive-text text-muted-foreground">
          Share this QR code with your customers. Your Public Menu ID:{" "}
          <strong>{publicMerchantId}</strong>
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center">
                <QrCodeIcon className="mr-2 h-7 w-7" /> Scan Me!
              </CardTitle>
              <CardDescription>
                Point your camera here to view the menu.
              </CardDescription>
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
                <label
                  htmlFor="menu-url"
                  className="text-sm font-medium text-left block"
                >
                  Your Static Menu URL:
                </label>
                <div className="flex gap-2">
                  <Input
                    id="menu-url"
                    type="text"
                    value={menuUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-center gap-4">
              <Button onClick={handleDownload} className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="flex-1 sm:flex-none"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Menu URL
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
              <p>
                • The QR code always points to your unique Static Menu URL shown
                above.
              </p>
              <p>
                • If your website's main address changes, use "Refresh/Update
                URL" to update this link, then download the new QR code.
              </p>
              <p>
                • Print the QR code and place it on tables, entrances, or
                flyers.
              </p>
              <p>
                • Ensure good lighting and a clear, non-reflective surface for
                easy scanning.
              </p>
            </CardContent>
          </Card>

          <Button
            asChild
            variant="secondary"
            className="w-full"
            disabled={!menuUrl}
          >
            <a href={menuUrl || "#"} target="_blank" rel="noopener noreferrer">
              <Smartphone className="mr-2 h-5 w-5" /> Open Menu in New Tab
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

const Label = ({
  htmlFor,
  className,
  children,
}: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-foreground ${className}`}
  >
    {children}
  </label>
);
