"use client";

import { PaymentForm } from "./components/payment-form";
import { useAuth } from "@/contexts/auth-context";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { Loader2, Info, Copy, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    publicMerchantId,
  } = useMerchantProfile();
  const { toast } = useToast();

  // Generate the menu URL
  const menuUrl = publicMerchantId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/menu/${publicMerchantId}`
    : "";

  const handleCopyUrl = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "URL Copied",
      description: "Menu URL copied to clipboard.",
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="responsive-heading text-primary mb-4 text-center">
            Profile & Settings
          </h1>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Please log in to view and manage your profile.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="responsive-container min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="responsive-heading text-primary mb-4 text-center">
            Profile & Settings
          </h1>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>
              Your profile could not be found. Please contact support if this
              persists.
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
          Profile & Settings
        </h1>
        <p className="responsive-text text-muted-foreground">
          Manage your business information and payment configurations.
        </p>
      </div>

      <div className="mb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="menu-url" className="text-sm font-medium">
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
          <Button
            asChild
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={!menuUrl}
          >
            <a href={menuUrl || "#"} target="_blank" rel="noopener noreferrer">
              <Smartphone className="mr-2 h-5 w-5" /> Open Menu in New Tab
            </a>
          </Button>
        </div>
      </div>

      <PaymentForm />
    </div>
  );
}
