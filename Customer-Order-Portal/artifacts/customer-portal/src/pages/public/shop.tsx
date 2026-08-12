import { useListProducts } from '@workspace/api-client-react';
import { useSearch, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Shop() {
  const { data: products, isLoading } = useListProducts();
  const search = useSearch();
  const lineFilter = new URLSearchParams(search).get('line');

  const visibleProducts = lineFilter
    ? products?.filter((p) => p.productLine === lineFilter)
    : products;

  const productsByLine = visibleProducts?.reduce((acc, product) => {
    (acc[product.productLine] ??= []).push(product);
    return acc;
  }, {} as Record<string, NonNullable<typeof products>>);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  return (
    <div className="py-12 bg-gray-50 min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary tracking-tight mb-4">{lineFilter ?? 'Our Products'}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Log in to the ordering portal to place an order.
          </p>
          {lineFilter && (
            <Button variant="outline" asChild className="mt-4">
              <Link href="/shop">← View all products</Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-64 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(productsByLine || {}).map(([line, lineProducts]) => (
              <div key={line}>
                <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b pb-2">
                  <Package className="w-6 h-6 text-accent" />
                  {line}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lineProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-48 bg-gray-100 relative group overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                          <Badge variant="outline" className="font-mono whitespace-nowrap bg-gray-50">{product.sku}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2" title={product.description}>
                          {product.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 border-t bg-gray-50/50 mt-4 px-6 py-3 flex justify-between items-center">
                        <span className="font-bold text-lg text-primary">{formatCurrency(product.unitPriceCents)}</span>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            {!products?.length && (
              <div className="text-center py-24 text-gray-500">
                No products found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
