import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/app-logo';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-blue-100 p-6 text-center">
      <header className="mb-12">
        <AppLogo size={64} />
      </header>
      
      <main className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl mb-6">
          Welcome to QR Plus
        </h1>
        <p className="text-lg leading-8 text-foreground/80 mb-10">
          Effortlessly create, customize, and share beautiful digital menus.
          Boost your sales and delight your customers with a modern dining experience.
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="#">
              Learn More
            </Link>
          </Button>
        </div>
      </main>

      <footer className="mt-auto pt-10">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} QR Plus. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
