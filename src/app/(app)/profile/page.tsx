import { PaymentForm } from "./components/payment-form";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground">
          Manage your restaurant information and payment configurations.
        </p>
      </div>
      <PaymentForm />
    </div>
  );
}
