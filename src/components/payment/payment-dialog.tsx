"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { MockPaymentGateway, PaymentIntent } from "@/lib/mock-payment";
import { useToast } from "@/hooks/use-toast";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  amount,
  currency = "INR",
  onSuccess,
}: PaymentDialogProps) {
  const [step, setStep] = useState<
    "initial" | "processing" | "success" | "failed"
  >("initial");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(
    null
  );
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setStep("processing");
      const gateway = MockPaymentGateway.getInstance();

      // Create payment intent
      const intent = await gateway.createPaymentIntent(amount, currency);
      setPaymentIntent(intent);

      // Process payment
      const result = await gateway.processPayment(intent.id);

      if (result.success && result.paymentIntent) {
        setStep("success");
        onSuccess(result.paymentIntent);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
      } else {
        setStep("failed");
        toast({
          title: "Payment Failed",
          description:
            result.error || "Failed to process payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setStep("failed");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (step === "processing") return; // Prevent closing while processing
    setStep("initial");
    setPaymentIntent(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === "initial" && "Complete Payment"}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
            {step === "failed" && "Payment Failed"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {step === "initial" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="text-2xl font-bold">
                  {currency === "INR" ? "₹" : "$"}
                  {amount.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Your order is pending. Complete the payment to confirm your
                order.
              </div>
              <Button className="w-full" size="lg" onClick={handlePayment}>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Now
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Processing your payment...
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we confirm your payment.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium">Payment successful!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your order has been confirmed and payment processed.
              </p>
              <Button className="w-full" onClick={handleClose}>
                View Order
              </Button>
            </div>
          )}

          {step === "failed" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center font-medium">Payment failed</p>
              <p className="text-sm text-muted-foreground text-center">
                Your order is still pending. Please try again or use a different
                payment method.
              </p>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel Order
                </Button>
                <Button className="flex-1" onClick={() => setStep("initial")}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
