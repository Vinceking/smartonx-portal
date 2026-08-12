import { ReactNode } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary tracking-tight">Smart On X</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Products</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">About Us</Link>
              <Link href="/training" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Training</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-primary">
              <Link href="/login">Portal Login</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/login">Order Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <span className="text-2xl font-bold tracking-tight">Smart On X</span>
              <p className="mt-4 text-sm text-primary-foreground/70 max-w-xs">
                Precision B2B procurement tool for dental clinics, labs, and DSOs. All-on-X Made Easy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/shop">Omnibut</Link></li>
                <li><Link href="/shop">Rapid Arches</Link></li>
                <li><Link href="/shop">Rapid Set Pickup Acrylic</Link></li>
                <li><Link href="/shop">SimpleTemp</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/events">Events</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-sm text-primary-foreground/50 text-center">
            &copy; {new Date().getFullYear()} Smart On X. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
