import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { storeName, subdomain, phone, address, description } = body;

    if (!storeName || !subdomain || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();
    // Validate subdomain format (4-63 lowercase alphanumeric characters or hyphens)
    if (!/^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/.test(cleanSubdomain)) {
      return NextResponse.json({
        error: 'Subdomain must be 4–64 lowercase alphanumeric letters or hyphens, and cannot start/end with a hyphen'
      }, { status: 400 });
    }

    await dbConnect();

    // Check if user is already a reseller
    const existingReseller = await Reseller.findOne({ userId: (session.user as any).id });
    if (existingReseller) {
      return NextResponse.json({ error: 'You already have a reseller account' }, { status: 400 });
    }

    // Check if subdomain is taken
    const subdomainTaken = await Reseller.findOne({ subdomain: cleanSubdomain });
    if (subdomainTaken) {
      return NextResponse.json({ error: 'Subdomain is already taken by another store' }, { status: 400 });
    }

    const newReseller = await Reseller.create({
      userId: (session.user as any).id,
      storeName,
      subdomain: cleanSubdomain,
      description: description || '',
      status: 'pending', // Pending approval by default
      contact: {
        phone,
        address: address || '',
        email: session.user.email || '',
      },
    });

    // Update user role to reseller only if they don't have an existing privileged role
    const currentUserRole = (session.user as any).role;
    const currentUserEmail = session.user.email;

    if (currentUserEmail === 'imranshuvo101@gmail.com') {
      await User.findByIdAndUpdate((session.user as any).id, { role: 'super_admin' });
    } else if (!['admin', 'super_admin', 'manager'].includes(currentUserRole)) {
      await User.findByIdAndUpdate((session.user as any).id, { role: 'reseller' });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Store is pending approval.',
      reseller: newReseller,
    });
  } catch (error: any) {
    if (error.code === 11000 && (error.keyPattern?.subdomain || error.message?.includes('subdomain'))) {
      return NextResponse.json({ error: 'Subdomain is already taken by another store' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
