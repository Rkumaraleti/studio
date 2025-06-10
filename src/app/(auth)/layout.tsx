// src/app/(auth)/layout.tsx
import { AppLogo } from "@/components/common/app-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
      <div className="mb-8">
        <AppLogo size={40} />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
