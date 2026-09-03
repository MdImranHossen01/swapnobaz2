import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
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
    await getResellerId(session.user.id);
    return NextResponse.json({ bills: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
