import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import ResellerProduct from '@/models/ResellerProduct';
import Product from '@/models/Product';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, slug } = await params;
  await dbConnect();
  const reseller = await Reseller.findOne({ subdomain, status: 'active' }).lean();
  if (!reseller) return { title: 'Not Found' };
  const product = await ResellerProduct.findOne({ resellerId: reseller._id, slug, isPublished: true }).lean();
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} — ${reseller.storeName}`,
    description: product.name,
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ResellerProductPage({ params }: Props) {
  const { subdomain, slug } = await params;
  await dbConnect();

  const reseller = await Reseller.findOne({ subdomain, status: 'active' }).lean();
  if (!reseller) notFound();

  const productDoc = await ResellerProduct.findOne({
    resellerId: reseller._id,
    slug,
    isPublished: true,
    isAvailableOnMother: true,
  }).populate('productId').lean();
  
  if (!productDoc || !productDoc.productId) notFound();

  const product = productDoc as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">← {reseller.storeName}</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            {product.images?.[0] ? (
              <div className="aspect-square rounded-2xl overflow-hidden border bg-muted">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-square rounded-2xl border bg-muted flex items-center justify-center text-6xl">📦</div>
            )}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.slice(1, 5).map((img: string, i: number) => (
                  <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border shrink-0">
                    <Image src={img} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black leading-tight mb-2">{product.name}</h1>
              <p className="text-3xl font-black text-primary">৳{product.retailPrice.toLocaleString()}</p>
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-sm text-amber-500 font-medium mt-1">⚡ মাত্র {product.stock}টি স্টকে আছে!</p>
              )}
              {product.stock === 0 && (
                <p className="text-sm text-destructive font-medium mt-1">স্টক শেষ</p>
              )}
            </div>

            {/* Add to Cart — client component */}
            <ResellerAddToCart
              productId={product.productId._id ? product.productId._id.toString() : product.productId.toString()}
              resellerProductId={product._id.toString()}
              name={product.name}
              price={product.retailPrice}
              image={product.images?.[0] || ''}
              stock={product.stock}
              subdomain={subdomain}
              variants={product.productId.variants || []}
            />

            <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-semibold">🚚 ডেলিভারি চার্জ</p>
              <p>ঢাকায়: <strong>৳{reseller.deliveryConfig?.insideDhaka ?? 60}</strong></p>
              <p>ঢাকার বাইরে: <strong>৳{reseller.deliveryConfig?.outsideDhaka ?? 120}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline client component for Add-to-Cart ─────────────────────────────────
import { ResellerAddToCart } from '@/components/reseller/ResellerAddToCart';
