import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Store, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  Wallet, 
  Laptop, 
  CheckCircle2, 
  HelpCircle,
  Users,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'রিসেলার প্রোগ্রাম | Swapnobaz',
  description: 'স্বপ্নবাজ রিসেলার প্রোগ্রাম - কোনো পুঁজি ছাড়াই নিজের ব্র্যান্ডে ই-কমার্স ব্যবসা শুরু করুন। হাজারো পণ্য নিজের দামে বিক্রি করে আকর্ষণীয় মুনাফা অর্জন করুন।',
};

const steps = [
  {
    step: '০১',
    title: 'ফ্রি রেজিস্ট্রেশন ও স্টোর সেটআপ',
    desc: 'মাত্র ২ মিনিটে নিজের স্টোরের নাম ও সাবডোমেন দিয়ে বিনামূল্যে রিসেলার অ্যাকাউন্ট খুলুন।',
    icon: Store,
  },
  {
    step: '০২',
    title: 'পণ্য নির্বাচন ও মূল্য নির্ধারণ',
    desc: 'আমাদের প্ল্যাটফর্মের হাজারো কোয়ালিটি পণ্য থেকে আপনার পছন্দের প্রডাক্ট বেছে নিজের কাঙ্ক্ষিত প্রফিট মার্জিন সেট করুন।',
    icon: PackageCheck,
  },
  {
    step: '০৩',
    title: 'অর্ডার সংগ্রহ ও শেয়ারিং',
    desc: 'সোশ্যাল মিডিয়া, ফেসবুক পেজ বা আপনার নিজস্ব স্টোর লিংকের মাধ্যমে কাস্টমারদের কাছে প্রডাক্ট প্রমোট করে অর্ডার নিন।',
    icon: Laptop,
  },
  {
    step: '০৪',
    title: 'ডেলিভারি ও লাভ বুঝে নেওয়া',
    desc: 'কাস্টমারের ঠিকানায় প্যাকেজিং ও হোম ডেলিভারি আমরা করবো। পণ্য ডেলিভারি সম্পন্ন হলেই আপনার লাভ ওয়ালেটে যোগ হবে।',
    icon: Wallet,
  },
];

const features = [
  {
    icon: DollarSign,
    title: 'জিরো ইনভেস্টমেন্ট',
    desc: 'পণ্য স্টক বা গোডাউনের কোনো খরচ নেই। এক টাকাও ইনভেস্ট না করে ব্যবসা শুরু করুন।',
  },
  {
    icon: Laptop,
    title: 'নিজস্ব কাস্টম ওয়েবসাইট',
    desc: 'আপনার ব্র্যান্ডের নামে সম্পূর্ণ রেডিমেড ই-কমার্স ওয়েবসাইট ও কাস্টম ডোমেইন সাপোর্ট।',
  },
  {
    icon: Truck,
    title: 'দেশব্যাপী কুরিয়ার সুবিধা',
    desc: 'সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি এবং রিয়েল-টাইম কুরিয়ার ট্র্যাকিং সিস্টেম।',
  },
  {
    icon: Wallet,
    title: 'সহজ ও দ্রুত পেমেন্ট উইথড্র',
    desc: 'আপনার উপার্জিত প্রফিট বিকাশ, নগদ বা ব্যাংক একাউন্টে সহজে ও নিয়মিত উত্তোলন করুন।',
  },
  {
    icon: ShieldCheck,
    title: 'কোয়ালিটি কন্ট্রোল ও রিটার্ন সাপোর্ট',
    desc: '১০০% কোয়ালিটি চেকে পণ্য ডেলিভারি এবং কাস্টমার রিটার্ন হ্যান্ডেল করার পূর্ণ সুবিধা।',
  },
  {
    icon: Users,
    title: 'ডেডিকেটেড রিসেলার হেল্পডেস্ক',
    desc: 'আপনার ব্যবসার প্রসারে যেকোনো টেকনিক্যাল ও সেলস সাপোর্টের জন্য আমাদের টিম সদা প্রস্তুত।',
  },
];

