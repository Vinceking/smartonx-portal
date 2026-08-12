import { ReactNode } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const PRODUCT_LINES = [
  'Omnibut',
  'Rapid Arches',
  'Rapid Set Pickup Acrylic',
  'SimpleTemp',
  'Smart Denture Conversions',
];

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
              <div className="relative group">
                <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1">
                  Shop
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-64">
                    {PRODUCT_LINES.map((line) => (
                      <Link key={line} href={`/shop?line=${encodeURIComponent(line)}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                        {line}
                      </Link>
                    ))}
                    <div className="border-t my-2" />
                    <Link href="/shop" className="block px-4 py-2 text-sm font-medium text-primary hover:bg-gray-50">
                      View All Products
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="/training" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Training</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">About Us</Link>
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Blog</Link>
              <Link href="/events" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Events</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-6">
              <Link href="/login">Log In</Link>
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
                <li><Link href="/shop?line=Omnibut" className="hover:text-white transition-colors">Omnibut</Link></li>
                <li><Link href="/shop?line=Rapid%20Arches" className="hover:text-white transition-colors">Rapid Arches</Link></li>
                <li><Link href="/shop?line=Rapid%20Set%20Pickup%20Acrylic" className="hover:text-white transition-colors">Rapid Set Pickup Acrylic</Link></li>
                <li><Link href="/shop?line=SimpleTemp" className="hover:text-white transition-colors">SimpleTemp</Link></li>
                <li><Link href="/shop?line=Smart%20Denture%20Conversions" className="hover:text-white transition-colors">Smart Denture Conversions</Link></li>
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
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
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
