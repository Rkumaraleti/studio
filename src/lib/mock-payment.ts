// Mock payment service to simulate payment gateway behavior
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: number;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock payment gateway class
export class MockPaymentGateway {
  private static instance: MockPaymentGateway;
  private paymentIntents: Map<string, PaymentIntent> = new Map();

  private constructor() {}

  static getInstance(): MockPaymentGateway {
    if (!MockPaymentGateway.instance) {
      MockPaymentGateway.instance = new MockPaymentGateway();
    }
    return MockPaymentGateway.instance;
  }

  async createPaymentIntent(amount: number, currency: string = 'INR'): Promise<PaymentIntent> {
    // Simulate API call delay
    await delay(1000);

    const paymentIntent: PaymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: 'pending',
      created_at: Date.now()
    };

    this.paymentIntents.set(paymentIntent.id, paymentIntent);
    return paymentIntent;
  }

  async processPayment(paymentIntentId: string): Promise<PaymentResult> {
    // Simulate API call delay
    await delay(2000);

    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found'
      };
    }

    // Simulate random success/failure (80% success rate)
    const success = Math.random() < 0.8;

    if (success) {
      paymentIntent.status = 'succeeded';
      this.paymentIntents.set(paymentIntentId, paymentIntent);
      return {
        success: true,
        paymentIntent
      };
    } else {
      paymentIntent.status = 'failed';
      this.paymentIntents.set(paymentIntentId, paymentIntent);
      return {
        success: false,
        error: 'Payment failed due to insufficient funds',
        paymentIntent
      };
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus | null> {
    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    return paymentIntent?.status || null;
  }
} 