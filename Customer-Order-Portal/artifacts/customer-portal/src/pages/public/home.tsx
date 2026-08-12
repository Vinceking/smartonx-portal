import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Package, Shield, Settings, Zap } from 'lucide-react';

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
