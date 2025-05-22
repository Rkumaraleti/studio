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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Save, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const paymentFormSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name is required"),
  stripeAccountId: z.string().optional(), // Example field
  paymentGatewayConfigured: z.boolean().default(false),
  currency: z.string().length(3, "Currency code must be 3 letters, e.g., USD"),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

// Placeholder for actual profile data fetching/saving
const initialProfileData: PaymentFormData = {
  restaurantName: "My Awesome Cafe",
  paymentGatewayConfigured: false,
  currency: "USD",
  stripeAccountId: "",
};

export function PaymentForm() {
  const { toast } = useToast();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initialProfileData,
  });

  function onSubmit(data: PaymentFormData) {
    // In a real app, you'd save this to Firebase/backend
    console.log("Payment settings submitted:", data);
    toast({
      title: "Profile Updated",
      description: "Your payment settings have been saved (simulated).",
    });
  }

  return (
    <Card className="shadow-lg max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Banknote className="mr-2 h-6 w-6" />
          Restaurant & Payment Settings
        </CardTitle>
        <CardDescription>
          Manage your restaurant details and payment gateway configuration.
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
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USD, EUR, JPY" {...field} />
                  </FormControl>
                  <FormDescription>Enter the 3-letter ISO currency code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SeparatorWithText text="Payment Gateway (Example: Stripe)" />
            
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
                      Connect your payment provider to accept online orders.
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
                name="stripeAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Account ID (Example)</FormLabel>
                    <FormControl>
                      <Input placeholder="acct_xxxxxxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is a placeholder. Securely manage API keys on the server.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800">Important Security Note</AlertTitle>
              <AlertDescription className="text-blue-700">
                Never store sensitive API keys or payment credentials directly in client-side code or your frontend database.
                This form is for UI demonstration purposes only. Real payment integration requires secure backend handling.
              </AlertDescription>
            </Alert>

            <Button type="submit" size="lg">
              <Save className="mr-2 h-5 w-5" /> Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SeparatorWithText({text}: {text: string}) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}
