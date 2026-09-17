import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import ResellerOrder from '@/models/ResellerOrder';
import Reseller from '@/models/Reseller';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'reseller') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    await dbConnect();

    const reseller = await Reseller.findOne({ userId: session.user.id });
    if (!reseller) {
      return NextResponse.json({ message: 'Reseller not found' }, { status: 404 });
    }

    const order = await ResellerOrder.findOne({ _id: orderId, resellerId: reseller._id })
      .populate('items.productId')
      .populate('items.resellerProductId')
      .lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching reseller order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
