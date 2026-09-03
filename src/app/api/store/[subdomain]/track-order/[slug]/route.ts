import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import ResellerOrder from '@/models/ResellerOrder';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string; slug: string }> }
) {
  try {
    const { subdomain, slug } = await params;
    if (!subdomain || !slug) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const orderId = slug.trim().replace(/^#/, '').toUpperCase();

    await dbConnect();
    const reseller = await Reseller.findOne({ subdomain, status: 'active' }).lean();
    if (!reseller) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    const order = await ResellerOrder.findOne({
      resellerId: reseller._id,
      shortId: orderId,
    }).lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Mask sensitive info for public order tracking
    const maskedOrder = {
      _id: order._id,
      shortId: order.shortId,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      paymentMethod: order.paymentMethod,
      items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        retailPrice: item.retailPrice,
        color: item.color,
        size: item.size,
      })),
      shippingDetails: {
        name: order.customer?.name 
          ? order.customer.name.split(' ')[0] + ' ***' 
          : 'N/A',
        phone: (order.customer?.phone && /^(\d{3})\d+(\d{4})$/.test(order.customer.phone)) ? 
          order.customer.phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2') : 
          'N/A',
        address: order.customer?.address?.city ? `${order.customer.address.city}, Bangladesh` : 'N/A',
        courierName: (order as any).shippingDetails?.courierName,
        trackingUrl: (order as any).shippingDetails?.trackingUrl,
        courierStatus: (order as any).shippingDetails?.courierStatus,
      }
    };

    return NextResponse.json(maskedOrder);
  } catch (error) {
    console.error('[Reseller Public Order Tracking API]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
