'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Building2, 
  Loader2, 
  CheckCircle2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Sparkles, 
  Package, 
  Layers, 
  FileText,
  Boxes
} from 'lucide-react';
import { toast } from 'sonner';

const createSchema = (isLoggedIn: boolean) => z.object({
  name: z.string().min(2, 'প্রতিনিধির নাম আবশ্যক'),
  companyName: z.string().min(3, 'প্রতিষ্ঠানের নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  email: isLoggedIn ? z.string().optional() : z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  password: isLoggedIn ? z.string().optional() : z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  phone: z.string().min(11, '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন'),
  address: z.string().min(5, 'অফিস বা ওয়্যারহাউসের ঠিকানা লিখুন'),
  businessType: z.string().min(1, 'ব্যবসার ধরন নির্বাচন করুন'),
  productCategories: z.string().min(2, 'পণ্যের ধরন বা ক্যাটাগরি উল্লেখ করুন'),
  supplyCapacity: z.string().optional(),
  tradeLicense: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export default function SupplierRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = createSchema(isLoggedIn);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      businessType: 'ফ্যাক্টরি / প্রস্তুতকারক',
      productCategories: '',
      supplyCapacity: '১০০০ - ৫০০০ পিস/মাস',
      tradeLicense: '',
      description: ''
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        companyName: values.companyName,
        phone: values.phone,
        address: values.address,
        businessType: values.businessType,
        productCategories: values.productCategories,
        supplyCapacity: values.supplyCapacity || '',
        tradeLicense: values.tradeLicense || '',
        description: values.description || '',
      };

      if (!isLoggedIn) {
        payload.email = values.email;
        payload.password = values.password;
      } else {
        payload.email = session?.user?.email;
      }

      const res = await fetch('/api/supplier/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success('সাপ্লায়ার আবেদন সফলভাবে জমা হয়েছে!');

        // If guest registered, attempt automatic background signIn
        if (!isLoggedIn && values.email && values.password) {
          try {
            await signIn('credentials', {
              email: values.email,
              password: values.password,
              redirect: false,
            });
          } catch (e) {
            console.error('Auto login error:', e);
          }
        }
      } else {
        toast.error(data.error || 'আবেদন জমা দিতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সংযোগ ত্রুটি, অনুগ্রহ করে পুনরায় চেষ্টা করুন');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20 font-sans">
        <Card className="max-w-md w-full text-center border-border shadow-2xl bg-card">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="h-16 w-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">আবেদন জমা হয়েছে!</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              আপনার সাপ্লায়ার পার্টনারশিপ আবেদন সফলভাবে পর্যালোচনায় পাঠানো হয়েছে। আমাদের মার্চেন্ট টিম আপনার ক্যাটালগ ও তথ্য যাচাই করে অতি দ্রুত আপনার সাথে যোগাযোগ করবে।
            </CardDescription>
            <div className="pt-2 flex flex-col gap-2">
              <Button onClick={() => router.push('/supplier-program')} className="w-full font-bold">
                সাপ্লায়ার প্রোগ্রাম নির্দেশিকা
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                হোমপেজে ফিরে যান
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-muted/20 font-sans">
      <Card className="max-w-2xl w-full border-border/80 shadow-2xl bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="h-12 w-12 bg-secondary text-primary rounded-2xl flex items-center justify-center mx-auto border border-border">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            সাপ্লায়ার / মার্চেন্ট হিসেবে আবেদন করুন
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-lg mx-auto">
            আপনার ফ্যাক্টরি বা হোলসেল পণ্য হাজারো ড্রপশিপিং রিসেলারের মাধ্যমে দেশব্যাপী বিক্রি করুন
          </CardDescription>

          {isLoggedIn && session?.user && (
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mt-1">
              <Sparkles className="h-3.5 w-3.5" />
              লগইন করা অ্যাকাউন্ট: {session.user.name || session.user.email}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* 1. Account Details */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                যোগাযোগের তথ্য ও প্রতিনিধি
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">প্রতিনিধির পুরো নাম *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('name')} placeholder="আপনার নাম" className="pl-9" />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message as string}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">মোবাইল নম্বর *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('phone')} placeholder="01XXXXXXXXX" type="tel" className="pl-9" />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message as string}</p>
                  )}
                </div>
              </div>

              {!isLoggedIn && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">অফিসিয়াল ইমেইল *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input {...form.register('email')} type="email" placeholder="merchant@company.com" className="pl-9" />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">পাসওয়ার্ড *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input {...form.register('password')} type="password" placeholder="কমপক্ষে ৬ অক্ষর" className="pl-9" />
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">{form.formState.errors.password.message as string}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Company / Business Information */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                কোম্পানি ও ব্যবসার বিবরণ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">প্রতিষ্ঠান / ব্র্যান্ডের নাম *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('companyName')} placeholder="যেমন: এপেক্স টেক্সটাইলস" className="pl-9" />
                  </div>
                  {form.formState.errors.companyName && (
                    <p className="text-xs text-destructive">{form.formState.errors.companyName.message as string}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ব্যবসার ধরন *</Label>
                  <Select 
                    defaultValue="ফ্যাক্টরি / প্রস্তুতকারক" 
                    onValueChange={(val) => form.setValue('businessType', val || 'ফ্যাক্টরি / প্রস্তুতকারক')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ব্যবসার ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ফ্যাক্টরি / প্রস্তুতকারক">ফ্যাক্টরি / প্রস্তুতকারক (Manufacturer)</SelectItem>
                      <SelectItem value="হোলসেলার / ডিস্ট্রিবিউটর">হোলসেলার / ডিস্ট্রিবিউটর (Wholesaler)</SelectItem>
                      <SelectItem value="ইম্পোর্টার / আমদানিকারক">ইম্পোর্টার / আমদানিকারক (Importer)</SelectItem>
                      <SelectItem value="ব্র্যান্ড ওনার">ব্র্যান্ড ওনার (Brand Owner)</SelectItem>
                      <SelectItem value="অন্যান্য">অন্যান্য (Other)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">পণ্যের ধরন / ক্যাটাগরি *</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('productCategories')} placeholder="যেমন: টি-শার্ট, জুতা, কসমেটিক্স" className="pl-9" />
                  </div>
                  {form.formState.errors.productCategories && (
                    <p className="text-xs text-destructive">{form.formState.errors.productCategories.message as string}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">মাসিক সরবরাহ ক্ষমতা (Supply Capacity)</Label>
                  <Select 
                    defaultValue="১০০০ - ৫০০০ পিস/মাস" 
                    onValueChange={(val) => form.setValue('supplyCapacity', val || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="সাপ্লাই ক্ষমতা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="১০০ - ৫০০ পিস/মাস">১০০ - ৫০০ পিস/মাস</SelectItem>
                      <SelectItem value="৫০০ - ১০০০ পিস/মাস">৫০০ - ১০০০ পিস/মাস</SelectItem>
                      <SelectItem value="১০০০ - ৫০০০ পিস/মাস">১০০০ - ৫০০০ পিস/মাস</SelectItem>
                      <SelectItem value="৫০০০+ পিস/মাস">৫০০০+ পিস/মাস (বাল্ক ক্যাপাসিটি)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('tradeLicense')} placeholder="TRAD/DNCC/..." className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">অফিস / ওয়্যারহাউসের পূর্ণ ঠিকানা *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('address')} placeholder="রোড, এলাকা, থানা, জেলা" className="pl-9" />
                  </div>
                  {form.formState.errors.address && (
                    <p className="text-xs text-destructive">{form.formState.errors.address.message as string}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">আপনার পণ্য বা ব্যবসা সম্পর্কে অতিরিক্ত তথ্য (ঐচ্ছিক)</Label>
                <Textarea {...form.register('description')} placeholder="আপনার বর্তমান পণ্যের তালিকা, রেট বা স্পেশাল কোনো প্রস্তাব থাকলে লিখুন..." rows={2} />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full font-bold text-base py-6 shadow-md hover:shadow-lg transition-all">
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  আবেদন প্রক্রিয়াধীন...
                </>
              ) : (
                'সাপ্লায়ার হিসেবে আবেদন জমা দিন'
              )}
            </Button>
          </form>
        </CardContent>

        {!isLoggedIn && (
          <CardFooter className="flex justify-center border-t border-border/40 pt-4 text-xs text-muted-foreground">
            আগে থেকেই কি আপনার স্বপ্নবাজ অ্যাকাউন্ট আছে?{' '}
            <Link href="/login?redirect=/supplier/register" className="text-primary font-semibold hover:underline ml-1">
              এখানে লগইন করুন
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
