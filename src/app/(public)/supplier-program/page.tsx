import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  Wallet, 
  CheckCircle2, 
  HelpCircle,
  Building2,
  Users2,
  BarChart3,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'সাপ্লায়ার ও মার্চেন্ট পার্টনারশিপ | Swapnobaz',
  description: 'স্বপ্নবাজ সাপ্লায়ার নেটওয়ার্কে যুক্ত হয়ে আপনার ফ্যাক্টরি বা পাইকারি পণ্য হাজারো রিসেলারের মাধ্যমে দেশব্যাপী বিক্রি করুন।',
};

const supplierSteps = [
  {
    step: '০১',
    title: 'পার্টনারশিপ আবেদন',
    desc: 'আপনার কোম্পানি, ফ্যাক্টরি বা হোলসেল ব্যবসার প্রাথমিক তথ্য দিয়ে সাপ্লায়ার হিসেবে আবেদন জমা দিন।',
    icon: Building2,
  },
  {
    step: '০২',
    title: 'প্রোডাক্ট ও কোয়ালিটি রিভিউ',
    desc: 'আমাদের টিম আপনার পণ্যের মান, হোলসেল প্রাইজ এবং সাপ্লাই ক্যাপাসিটি যাচাই করে দ্রুত অ্যাপ্রুভাল দেবে।',
    icon: ShieldCheck,
  },
  {
    step: '০৩',
    title: 'ক্যাটালগ লিস্টিং ও ডিস্ট্রিবিউশন',
    desc: 'আপনার পণ্য স্বপ্নবাজ সেন্ট্রাল ক্যাটালগে যুক্ত হবে এবং সাথে সাথে হাজারো রিসেলারের স্টোরে লাইভ হবে।',
    icon: Package,
  },
  {
    step: '০৪',
    title: 'অটোমেটেড সেলস ও পেমেন্ট',
    desc: 'রিসেলারদের মাধ্যমে প্রতিদিন আসা অর্ডার প্রসেস করুন এবং নিয়মিত ও নিরাপদ ব্যাংক পেমেন্ট বুঝে নিন।',
    icon: Wallet,
  },
];

const supplierBenefits = [
  {
    icon: Users2,
    title: 'হাজারো অ্যাক্টিভ রিসেলার',
    desc: 'একটি প্ল্যাটফর্মে যুক্ত হয়েই সারা দেশের হাজারো উদ্যোক্তার মাধ্যমে আপনার পণ্যের বিক্রি নিশ্চিত করুন।',
  },
  {
    icon: TrendingUp,
    title: 'জিরো বিজ্ঞাপন ও মার্কেটিং খরচ',
    desc: 'মার্কেটিং ও বিজ্ঞাপনের পেছনে কোনো টাকা খরচ না করেই পণ্যের বড় অঙ্কের সেলস ভলিউম তৈরি করুন।',
  },
  {
    icon: Wallet,
    title: 'নিরাপদ ও দ্রুত পেমেন্ট সাইকেল',
    desc: 'স্বচ্ছ পেমেন্ট পলিসি এবং সাপ্তাহিক বা পিরিয়ডিক নিশ্চিত ব্যাংক সেটেলমেন্ট সুবিধা।',
  },
  {
    icon: BarChart3,
    title: 'রিয়েল-টাইম ইনভেন্টরি ড্যাশবোর্ড',
    desc: 'স্টক, স্টক-আউট এলার্ট এবং ডেইলি সেলস পারফরম্যান্স দেখার জন্য আধুনিক মার্চেন্ট ড্যাশবোর্ড।',
  },
  {
    icon: Truck,
    title: 'লজিস্টিকস ও হাব ড্রপ সাপোর্ট',
    desc: 'আমাদের দেশব্যাপী হাব ও কুরিয়ার লজিস্টিকস নেটওয়ার্কের মাধ্যমে দ্রুত ডেলিভারি নিশ্চিতকরণ।',
  },
  {
    icon: PhoneCall,
    title: 'কি অ্যাকাউন্ট ম্যানেজার (KAM)',
    desc: 'আপনার ব্র্যান্ড গ্রোথ ও বাল্ক ইনভেন্টরি ম্যানেজমেন্টের জন্য সার্বক্ষণিক ডেডিকেটেড সাপোর্ট।',
  },
];

