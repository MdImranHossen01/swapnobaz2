'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  storeName: z.string().min(3, 'স্টোরের নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  subdomain: z.string()
    .min(4, 'সাবডোমেন কমপক্ষে ৪ অক্ষরের হতে হবে')
    .max(30, 'সর্বোচ্চ ৩০ অক্ষর')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং হাইফেন (-) ব্যবহার করা যাবে'),
  phone: z.string().min(11, '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন'),
  address: z.string().min(5, 'ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ResellerRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { storeName: '', subdomain: '', phone: '', address: '', description: '' },
  });

  const subdomainValue = form.watch('subdomain');

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reseller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success('নিবন্ধন সফল হয়েছে!');
      } else {
        toast.error(data.error || 'নিবন্ধন করতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সংযোগ ত্রুটি');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/10 font-sans">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <CardTitle className="text-2xl font-black">নিবন্ধন সফল হয়েছে!</CardTitle>
            <CardDescription>
              আপনার রিসেলার স্টোরের আবেদন পর্যালোচনা করা হচ্ছে। অনুমোদনের পর স্টোরটি সক্রিয় হবে এবং আপনি আপনার ড্যাশবোর্ডে অ্যাক্সেস করতে পারবেন।
            </CardDescription>
            <Button onClick={() => router.push('/reseller/dashboard')} className="w-full">
              ড্যাশবোর্ডে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/10 font-sans">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Store className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-black">রিসেলার হিসেবে নিবন্ধন করুন</CardTitle>
          <CardDescription>আপনার নিজস্ব ব্র্যান্ডের ডোমেইনে প্রোডাক্ট বিক্রি শুরু করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>স্টোরের নাম</Label>
              <Input {...form.register('storeName')} placeholder="যেমন: ক্লাইম্যাক্স স্টোর" />
              {form.formState.errors.storeName && (
                <p className="text-xs text-destructive">{form.formState.errors.storeName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>সাবডোমেন</Label>
              <div className="flex items-center">
                <Input
                  {...form.register('subdomain')}
                  placeholder="climax-store"
                  className="rounded-r-none border-r-0"
                />
                <span className="h-10 px-3 bg-muted border border-l-0 text-sm flex items-center rounded-r-md select-none">
                  .swapnobaz.com
                </span>
              </div>
              {subdomainValue && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  আপনার স্টোরের লিংক হবে: <strong>https://{subdomainValue.toLowerCase()}.swapnobaz.com</strong>
                </p>
              )}
              {form.formState.errors.subdomain && (
                <p className="text-xs text-destructive">{form.formState.errors.subdomain.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>মোবাইল নম্বর</Label>
              <Input {...form.register('phone')} placeholder="01XXXXXXXXX" type="tel" />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>ঠিকানা</Label>
              <Input {...form.register('address')} placeholder="আপনার বর্তমান ঠিকানা" />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>স্টোরের বিবরণ (ঐচ্ছিক)</Label>
              <Textarea {...form.register('description')} placeholder="আপনার স্টোর সম্পর্কে কিছু লিখুন..." rows={3} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              নিবন্ধন সম্পূর্ণ করুন
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
