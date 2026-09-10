import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Supplier from '@/models/Supplier';
import User from '@/models/User';
import { normalizePhoneNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { 
      name, 
      companyName, 
      phone, 
      email, 
      password, 
      address, 
      businessType, 
      productCategories, 
      supplyCapacity, 
      tradeLicense, 
      description 
    } = body;

    if (!name || !phone || !companyName || !address) {
      return NextResponse.json({ error: 'নাম, প্রতিষ্ঠানের নাম, মোবাইল নম্বর এবং ঠিকানা আবশ্যক' }, { status: 400 });
    }

    await dbConnect();

    const normalizedPhone = normalizePhoneNumber(phone) || phone;
    let targetUserId: string | undefined = undefined;
    let targetEmail: string = email ? email.toLowerCase().trim() : '';

    if (session?.user) {
      // 1. Logged in user applying to become a supplier
      targetUserId = (session.user as any).id;
      targetEmail = targetEmail || session.user.email || '';

      // Check if supplier already registered for this user
      const existingSupplier = await Supplier.findOne({ 
        $or: [
          { userId: targetUserId },
          { phone: normalizedPhone }
        ]
      });

      if (existingSupplier) {
        return NextResponse.json({ error: 'আপনার বা এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি সাপ্লায়ার অ্যাকাউন্ট রয়েছে' }, { status: 400 });
      }

      // Update user role to supplier if normal user
      const currentUserRole = (session.user as any).role;
      if (session.user.email === 'imranshuvo101@gmail.com') {
        await User.findByIdAndUpdate(targetUserId, { role: 'super_admin' });
      } else if (!['admin', 'super_admin', 'manager'].includes(currentUserRole)) {
        await User.findByIdAndUpdate(targetUserId, { role: 'supplier' });
      }
    } else {
      // 2. Guest user registering as a new supplier
      if (!email || !password) {
        return NextResponse.json({ error: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: targetEmail },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
        ]
      });

      if (existingUser) {
        return NextResponse.json({
          error: 'এই ইমেইল অথবা মোবাইল নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগইন করে আবেদন করুন।'
        }, { status: 409 });
      }

      // Create new user account with supplier role
      const newUser = await User.create({
        name,
        email: targetEmail,
        password,
        phone: normalizedPhone,
        addresses: [{
          street: address,
          country: 'Bangladesh',
          isDefault: true
        }],
        role: targetEmail === 'imranshuvo101@gmail.com' ? 'super_admin' : 'supplier',
      });

      targetUserId = newUser._id.toString();
    }

    const newSupplier = await Supplier.create({
      name,
      companyName,
      phone: normalizedPhone,
      email: targetEmail,
      address,
      userId: targetUserId,
      businessType: businessType || 'অন্যান্য',
      productCategories: productCategories || '',
      supplyCapacity: supplyCapacity || '',
      tradeLicense: tradeLicense || '',
      description: description || '',
      status: 'pending',
      currentBalance: 0
    });

    return NextResponse.json({
      success: true,
      message: 'সাপ্লায়ার আবেদন সফলভাবে জমা হয়েছে! আমাদের মার্চেন্ট টিম দ্রুত আপনার সাথে যোগাযোগ করবে।',
      supplier: newSupplier,
    });
  } catch (error: any) {
    console.error('Supplier registration error:', error);
    return NextResponse.json({ error: error.message || 'সার্ভার ত্রুটি ঘটেছে' }, { status: 500 });
  }
}
