import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Reseller from '@/models/Reseller';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Reseller ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const reseller = await Reseller.findById(id).select('storeName subdomain logoUrl').lean();

    if (!reseller) {
      // Try searching by userId in case the ID provided is a userId
      const resellerByUser = await Reseller.findOne({ userId: id }).select('storeName subdomain logoUrl').lean();
      if (resellerByUser) {
        return NextResponse.json({
          storeName: resellerByUser.storeName,
          subdomain: resellerByUser.subdomain,
          logoUrl: resellerByUser.logoUrl || null,
        });
      }
      return NextResponse.json({ storeName: null }, { status: 404 });
    }

    return NextResponse.json({
      storeName: reseller.storeName,
      subdomain: reseller.subdomain,
      logoUrl: reseller.logoUrl || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
