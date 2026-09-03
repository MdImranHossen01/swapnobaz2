import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Reseller from '@/models/Reseller';

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
    const searchParams = request.nextUrl.searchParams;
    
    let page = parseInt(searchParams.get('page') || '1', 10);
    if (isNaN(page) || page < 1) page = 1;
    
    let limit = parseInt(searchParams.get('limit') || '20', 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: Record<string, any> = { resellerId };
    if (status) query.status = status;
    if (search) {
      const sanitizedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { shortId: { $regex: sanitizedSearch, $options: 'i' } },
        { 'customer.phone': { $regex: sanitizedSearch, $options: 'i' } },
        { 'customer.name': { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resellerId = await getResellerId(session.user.id);
    const { orderId, status } = await request.json();

    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return NextResponse.json({ error: 'Missing or malformed orderId' }, { status: 400 });
    }

    const validStatuses = ['Order Placed', 'Confirmed', 'Paid', 'Ready for Delivery', 'Released for Delivery', 'Cancelled', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid or unsupported status' }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, resellerId },
      { $set: { status } },
      { new: true }
    );

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
