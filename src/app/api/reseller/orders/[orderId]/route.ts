import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import ResellerOrder from '@/models/ResellerOrder';
import Reseller from '@/models/Reseller';
import Order from '@/models/Order';

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

export async function PATCH(
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

    const body = await req.json();
    const { customer, internalNote, customerNote } = body;

    const order = await ResellerOrder.findOne({ _id: orderId, resellerId: reseller._id });
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Update customer info if provided
    if (customer) {
      if (customer.name !== undefined) order.customer.name = customer.name;
      if (customer.phone !== undefined) order.customer.phone = customer.phone;
      if (customer.email !== undefined) order.customer.email = customer.email;
      if (customer.address) {
        order.customer.address = {
          street: customer.address.street !== undefined ? customer.address.street : order.customer.address?.street || '',
          city: customer.address.city !== undefined ? customer.address.city : order.customer.address?.city || '',
          division: customer.address.division !== undefined ? customer.address.division : order.customer.address?.division || '',
          zipCode: customer.address.zipCode !== undefined ? customer.address.zipCode : order.customer.address?.zipCode || '',
        };
      }
    }

    // Update notes if provided
    if (internalNote !== undefined) order.internalNote = internalNote;
    if (customerNote !== undefined) order.customerNote = customerNote;

    await order.save();

    // Sync changes to Mother Order if exists
    if (order.motherOrderId) {
      const motherUpdate: any = {};
      if (customer) {
        motherUpdate['shippingAddress.fullName'] = order.customer.name;
        motherUpdate['shippingAddress.phone'] = order.customer.phone;
        if (order.customer.address) {
          motherUpdate['shippingAddress.street'] = order.customer.address.street;
          motherUpdate['shippingAddress.city'] = order.customer.address.city;
          motherUpdate['shippingAddress.state'] = order.customer.address.city;
          motherUpdate['shippingAddress.division'] = order.customer.address.division;
          motherUpdate['shippingAddress.zipCode'] = order.customer.address.zipCode || '0000';
        }
      }
      if (customerNote !== undefined) motherUpdate.customerNote = customerNote;
      
      await Order.findByIdAndUpdate(order.motherOrderId, { $set: motherUpdate });
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error: any) {
    console.error('Error updating reseller order:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
