import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import ResellerProduct from '@/models/ResellerProduct';
import ResellerOrder from '@/models/ResellerOrder';
import ResellerWalletTransaction from '@/models/ResellerWalletTransaction';

function generateShortId() {
  return 'RS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

/**
 * POST /api/store/[subdomain]/orders
 * Places an order on a reseller's storefront.
 * Calculates commissions and queues the order for Mother routing.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;
    await dbConnect();

    const reseller = await Reseller.findOne({ subdomain, status: 'active' });
    if (!reseller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    const { customer, items, paymentMethod, notes, deliveryArea } = body;

    if (!customer?.name || !customer?.phone || !customer?.address?.street) {
      return NextResponse.json({ error: 'Customer details incomplete' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Fetch all ResellerProducts in a single query with populated productId
    const resellerProductIds = items.map((i: any) => i.resellerProductId).filter(Boolean);
    const rps = await ResellerProduct.find({
      _id: { $in: resellerProductIds },
      resellerId: reseller._id,
      isPublished: true,
      isAvailableOnMother: true,
    }).populate('productId');

    const rpMap = new Map(rps.map(rp => [rp._id.toString(), rp]));

    // Validate each item against ResellerProduct and calculate commission
    const validatedItems = [];
    let totalCommission = 0;
    const uploaderItemsMap = new Map<string, any[]>();

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) continue; // Reject non-positive or invalid quantity

      const rp = rpMap.get(String(item.resellerProductId));
      if (!rp) continue; // Skip unavailable products

      if (rp.stock < qty) {
        return NextResponse.json({ error: `Requested quantity for "${rp.name}" exceeds available stock. Only ${rp.stock} left.` }, { status: 400 });
      }

      const commission = (rp.retailPrice - rp.purchasePrice) * qty;
      totalCommission += commission;

      const productDoc = rp.productId as any;
      const uploaderId = productDoc?.uploadedBy ? productDoc.uploadedBy.toString() : null;

      const validatedItem = {
        resellerProductId: rp._id,
        productId: productDoc?._id || rp.productId,
        name: rp.name,
        quantity: qty,
        retailPrice: rp.retailPrice,
        purchasePrice: rp.purchasePrice,
        image: rp.images?.[0],
        color: item.color || undefined,
        size: item.size || undefined,
      };

      validatedItems.push(validatedItem);

      // If product belongs to another reseller, group it for their fulfillment order
      if (uploaderId && uploaderId !== reseller._id.toString()) {
        if (!uploaderItemsMap.has(uploaderId)) {
          uploaderItemsMap.set(uploaderId, []);
        }
        const uploaderRp = await ResellerProduct.findOne({
          resellerId: uploaderId,
          productId: productDoc?._id || rp.productId,
        }).lean();

        uploaderItemsMap.get(uploaderId)!.push({
          ...validatedItem,
          retailPrice: rp.purchasePrice, // Cost price of reseller A is the selling price of uploader B
          purchasePrice: uploaderRp?.purchasePrice || rp.purchasePrice, // uploader's true cost price, falling back to reseller A's cost price
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items found' }, { status: 400 });
    }

    // Recompute subtotal, deliveryCharge, and totalAmount
    const calculatedSubtotal = validatedItems.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0);

    const insideCharge = reseller.deliveryConfig?.insideDhaka ?? 60;
    const outsideCharge = reseller.deliveryConfig?.outsideDhaka ?? 120;
    const freeThreshold = reseller.deliveryConfig?.freeDeliveryThreshold ?? 0;

    let calculatedDeliveryCharge = deliveryArea === 'inside' ? insideCharge : outsideCharge;
    if (freeThreshold > 0 && calculatedSubtotal >= freeThreshold) {
      calculatedDeliveryCharge = 0;
    }

    const calculatedTotalAmount = calculatedSubtotal + calculatedDeliveryCharge;

    const shortId = generateShortId();

    const mongoose = (await import('mongoose')).default;
    const sessionConn = await mongoose.startSession();
    sessionConn.startTransaction();

    try {
      const [order] = await ResellerOrder.create([{
        resellerId: reseller._id,
        customer,
        items: validatedItems,
        subtotal: calculatedSubtotal,
        deliveryCharge: calculatedDeliveryCharge,
        totalAmount: calculatedTotalAmount,
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: 'Pending',
        status: 'Order Placed',
        resellerCommission: totalCommission,
        commissionStatus: 'pending',
        internalNote: notes || '',
        shortId,
      }], { session: sessionConn });

      // Update reseller stats (atomic)
      await Reseller.findByIdAndUpdate(reseller._id, {
        $inc: { totalOrders: 1, totalRevenue: calculatedTotalAmount },
      }, { session: sessionConn });

      // Create pending commission ledger entry
      await ResellerWalletTransaction.create([{
        resellerId: reseller._id,
        type: 'commission_earned',
        amount: totalCommission,
        orderId: order._id,
        description: `Commission from order ${shortId}`,
        status: 'pending',
      }], { session: sessionConn });

      // Create Fulfillment Orders for other resellers who uploaded these products
      let fIndex = 1;
      for (const [uploaderId, fItems] of uploaderItemsMap.entries()) {
        const uploaderSubtotal = fItems.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0);
        const uploaderCommission = fItems.reduce((sum, item) => sum + (item.retailPrice - item.purchasePrice) * item.quantity, 0);

        const [fOrder] = await ResellerOrder.create([{
          resellerId: uploaderId,
          customer,
          items: fItems,
          subtotal: uploaderSubtotal,
          deliveryCharge: 0,
          totalAmount: uploaderSubtotal,
          paymentMethod: 'COD',
          paymentStatus: 'Pending',
          status: 'Order Placed',
          resellerCommission: uploaderCommission,
          commissionStatus: 'pending',
          internalNote: `Fulfillment for Order ${shortId}`,
          shortId: `${shortId}-F${fIndex}`,
        }], { session: sessionConn });

        fIndex++;

        await Reseller.findByIdAndUpdate(uploaderId, {
          $inc: { totalOrders: 1, totalRevenue: uploaderSubtotal },
        }, { session: sessionConn });

        await ResellerWalletTransaction.create([{
          resellerId: uploaderId,
          type: 'commission_earned',
          amount: uploaderCommission,
          orderId: fOrder._id,
          description: `Fulfillment commission from order ${shortId}`,
          status: 'pending',
        }], { session: sessionConn });
      }

      await sessionConn.commitTransaction();
      sessionConn.endSession();

      return NextResponse.json({
        success: true,
        orderId: order._id.toString(),
        shortId,
        message: 'Order placed successfully',
      });
    } catch (txnError) {
      await sessionConn.abortTransaction();
      sessionConn.endSession();
      throw txnError;
    }
  } catch (error: any) {
    console.error('[Reseller Order API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/store/[subdomain]/orders
 * Returns order status for a customer (by phone + shortId).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  const { searchParams } = request.nextUrl;
  const shortId = searchParams.get('shortId');
  const phone = searchParams.get('phone');

  if (!shortId || !phone) {
    return NextResponse.json({ error: 'shortId and phone required' }, { status: 400 });
  }

  await dbConnect();
  const reseller = await Reseller.findOne({ subdomain });
  if (!reseller) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const order = await ResellerOrder.findOne({
    resellerId: reseller._id,
    shortId,
    'customer.phone': phone,
  }).lean();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({
    shortId: order.shortId,
    status: order.status,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    shippingDetails: order.shippingDetails,
  });
}
