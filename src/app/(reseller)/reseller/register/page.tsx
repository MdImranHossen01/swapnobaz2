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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Store, Loader2, CheckCircle2, User, Mail, Lock, Phone, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const createSchema = (isLoggedIn: boolean) => z.object({
  name: isLoggedIn ? z.string().optional() : z.string().min(2, 'আপনার নাম লিখুন'),
  email: isLoggedIn ? z.string().optional() : z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  password: isLoggedIn ? z.string().optional() : z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  storeName: z.string().min(3, 'স্টোরের নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  subdomain: z.string()
    .min(4, 'সাবডোমেন কমপক্ষে ৪ অক্ষরের হতে হবে')
    .max(30, 'সর্বোচ্চ ৩০ অক্ষর')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং হাইফেন (-) ব্যবহার করা যাবে'),
  phone: z.string().min(11, '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন'),
  address: z.string().min(5, 'ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে'),
  description: z.string().optional(),
});

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export default function ResellerRegisterPage() {
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
      email: '',
      password: '',
      storeName: '',
      subdomain: '',
      phone: '',
      address: '',
      description: ''
    },
  });

  const subdomainValue = form.watch('subdomain');

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload: any = {
        storeName: values.storeName,
        subdomain: values.subdomain,
        phone: values.phone,
        address: values.address,
        description: values.description || '',
      };

      if (!isLoggedIn) {
        payload.name = values.name;
        payload.email = values.email;
        payload.password = values.password;
      }

      const res = await fetch('/api/reseller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success('রিসেলার আবেদন সফলভাবে সম্পন্ন হয়েছে!');

        // If guest registered, attempt automatic signIn in background
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
        toast.error(data.error || 'নিবন্ধন করতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সংযোগে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20 font-sans">
        <Card className="max-w-md w-full text-center border-border shadow-2xl">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="h-16 w-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">নিবন্ধন সফল হয়েছে!</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              আপনার রিসেলার স্টোরের আবেদন পর্যালোচনা করা হচ্ছে। অ্যাডমিন অনুমোদনের পর স্টোরটি সক্রিয় হবে এবং আপনি আপনার ড্যাশবোর্ডে সম্পূর্ণ অ্যাক্সেস পাবেন।
            </CardDescription>
            <div className="pt-2 flex flex-col gap-2">
              <Button onClick={() => router.push('/reseller/dashboard')} className="w-full font-bold">
                ড্যাশবোর্ডে প্রবেশ করুন
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
      <Card className="max-w-xl w-full border-border/80 shadow-2xl bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <Store className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            রিসেলার হিসেবে নিবন্ধন করুন
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            কোনো পুঁজি ছাড়াই নিজস্ব ব্র্যান্ডে ড্রপশিপিং ই-কমার্স ব্যবসা শুরু করুন
          </CardDescription>

          {isLoggedIn && session?.user && (
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mt-1">
              <Sparkles className="h-3.5 w-3.5" />
              লগইন করা অ্যাকাউন্ট: {session.user.name || session.user.email}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Guest Details: Name, Email, Password */}
            {!isLoggedIn && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  অ্যাকাউন্ট তথ্য
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">আপনার পুরো নাম</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('name')} placeholder="মোঃ করিম উদ্দিন" className="pl-9" />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message as string}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">ইমেইল ঠিকানা</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input {...form.register('email')} type="email" placeholder="you@domain.com" className="pl-9" />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">পাসওয়ার্ড</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input {...form.register('password')} type="password" placeholder="কমপক্ষে ৬ অক্ষর" className="pl-9" />
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">{form.formState.errors.password.message as string}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Store Information */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                স্টোর ও যোগাযোগের তথ্য
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">স্টোরের নাম</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input {...form.register('storeName')} placeholder="যেমন: ক্লাইম্যাক্স ফ্যাশন" className="pl-9" />
                </div>
                {form.formState.errors.storeName && (
                  <p className="text-xs text-destructive">{form.formState.errors.storeName.message as string}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">সাবডোমেন (Subdomain)</Label>
                <div className="flex items-center">
                  <Input
                    {...form.register('subdomain')}
                    placeholder="climax-store"
                    className="rounded-r-none border-r-0 font-medium"
                  />
                  <span className="h-10 px-3 bg-muted border border-l-0 text-xs sm:text-sm font-semibold text-muted-foreground flex items-center rounded-r-md select-none">
                    .swapnobaz.com
                  </span>
                </div>
                {subdomainValue && (
                  <p className="text-[11px] text-primary mt-1 font-medium">
                    আপনার স্টোরের লিংক হবে: <strong>https://{subdomainValue.toLowerCase()}.swapnobaz.com</strong>
                  </p>
                )}
                {form.formState.errors.subdomain && (
                  <p className="text-xs text-destructive">{form.formState.errors.subdomain.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">মোবাইল নম্বর</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('phone')} placeholder="01XXXXXXXXX" type="tel" className="pl-9" />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message as string}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ঠিকানা</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('address')} placeholder="আপনার বর্তমান ঠিকানা" className="pl-9" />
                  </div>
                  {form.formState.errors.address && (
                    <p className="text-xs text-destructive">{form.formState.errors.address.message as string}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">স্টোরের বিবরণ (ঐচ্ছিক)</Label>
                <Textarea {...form.register('description')} placeholder="আপনার ব্যবসার অভিজ্ঞতা বা পরিকল্পনা সম্পর্কে কিছু লিখুন..." rows={2} />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full font-bold text-base py-6 shadow-md hover:shadow-lg transition-all">
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  আবেদন প্রক্রিয়াধীন...
                </>
              ) : (
                'রিসেলার আবেদন সম্পূর্ণ করুন'
              )}
            </Button>
          </form>
        </CardContent>

        {!isLoggedIn && (
          <CardFooter className="flex justify-center border-t border-border/40 pt-4 text-xs text-muted-foreground">
            আগে থেকেই কি আপনার অ্যাকাউন্ট আছে?{' '}
            <Link href="/login?redirect=/reseller/register" className="text-primary font-semibold hover:underline ml-1">
              এখানে লগইন করুন
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
