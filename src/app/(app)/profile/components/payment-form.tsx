
// src/app/(app)/profile/components/payment-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Save, ShieldCheck, Loader2, Info, Building, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const paymentFormSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name is required"),
  restaurantDescription: z.string().max(200, "Description must be 200 characters or less").optional(),
  currency: z.string().length(3, "Currency code must be 3 letters, e.g., USD").toUpperCase(),
  paymentGatewayConfigured: z.boolean().default(false),
  paymentGatewayAccountId: z.string().optional(),
  // staticMenuUrl is managed by useMerchantProfile, displayed here read-only
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export function PaymentForm() {
  const { toast } = useToast();
  const { profile, isLoadingProfile, updateProfile, publicMerchantId, authUserId } = useMerchantProfile();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      restaurantName: "",
      restaurantDescription: "",
      currency: "USD",
      paymentGatewayConfigured: false,
      paymentGatewayAccountId: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        restaurantName: profile.restaurantName || "",
        restaurantDescription: profile.restaurantDescription || "",
        currency: profile.currency || "USD",
        paymentGatewayConfigured: profile.paymentGatewayConfigured || false,
        paymentGatewayAccountId: profile.paymentGatewayAccountId || "",
      });
    }
  }, [profile, form]);

  async function onSubmit(data: PaymentFormData) {
    try {
      const updateData = { ...data };
      if (updateData.restaurantDescription === "") {
        updateData.restaurantDescription = undefined; // Ensure empty string becomes undefined for Firestore
      }
      // Exclude staticMenuUrl from form submission if it's ever part of the form values directly
      const { ...dataToSubmit } = updateData; 
      await updateProfile(dataToSubmit);
      toast({
        title: "Profile Updated",
        description: "Your restaurant information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save your profile settings. Please try again.",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    }
  }

  if (isLoadingProfile) {
    return (
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Loading Profile...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we load your settings.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile && !isLoadingProfile && authUserId) {
     return (
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Info className="mr-2 h-6 w-6 text-orange-500" />Profile Initializing</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your merchant profile is being set up. Please refresh in a moment if this persists.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!authUserId && !isLoadingProfile) {
     return (
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view and manage your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Building className="mr-2 h-6 w-6" />
          Restaurant Information
        </CardTitle>
        <CardDescription>
          Manage your restaurant details and payment configurations. <br/>
          Public Menu ID: <strong>{publicMerchantId || "Generating..."}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="restaurantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Restaurant's Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="restaurantDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell customers a bit about your restaurant (e.g., cuisine type, specialties, ambiance)." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>This will appear on your public menu page. Max 200 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USD, EUR, JPY" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormDescription>Enter the 3-letter ISO currency code (e.g., USD).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Static Menu URL (for QR Code)</FormLabel>
              <div className="flex items-center gap-2">
                 <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <Input 
                  value={profile?.staticMenuUrl || "Generating..."} 
                  readOnly 
                  className="bg-muted text-muted-foreground text-sm"
                />
              </div>
              <FormDescription>
                This is the URL your QR code points to. You can refresh/update it on the "QR Code" page.
              </FormDescription>
            </FormItem>


            <SeparatorWithText text="Payment Gateway Configuration" icon={<Banknote className="mr-2 h-5 w-5" />} />
            
            <FormField
              control={form.control}
              name="paymentGatewayConfigured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Payment Gateway
                    </FormLabel>
                    <FormDescription>
                      Connect a payment provider to enable online orders.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("paymentGatewayConfigured") && (
              <FormField
                control={form.control}
                name="paymentGatewayAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Gateway Account ID / API Key</FormLabel> 
                    <FormControl>
                      <Input placeholder="e.g., acct_xxxxxxxx or your_api_key" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the relevant ID or key for your chosen payment provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Important Security Note</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Never store highly sensitive API keys or secret credentials directly in client-side code or your frontend database if they grant extensive permissions.
                This form is for UI demonstration. Real payment integration often requires secure backend handling of secrets.
              </AlertDescription>
            </Alert>

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isLoadingProfile || !publicMerchantId}>
              {form.formState.isSubmitting || isLoadingProfile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SeparatorWithText({text, icon}: {text: string; icon?: React.ReactNode}) {
  return (
    <div className="relative my-8 pt-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-sm uppercase">
        <span className="bg-card px-3 text-muted-foreground flex items-center">
          {icon}
          {text}
        </span>
      </div>
    </div>
  );
}