const supplierFaqs = [
  {
    q: 'কারা স্বপ্নবাজ প্ল্যাটফর্মে সাপ্লায়ার হতে পারেন?',
    a: 'যেকোনো জেনুইন ম্যানুফ্যাকচারার, ফ্যাক্টরি মালিক, আমদানিকারক (Importer) বা শীর্ষ পাইকারি বিক্রেতা যাদের পর্যাপ্ত স্টক ও প্রতিযোগিতামূলক হোলসেল রেট দেওয়ার সক্ষমতা রয়েছে।',
  },
  {
    q: 'প্রোডাক্ট লিস্টিং এর জন্য কি কোনো ফি দিতে হয়?',
    a: 'না, ক্যাটালগে পণ্য লিস্টিং সম্পূর্ণ বিনামূল্যে করা হয়।',
  },
  {
    q: 'অর্ডার কীভাবে আসবে এবং ডেলিভারি কে করবে?',
    a: 'রিসেলারদের সেলস থেকে প্রাপ্ত অর্ডার সেন্ট্রাল সিস্টেমে জমা হবে। আপনি শুধুমাত্র পণ্য প্রস্তুত করে রাখবেন অথবা আমাদের সেন্ট্রাল হাবে ড্রপ করবেন, বাকি পিকআপ ও কাস্টমার ডেলিভারি আমরা পরিচালনা করি।',
  },
  {
    q: 'পেমেন্ট কীভাবে ও কবে পাবো?',
    a: 'নির্দিষ্ট সেটেলমেন্ট সাইকেল অনুযায়ী সরাসরি আপনার রেজিস্টার্ড ব্যাংক একাউন্টে পেমেন্ট ট্রান্সফার করা হবে।',
  },
];

export default function SupplierProgramPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background py-16 md:py-24 border-b border-border/60">
        <div className="absolute top-0 left-1/4 -mt-20 h-96 w-96 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide">
                <Sparkles className="h-4 w-4 text-primary" />
                সাপ্লায়ার ও মার্চেন্ট নেটওয়ার্ক
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
                আপনার পণ্যের বিক্রি বাড়ান{' '}
                <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                  হাজারো রিসেলারের শক্তিতে
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                ফ্যাক্টরি বা পাইকারি পণ্য কোনো বিজ্ঞাপন খরচ ছাড়াই সারা দেশের ক্রেতাদের কাছে পৌঁছে দিন। স্বপ্নবাজের সাথে পার্টনারশিপ গড়ে ব্যবসা বাড়ান বহুগুণ!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button asChild size="lg" className="w-full sm:w-auto font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl">
                  <Link href="/contact" className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    সাপ্লায়ার হিসেবে আবেদন করুন
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold px-6 py-6 rounded-xl">
                  <Link href="#supplier-benefits">
                    সুবিধাসমূহ দেখুন
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
                <Image
                  src="/assets/images/sectionbanner/supplier-section.webp"
                  alt="স্বপ্নবাজ সাপ্লায়ার প্রোগ্রাম"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Benefits (সুবিধাসমূহ) ── */}
      <section id="supplier-benefits" className="py-16 md:py-24 bg-card/40 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              মার্চেন্ট পার্টনারশিপ সুবিধা
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              কেন স্বপ্নবাজে <span className="text-primary">সাপ্লায়ার হবেন?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              আপনার পণ্য দ্রুত ও নির্ভরযোগ্য উপায়ে সারা দেশে ডিস্ট্রিবিউট করার সর্বোত্তম প্ল্যাটফর্ম
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supplierBenefits.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 hover:border-primary/40 transition-all duration-200">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Onboarding Steps (অনবোর্ডিং প্রক্রিয়া) ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              সাপ্লায়ার অনবোর্ডিং <span className="text-primary">প্রক্রিয়া</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              মাত্র ৪টি সহজ পদক্ষেপে আমাদের ডিস্ট্রিবিউশন নেটওয়ার্কে যুক্ত হোন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supplierSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-black text-muted-foreground/30 font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Supplier FAQ Section ── */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="h-3.5 w-3.5" />
              মার্চেন্ট FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              সাপ্লায়ার সংক্রান্ত সাধারণ প্রশ্নাবলী
            </h2>
          </div>

          <div className="space-y-4">
            {supplierFaqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-card border border-border/80 space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Bottom CTA Banner ── */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-secondary/40 via-secondary/20 to-card">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            আপনার পণ্যকে সারা দেশের বাজারে পৌঁছে দিতে প্রস্তুত?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            আমাদের বিজনেস টিমের সাথে আলোচনা করতে আজই সাপ্লায়ার পার্টনারশিপ ফর্ম পূরণ করুন।
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="font-bold text-base px-10 py-6 rounded-xl shadow-xl hover:scale-105 transition-all">
              <Link href="/contact" className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                সাপ্লায়ার হিসেবে আবেদন করুন
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
