import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import Product from '@/models/Product';
import { generateUniqueSlug } from '@/lib/slugify-server';
import { slugify } from '@/lib/slugify';

import GlobalSettings from '@/models/GlobalSettings';

async function getResellerId(userId: string) {
  await dbConnect();
  const reseller = await Reseller.findOne({ userId });
  if (!reseller) throw new Error('Reseller not found');
  return reseller._id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const resellerId = await getResellerId(session.user.id);

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '10');
    const search = sp.get('search') || '';

    // Filter by uploadedBy (since Products store the reseller ID in uploadedBy)
    const query: Record<string, any> = { uploadedBy: resellerId };
    if (search) query.name = { $regex: search, $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create reseller product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const resellerId = await getResellerId(session.user.id);
    const body = await request.json();

    const { name, slug, description, sku, categories, tags, images, attributes, variants, isFeatured, isNewArrival, isPublished, isShared, discountRate } = body;
    let { price, salePrice, purchasePrice, resellerPrice, stock } = body;

    const parsedPrice = Number(price) || 0;
    const parsedSalePrice = salePrice ? Number(salePrice) : undefined;
    const settings = await GlobalSettings.findOne().lean();
    const commissionPct = settings?.platformCommissionRate ?? 10;

    // Automatically calculate resellerPrice (Base purchase price + System Commission %)
    let computedResellerPrice = parsedResellerPrice;
    if (parsedPurchasePrice && parsedPurchasePrice > 0) {
      computedResellerPrice = Math.round(parsedPurchasePrice * (1 + commissionPct / 100));
    }

    // Also calculate for variants if present
    const processedVariants = Array.isArray(variants) ? variants.map((v: any) => {
      const vPurchase = Number(v.purchasePrice) || 0;
      let vReseller = Number(v.resellerPrice) || 0;
      if (vPurchase > 0) {
        vReseller = Math.round(vPurchase * (1 + commissionPct / 100));
      }
      return {
        ...v,
        resellerPrice: vReseller || undefined,
      };
    }) : [];

    const newProduct = await Product.create({
      name,
      slug: uniqueSlug,
      description,
      price: parsedPrice,
      salePrice: parsedSalePrice,
      purchasePrice: parsedPurchasePrice,
      resellerPrice: computedResellerPrice,
      discountRate: parsedDiscountRate,
      sku,
      stock: parsedStock,
      categories: categories || [],
      tags: tags || [],
      images: images || [],
      attributes: attributes || [],
      variants: processedVariants.length > 0 ? processedVariants : (variants || []),
      isFeatured: !!isFeatured,
      isNewArrival: !!isNewArrival,
      isPublished: isPublished !== undefined ? !!isPublished : true,
      isShared: isShared !== undefined ? !!isShared : false,
      uploadedBy: resellerId, // Set reseller ID as the owner
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update reseller product
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const resellerId = await getResellerId(session.user.id);
    
    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const body = await request.json();

    // Support both body.id and query param id
    const targetId = id || body.id;
    if (!targetId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const allowedFields = [
      'name', 'slug', 'description', 'price', 'salePrice', 'purchasePrice', 'discountRate',
      'sku', 'stock', 'categories', 'tags', 'images',
      'attributes', 'variants', 'isFeatured', 'isNewArrival', 'isPublished', 'isShared', 'deliveryCharge'
    ];
    const updateData: any = {};
    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    const settings = await GlobalSettings.findOne().lean();
    const commissionPct = settings?.platformCommissionRate ?? 10;

    if (updateData.purchasePrice !== undefined) {
      const pPrice = Number(updateData.purchasePrice) || 0;
      if (pPrice > 0) {
        updateData.resellerPrice = Math.round(pPrice * (1 + commissionPct / 100));
      }
    }

    if (Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((v: any) => {
        const vPurchase = Number(v.purchasePrice) || 0;
        let vReseller = Number(v.resellerPrice) || 0;
        if (vPurchase > 0) {
          vReseller = Math.round(vPurchase * (1 + commissionPct / 100));
        }
        return {
          ...v,
          resellerPrice: vReseller || undefined,
        };
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: targetId, uploadedBy: resellerId },
      { $set: updateData },
      { new: true }
    );

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const resellerId = await getResellerId(session.user.id);
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const deleted = await Product.findOneAndDelete({ _id: id, uploadedBy: resellerId });
    if (!deleted) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
