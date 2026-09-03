import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !session.user || !['admin', 'super_admin', 'manager', 'reseller'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const queryConditions: any[] = [
      { stock: { $lt: 5 } },
      { 'variants.stock': { $lt: 5 } }
    ];

    if (userRole === 'reseller') {
      const Reseller = (await import('@/models/Reseller')).default;
      const reseller = await Reseller.findOne({ userId: (session.user as any).id }).lean();
      if (reseller) {
        queryConditions.push({ uploadedBy: reseller._id });
      }
    }

    const products = await Product.find({
      $or: [
        { stock: { $lt: 5 } },
        { 'variants.stock': { $lt: 5 } }
      ]
    }).lean();

    const lowStockItems: any[] = [];

    for (const product of products) {
      // Check Base/Central Stock
      if ((product.stock ?? 0) < 5) {
        lowStockItems.push({
          id: `${product._id}-base`,
          productId: product._id,
          name: product.name,
          color: null,
          size: null,
          location: 'Main Inventory',
          stock: product.stock ?? 0,
        });
      }

      // Check Variants
      if (product.variants && Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if ((variant.stock ?? 0) < 5) {
            lowStockItems.push({
              id: `${product._id}-variant-${variant._id || variant.sku}`,
              productId: product._id,
              name: product.name,
              color: variant.color || null,
              size: variant.size || null,
              location: 'Variant Stock',
              stock: variant.stock ?? 0,
            });
          }
        }
      }
    }

    lowStockItems.sort((a, b) => a.stock - b.stock);

    return NextResponse.json({ items: lowStockItems }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching low stock:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
