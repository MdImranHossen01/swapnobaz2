import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import ResellerWalletTransaction from '@/models/ResellerWalletTransaction';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resellerId = searchParams.get('resellerId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    await connectToDatabase();

    const matchQuery: any = {};
    if (resellerId && resellerId !== 'all') {
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(resellerId)) {
        return NextResponse.json({ message: 'Invalid reseller ID format' }, { status: 400 });
      }
      matchQuery.resellerId = resellerId;
    }
    if (from || to) {
      matchQuery.createdAt = {};
      if (from) matchQuery.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = toDate;
      }
    }

    const transactions = await ResellerWalletTransaction.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({
        path: 'resellerId',
        select: 'storeName subdomain userId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .lean();

    const formattedTx = (transactions || []).map((tx: any) => ({
      _id: tx._id,
      date: tx.createdAt,
      resellerName: tx.resellerId?.userId?.name || 'Reseller',
      storeName: tx.resellerId?.storeName || 'Store',
      subdomain: tx.resellerId?.subdomain || '',
      type: tx.type, // 'credit' (commission) or 'debit' (withdrawal/payout)
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      description: tx.description || 'Commission credit',
      status: tx.status || 'Completed'
    }));

    return NextResponse.json({ transactions: formattedTx });
  } catch (error) {
    console.error('Reseller Commission API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
