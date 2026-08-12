import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Package, Shield, Settings, Zap, ArrowRight } from 'lucide-react';
import { useListProducts } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';

function ProductLineGrid() {
  const { data: products, isLoading } = useListProducts();

  const lines = products?.reduce((acc, p) => {
    const entry = acc.get(p.productLine) ?? { count: 0, minPrice: Infinity, imageUrl: p.imageUrl };
    entry.count += 1;
    entry.minPrice = Math.min(entry.minPrice, p.unitPriceCents);
    acc.set(p.productLine, entry);
    return acc;
  }, new Map<string, { count: number; minPrice: number; imageUrl: string | null }>());

  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary tracking-tight">Product Lines</h2>
          <p className="mt-4 text-lg text-gray-600">Everything you need for All-on-X, from abutment to delivery.</p>
        </div>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...(lines ?? new Map())].map(([line, info]) => (
              <Link key={line} href={`/shop?line=${encodeURIComponent(line)}`} className="group">
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-accent transition-all h-full flex flex-col">
                  <div className="h-36 bg-gray-100 overflow-hidden">
                    {info.imageUrl && (
                      <img src={info.imageUrl} alt={line} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-primary leading-snug">{line}</h3>
                    <p className="text-sm text-gray-500 mt-1">{info.count} product{info.count === 1 ? '' : 's'}</p>
                    <p className="text-sm text-gray-600 mt-auto pt-3">
                      From <span className="font-semibold text-primary">{fmt(info.minPrice)}</span>
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Shop
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary text-white overflow-hidden py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8">
            All-on-X Made Easy.
          </h1>
          <p className="mt-6 text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-10">
            Precision B2B procurement for dental clinics, labs, and DSOs. Streamline your prosthetics ordering with unmatched clinical accuracy.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8">
              <Link href="/login">Order Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-primary hover:bg-white bg-white/10 text-lg px-8">
              <Link href="/shop">View Products</Link>
            </Button>
          </div>
        </div>
      </section>

      <ProductLineGrid />

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary tracking-tight">Why Choose Smart On X?</h2>
            <p className="mt-4 text-lg text-gray-600">Built by dental professionals, for dental professionals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Clinical Precision</h3>
              <p className="text-gray-600">Every product is engineered to exact specifications, ensuring perfect fits and reliable outcomes.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rapid Turnaround</h3>
              <p className="text-gray-600">Our streamlined portal and integrated logistics mean your materials arrive exactly when you need them.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seamless Management</h3>
              <p className="text-gray-600">Manage multiple locations, billing profiles, and team members from a single, intuitive dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">Ready to streamline your ordering?</h2>
          <p className="text-lg text-gray-600 mb-8">Join the leading DSOs and dental labs already using Smart On X.</p>
          <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
            <Link href="/login">Access Portal</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
