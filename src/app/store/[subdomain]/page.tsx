import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { NavbarSelector, HeroSelector, ProductCardSelector } from '@/components/templates/Registry';
import { FooterSelector } from '@/components/templates/ServerRegistry';
import { SettingsProvider } from '@/components/SettingsProvider';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ subdomain: string }>;
}

async function getReseller(subdomain: string) {
  await dbConnect();
  return Reseller.findOne({ subdomain, status: 'active' }).lean();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const reseller = await getReseller(subdomain);
  if (!reseller) return { title: 'Store Not Found' };
  return {
    title: reseller.storeName,
    description: reseller.description || `Shop at ${reseller.storeName}`,
    icons: { icon: reseller.faviconUrl || reseller.logoUrl || '/favicon.ico' },
    openGraph: {
      title: reseller.storeName,
      description: reseller.description || '',
      images: reseller.logoUrl ? [reseller.logoUrl] : [],
    },
  };
}

export default async function ResellerStorePage({ params }: Props) {
  const { subdomain } = await params;
  const reseller = await getReseller(subdomain);
  if (!reseller) notFound();

  // Load products for this reseller storefront
  const { default: ResellerProduct } = await import('@/models/ResellerProduct');
  await dbConnect();
  const products = await ResellerProduct.find({
    resellerId: reseller._id,
    isPublished: true,
    isAvailableOnMother: true,
    stock: { $gt: 0 },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const storeName = reseller.storeName;
  const logo = reseller.logoUrl;
  const description = reseller.description;
  const deliveryInside = reseller.deliveryConfig?.insideDhaka ?? 60;
  const deliveryOutside = reseller.deliveryConfig?.outsideDhaka ?? 120;

  const settingsData = {
    brandName: storeName,
    logoUrl: logo,
    contact: {
      email: reseller.contact?.email,
      phone: reseller.contact?.phone,
      address: reseller.contact?.address,
    },
    socialLinks: {
      facebook: reseller.socialLinks?.facebook,
      whatsapp: reseller.socialLinks?.whatsapp,
    }
  };

  const dynamicBanners = [
    {
      title: storeName,
      subtitle: description || `Shop at ${storeName}`,
      image: logo || undefined,
      link: '/shop',
      primaryBtnText: 'সব পণ্য দেখুন',
      primaryBtnLink: '/shop',
      secondaryBtnText: `🚚 ঢাকার ভেতরে ৳${deliveryInside} | 📦 ঢাকার বাইরে ৳${deliveryOutside}`,
      secondaryBtnLink: '/shop'
    }
  ];

  const navStyle = reseller.themeOverrides?.navbar || 'v1';
  const footerStyle = reseller.themeOverrides?.footer || 'v1';
  const heroStyle = reseller.themeOverrides?.hero || 'v1';
  const cardStyle = reseller.themeOverrides?.productCard || 'v1';

  return (
    <SettingsProvider settings={settingsData}>
      <div className="min-h-screen bg-background font-sans">
        {/* Store Header */}
        <NavbarSelector style={navStyle} />

        {/* Hero */}
        <HeroSelector style={heroStyle} banners={dynamicBanners} />

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-black mb-8">আমাদের পণ্য</h2>
          {products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-lg font-medium">এই স্টোরে এখনো কোনো পণ্য নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <ProductCardSelector
                  key={p._id.toString()}
                  style={cardStyle}
                  product={p}
                  isFlashSale={false}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <FooterSelector style={footerStyle} />
      </div>
    </SettingsProvider>
  );
}
