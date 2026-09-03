import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import Product from '@/models/Product';
import ResellerProduct from '@/models/ResellerProduct';
import { addProductToReseller } from '@/lib/syncEngine';

async function getResellerId(userId: string) {
  await dbConnect();
  const reseller = await Reseller.findOne({ userId });
  return reseller?._id || null;
}

// GET: Fetch products available for sourcing (Admin or other Resellers' shared products)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resellerId = await getResellerId(session.user.id);
    if (!resellerId) {
      return NextResponse.json({ error: 'Reseller profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    let page = parseInt(searchParams.get('page') || '1', 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get('limit') || '10', 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const search = searchParams.get('search') || '';

    // Query filters:
    // 1. Must be published.
    // 2. uploadedBy is null (Admin) OR (uploadedBy is not this reseller AND isShared is true).
    const query: Record<string, any> = {
      isPublished: true,
      $or: [
        { uploadedBy: null },
        { uploadedBy: { $exists: false } },
        { uploadedBy: { $ne: resellerId }, isShared: true },
      ],
    };

    if (search) {
      const sanitized = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.name = { $regex: sanitized, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    // Find already sourced products by this reseller
    const productIds = products.map((p) => p._id);
    const sourced = await ResellerProduct.find({
      resellerId,
      productId: { $in: productIds },
    }).lean();

    const sourcedMap = new Map(sourced.map((s) => [s.productId.toString(), s]));

    const mappedProducts = products.map((product: any) => {
      const sourcedItem: any = sourcedMap.get(product._id.toString());
      return {
        ...product,
        isSourced: !!sourcedItem,
        sourcedDetails: sourcedItem
          ? {
              _id: sourcedItem._id,
              retailPrice: sourcedItem.retailPrice,
              isPublished: sourcedItem.isPublished,
              syncedAt: sourcedItem.syncedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      products: mappedProducts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add or update a product in the reseller's storefront catalog
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resellerId = await getResellerId(session.user.id);
    if (!resellerId) {
      return NextResponse.json({ error: 'Reseller profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { productId, retailPrice } = body;

    if (!productId || retailPrice === undefined || isNaN(Number(retailPrice)) || Number(retailPrice) <= 0) {
      return NextResponse.json({ error: 'Product ID and a valid retail price are required' }, { status: 400 });
    }

    const result = await addProductToReseller(resellerId.toString(), productId, Number(retailPrice));
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
