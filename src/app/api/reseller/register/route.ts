import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import User from '@/models/User';
import { normalizePhoneNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { storeName, subdomain, phone, address, description, name, email, password } = body;

    if (!storeName || !subdomain || !phone) {
      return NextResponse.json({ error: 'স্টোরের নাম, সাবডোমেন এবং মোবাইল নম্বর আবশ্যক' }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();
    // Validate subdomain format (4-63 lowercase alphanumeric characters or hyphens)
    if (!/^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/.test(cleanSubdomain)) {
      return NextResponse.json({
        error: 'সাবডোমেন ৪ থেকে ৬৩ অক্ষরের ইংরেজি বর্ণ, সংখ্যা বা হাইফেন (-) হতে হবে'
      }, { status: 400 });
    }

    await dbConnect();

    // Check if subdomain is already taken
    const subdomainTaken = await Reseller.findOne({ subdomain: cleanSubdomain });
    if (subdomainTaken) {
      return NextResponse.json({ error: 'এই সাবডোমেনটি ইতোমধ্যে অন্য কেউ ব্যবহার করছে' }, { status: 400 });
    }

    let targetUserId: string;
    let targetEmail: string;

    if (session?.user) {
      // 1. Logged in user applying to become a reseller
      targetUserId = (session.user as any).id;
      targetEmail = session.user.email || '';

      // Check if user already has a reseller profile
      const existingReseller = await Reseller.findOne({ userId: targetUserId });
      if (existingReseller) {
        return NextResponse.json({ error: 'আপনার ইতোমধ্যে একটি রিসেলার অ্যাকাউন্ট রয়েছে' }, { status: 400 });
      }

      // Update user role to reseller if normal user
      const currentUserRole = (session.user as any).role;
      if (targetEmail === 'imranshuvo101@gmail.com') {
        await User.findByIdAndUpdate(targetUserId, { role: 'super_admin' });
      } else if (!['admin', 'super_admin', 'manager'].includes(currentUserRole)) {
        await User.findByIdAndUpdate(targetUserId, { role: 'reseller' });
      }
    } else {
      // 2. Guest user registering as a new reseller
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = normalizePhoneNumber(phone) || phone;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: normalizedEmail },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
        ]
      });

      if (existingUser) {
        return NextResponse.json({
          error: 'এই ইমেইল অথবা মোবাইল নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করে আবেদন করুন।'
        }, { status: 409 });
      }

      // Create new user with reseller role
      const newUser = await User.create({
        name,
        email: normalizedEmail,
        password,
        phone: normalizedPhone,
        addresses: [{
          street: address || '',
          country: 'Bangladesh',
          isDefault: true
        }],
        role: normalizedEmail === 'imranshuvo101@gmail.com' ? 'super_admin' : 'reseller',
      });

      targetUserId = newUser._id.toString();
      targetEmail = normalizedEmail;
    }

    const newReseller = await Reseller.create({
      userId: targetUserId,
      storeName,
      subdomain: cleanSubdomain,
      description: description || '',
      status: 'pending', // Pending approval by default
      contact: {
        phone,
        address: address || '',
        email: targetEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'নিবন্ধন সফল হয়েছে! স্টোরটি পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।',
      reseller: newReseller,
    });
  } catch (error: any) {
    if (error.code === 11000 && (error.keyPattern?.subdomain || error.message?.includes('subdomain'))) {
      return NextResponse.json({ error: 'এই সাবডোমেনটি ইতোমধ্যে অন্য কেউ ব্যবহার করছে' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'সার্ভার ত্রুটি ঘটেছে' }, { status: 500 });
  }
}
