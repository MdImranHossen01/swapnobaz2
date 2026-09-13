import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import type { Metadata } from 'next';
import { NavbarSelector, HeroSelector } from '@/components/templates/Registry';
import { FooterSelector } from '@/components/templates/ServerRegistry';
import { SettingsProvider } from '@/components/SettingsProvider';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { ProductCarouselSection } from '@/components/storefront/ProductCarouselSection';
import { FreeDeliveryBanner } from '@/components/storefront/FreeDeliveryBanner';

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
  const rawProducts = await ResellerProduct.find({
    resellerId: reseller._id,
    isPublished: true,
    isAvailableOnMother: true,
    stock: { $gt: 0 },
  })
    .populate({
      path: 'productId',
      populate: [
        { path: 'categories' },
        { path: 'brand' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const products = (rawProducts || []).map((rp: any) => {
    const parent = rp.productId || {};
    const finalPrice = typeof rp.retailPrice === 'number' && !isNaN(rp.retailPrice) 
      ? rp.retailPrice 
      : (typeof parent.price === 'number' ? parent.price : 0);
    return {
      _id: rp._id.toString(),
      productId: parent._id ? parent._id.toString() : rp.productId?.toString(),
      name: rp.name || parent.name || 'Product',
      slug: rp.slug || parent.slug,
      price: finalPrice,
      salePrice: finalPrice,
      retailPrice: rp.retailPrice,
      images: rp.images?.length > 0 ? rp.images : parent.images || [],
      description: parent.description,
      categories: parent.categories || [],
      brand: parent.brand || null,
      stock: rp.stock ?? parent.stock ?? 0,
      isPublished: rp.isPublished,
      isNewArrival: Boolean(parent.isNewArrival),
      isFeatured: Boolean(parent.isFeatured),
      isFlashSale: Boolean(parent.isFlashSale),
      isTrending: Boolean(parent.isTrending),
      rating: parent.rating || 5,
      numReviews: parent.numReviews || 0,
      variants: parent.variants || [],
      createdAt: rp.createdAt || parent.createdAt,
    };
  });

  // Extract unique categories from reseller's products
  const categoryMap = new Map<string, any>();
  products.forEach((p: any) => {
    if (Array.isArray(p.categories)) {
      p.categories.forEach((cat: any) => {
        if (cat && (cat._id || cat.slug)) {
          const catId = cat._id ? cat._id.toString() : cat.slug;
          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, {
              _id: catId,
              name: cat.name || 'Category',
              slug: cat.slug || catId,
              image: cat.image || '',
              icon: cat.icon || '',
              parentCategory: cat.parentCategory || null,
            });
          }
        }
      });
    }
  });
  const storeCategories = Array.from(categoryMap.values());

  // Filtered product collections
  const featuredProducts = products.filter((p: any) => p.isFeatured);
  const flashSaleProducts = products.filter((p: any) => p.isFlashSale || (p.salePrice && p.price && p.salePrice < p.price));
  const trendingProducts = products.filter((p: any) => p.isTrending || p.rating >= 4);
  const newArrivals = products.filter((p: any) => p.isNewArrival);

  // Group products by category for Category Carousels
  const categorySections = storeCategories.map((cat: any) => {
    const catProducts = products.filter((p: any) =>
      p.categories?.some((c: any) => (c._id ? c._id.toString() : (c.slug || c.toString())) === cat._id || (c.slug && c.slug === cat.slug))
    );
    return {
      category: cat,
      products: catProducts,
    };
  }).filter((section) => section.products.length > 0);

  const storeName = reseller.storeName;
  const logo = reseller.logoUrl;
  const description = reseller.description;
  const deliveryInside = reseller.deliveryConfig?.insideDhaka ?? 60;
  const deliveryOutside = reseller.deliveryConfig?.outsideDhaka ?? 120;
  const freeDeliveryThreshold = reseller.deliveryConfig?.freeDeliveryThreshold || 0;

  const settingsData = {
    brandName: storeName,
    logoUrl: logo,
    freeDeliveryThreshold,
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

  const { default: Banner } = await import('@/models/Banner');
  const resellerBanners = await Banner.find({
    resellerId: reseller._id,
    isActive: true,
  }).sort({ order: 1, createdAt: -1 }).lean();

  const dynamicBanners = resellerBanners.length > 0
    ? resellerBanners.map((b: any) => ({
        title: b.title || storeName,
        subtitle: description || `Shop at ${storeName}`,
        image: b.image,
        link: b.link || b.primaryBtnLink || '/shop',
        primaryBtnText: b.primaryBtnText || 'সব পণ্য দেখুন',
        primaryBtnLink: b.link || b.primaryBtnLink || '/shop',
        secondaryBtnText: `🚚 ঢাকার ভেতরে ৳${deliveryInside} | 📦 ঢাকার বাইরে ৳${deliveryOutside}`,
        secondaryBtnLink: '/shop'
      }))
    : [
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

  const themeOverrides = (reseller.themeOverrides as any) || {};
  const navStyle = themeOverrides.navbar || 'v1';
  const footerStyle = themeOverrides.footer || 'v1';
  const heroStyle = themeOverrides.hero || 'v1';
  const cardStyle = themeOverrides.productCard || 'v1';
  const categoryStyle = themeOverrides.categories || 'v1';
  const layout = themeOverrides.layout || 'v1';

  return (
    <SettingsProvider settings={settingsData}>
      <div className="min-h-screen bg-background font-sans flex flex-col">
        {/* Free Delivery Announcement Bar if configured */}
        <FreeDeliveryBanner settings={settingsData} />

        {/* Store Header */}
        <NavbarSelector style={navStyle} initialCategories={storeCategories} />

        {/* Hero Slider */}
        <HeroSelector style={heroStyle} banners={dynamicBanners} layout={layout} />

        {/* Categories Showcase */}
        {storeCategories.length > 0 && (
          <CategoryShowcase categories={storeCategories} style={categoryStyle} />
        )}

        {/* Empty State */}
        {products.length === 0 ? (
          <section className="container mx-auto px-4 py-20 text-center text-muted-foreground">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium">এই স্টোরে এখনো কোনো পণ্য নেই</p>
          </section>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 1. Featured Products Carousel */}
            {featuredProducts.length > 0 && (
              <ProductCarouselSection
                title="Featured Collections"
                description="Explore our best-selling and most popular products hand-picked just for you."
                products={featuredProducts}
                viewAllLink="/shop?filter=featured"
                bgColor="bg-background"
                cardStyle={cardStyle}
                layout={layout}
              />
            )}

            {/* 2. Flash Sale Carousel */}
            {flashSaleProducts.length > 0 && (
              <ProductCarouselSection
                title="Flash Sale"
                products={flashSaleProducts}
                viewAllLink="/shop?filter=sale"
                isFlashSale={true}
                bgColor="bg-primary/5"
                cardStyle={cardStyle}
                layout={layout}
              />
            )}

            {/* 3. Trending Products Carousel */}
            {trendingProducts.length > 0 && (
              <ProductCarouselSection
                title="Trending Now"
                description="The most popular items according to our community ratings and reviews."
                products={trendingProducts}
                viewAllLink="/shop?filter=trending"
                bgColor="bg-muted/20"
                cardStyle={cardStyle}
                layout={layout}
              />
            )}

            {/* 4. Category-Wise Carousels (e.g. Women, Men, Electronics, etc.) */}
            {categorySections.map((section: any, idx: number) => (
              <ProductCarouselSection
                key={section.category._id}
                title={section.category.name}
                description={`Explore our curated collection of ${section.category.name} products.`}
                products={section.products}
                viewAllLink={`/shop?category=${encodeURIComponent(section.category.slug)}`}
                bgColor={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                cardStyle={cardStyle}
                layout={layout}
              />
            ))}

            {/* 5. New Arrivals Carousel */}
            {newArrivals.length > 0 && (
              <ProductCarouselSection
                title="New Arrivals"
                description="Discover the latest additions to our collection. Stay ahead of the curve."
                products={newArrivals}
                viewAllLink="/shop?filter=new"
                bgColor="bg-background"
                cardStyle={cardStyle}
                layout={layout}
              />
            )}

            {/* 6. General / All Products Carousel (Fallback if no category or promo filters exist) */}
            {categorySections.length === 0 && (
              <ProductCarouselSection
                title="আমাদের পণ্য"
                description={`Explore all products from ${storeName}.`}
                products={products}
                viewAllLink="/shop"
                bgColor="bg-background"
                cardStyle={cardStyle}
                layout={layout}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <FooterSelector style={footerStyle} />
      </div>
    </SettingsProvider>
  );
}

