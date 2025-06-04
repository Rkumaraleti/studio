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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Banknote,
  Save,
  ShieldCheck,
  Loader2,
  Info,
  Building,
  Link as LinkIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const paymentFormSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessDescription: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  currency: z
    .string()
    .length(3, "Currency code must be 3 letters, e.g., INR")
    .toUpperCase(),
  paymentGatewayConfigured: z.boolean().default(false),
  paymentGatewayAccountId: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export function PaymentForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    publicMerchantId,
  } = useMerchantProfile();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
      currency: "INR",
      paymentGatewayConfigured: false,
      paymentGatewayAccountId: "",
    },
  });

  // Track form changes
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      form.reset({
        businessName: profile.restaurant_name || "",
        businessDescription: profile.description || "",
        currency: profile.currency || "INR",
        paymentGatewayConfigured: profile.payment_gateway_configured || false,
        paymentGatewayAccountId: profile.payment_gateway_account_id || "",
      });
      setHasChanges(false);
    }
  }, [profile, form]);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: PaymentFormData) {
    try {
      setIsSaving(true);
      await updateProfile(data);
      setHasChanges(false);
      toast({
        title: "Profile Updated",
        description: "Your business information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save your profile settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || profileLoading) {
    return (
      <Card className="shadow-lg">
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

  if (!user) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view and manage your profile.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Info className="mr-2 h-6 w-6 text-orange-500" />
            Profile Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Your merchant profile could not be found. Please contact support if
            this persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground p-8">
        <CardTitle className="text-3xl font-bold tracking-tight flex items-center">
          <Building className="mr-3 h-8 w-8" />
          Business Information
        </CardTitle>
        <CardDescription className="text-primary-foreground/90 text-lg mt-2">
          Manage your business details and payment configurations. <br />
          Public ID:{" "}
          <strong className="font-mono bg-primary-foreground/10 px-2 py-1 rounded">
            {publicMerchantId || "Generating..."}
          </strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Business Name"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Default Currency
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., INR, USD, EUR"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        className="h-11"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the 3-letter ISO currency code (e.g., INR).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Business Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your business, services, and what makes you unique."
                      {...field}
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear on your public page. Max 200 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormItem>
              <FormLabel className="text-base">
                Static Menu URL (for QR Code)
              </FormLabel>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={profile?.staticMenuUrl || "Generating..."}
                  readOnly
                  className="bg-muted text-muted-foreground text-sm font-mono"
                />
              </div>
              <FormDescription>
                This is the URL your QR code points to. You can refresh/update
                it on the "QR Code" page.
              </FormDescription>
            </FormItem> */}

            <Separator className="my-8" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Payment Gateway Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect a payment provider to enable online payments.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="paymentGatewayConfigured"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("paymentGatewayConfigured") && (
                <FormField
                  control={form.control}
                  name="paymentGatewayAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Payment Gateway Account ID / API Key
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., acct_xxxxxxxx or your_api_key"
                          {...field}
                          className="h-11 font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the relevant ID or key for your chosen payment
                        provider.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Alert
              variant="default"
              className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
            >
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">
                Important Security Note
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Never store highly sensitive API keys or secret credentials
                directly in client-side code or your frontend database if they
                grant extensive permissions. This form is for UI demonstration.
                Real payment integration often requires secure backend handling
                of secrets.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4">
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setHasChanges(false);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={
                  !hasChanges ||
                  form.formState.isSubmitting ||
                  profileLoading ||
                  !publicMerchantId ||
                  isSaving
                }
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