const faqs = [
  {
    q: 'রিসেলার হিসেবে যুক্ত হতে কি কোনো ফি বা জামানত দিতে হয়?',
    a: 'না, স্বপ্নবাজ রিসেলার প্ল্যাটফর্মে জয়েন করা সম্পূর্ণ বিনামূল্যে। কোনো প্রকার হিডেন চার্জ বা সাবস্ক্রিপশন ফি নেই।',
  },
  {
    q: 'পণ্য ডেলিভারি কার নামে যাবে?',
    a: 'কাস্টমারের কাছে পার্সেল আপনার স্টোর/ব্র্যান্ডের নামেই ডেলিভারি হবে, যাতে আপনার ব্র্যান্ড ভ্যালু বৃদ্ধি পায়।',
  },
  {
    q: 'আমি কীভাবে প্রফিট পাবো এবং কত দিনে টাকা তোলা যায়?',
    a: 'কাস্টমার অর্ডার রিসিভ করার সাথে সাথে আপনার নির্ধারিত লাভ আপনার স্বপ্নবাজ ওয়ালেটে জমা হবে। আপনি সপ্তাহে যেকোনো সময় বিকাশ, নগদ বা ব্যাংক একাউন্টে উইথড্র রিকোয়েস্ট করতে পারবেন।',
  },
  {
    q: 'কাস্টমার যদি পার্সেল রিটার্ন করে তবে কি আমার ক্ষতি হবে?',
    a: 'না, জেনুইন রিটার্ন বা কাস্টমার ক্যান্সেলেশনের ক্ষেত্রে প্রোডাক্টের দামের কোনো দায়ভার রিসেলারের উপর থাকে না।',
  },
];

export default function ResellerProgramPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24 border-b border-border/60">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide">
                <Sparkles className="h-4 w-4" />
                স্বপ্নবাজ রিসেলার পার্টনারশিপ
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
                পুঁজি ছাড়াই শুরু হোক আপনার{' '}
                <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
                  ই-কমার্স ব্র্যান্ড
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                হোলসেল দামে হাজারো প্রিমিয়াম পণ্য থেকে নিজের স্টোরে যুক্ত করুন, নিজের দামে বিক্রি করে নিশ্চিত লাভ বুঝে নিন। পণ্য সোর্সিং থেকে ডেলিভারি—সব দায়িত্ব আমাদের!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button asChild size="lg" className="w-full sm:w-auto font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl">
                  <Link href="/reseller/register" className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    এখনই ফ্রি রেজিস্টার করুন
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold px-6 py-6 rounded-xl">
                  <Link href="#how-it-works">
                    কীভাবে কাজ করে জানুন
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
                <Image
                  src="/assets/images/sectionbanner/reseller-section.webp"
                  alt="স্বপ্নবাজ রিসেলার প্রোগ্রাম"
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

      {/* ── 2. How it works (ধাপে ধাপে কীভাবে কাজ করে) ── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card/40 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              কীভাবে কাজ করে <span className="text-primary">স্বপ্নবাজ রিসেলিং?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              খুবই সহজ ৪টি ধাপে আপনি নিজেই আপনার অনলাইন ব্যবসা পরিচালনা করতে পারবেন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => {
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

      {/* ── 3. Features & Benefits (রিসেলারদের সুবিধাসমূহ) ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              আপনার ব্যবসার সুবিধা
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              কেন স্বপ্নবাজ রিসেলার প্ল্যাটফর্ম <span className="text-primary">সেরা?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              আমরা আপনাকে দিচ্ছি একটি স্বয়ংসম্পূর্ণ টেকনোলজি ও লজিস্টিকস সমাধান
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. FAQ Section ── */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              <HelpCircle className="h-3.5 w-3.5" />
              সাধারণ জিজ্ঞাসা
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              সচরাচর জিজ্ঞাসিত প্রশ্নাবলী
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
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
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/15 via-primary/5 to-card">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            দেরি না করে আজই শুরু করুন আপনার সফল ই-কমার্স যাত্রা
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            হাজারো সফল উদ্যোক্তার সাথে যুক্ত হয়ে ঘরে বসেই স্বাধীনভাবে ব্যবসা গড়ে তুলুন।
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="font-bold text-base px-10 py-6 rounded-xl shadow-xl hover:scale-105 transition-all">
              <Link href="/reseller/register" className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                রিসেলার হিসেবে নিবন্ধন করুন
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
