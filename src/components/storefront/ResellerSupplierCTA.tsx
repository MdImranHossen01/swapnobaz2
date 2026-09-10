import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Store, Package, Sparkles } from 'lucide-react';

const resellerBenefits = [
  'কোনো স্টক বা গুদাম রাখার ঝামেলা নেই',
  'নিজের ব্র্যান্ড, লোগো ও দামে পণ্য বিক্রি করুন',
  'কাস্টম ডোমেইন দিয়ে সম্পূর্ণ নিজস্ব ওয়েবসাইট',
  'প্রতিটি সফল অর্ডারে ইনস্ট্যান্ট লাভ ও কমিশন',
  '২৪/৭ স্বয়ংক্রিয় অর্ডার ও পেমেন্ট সেটেলমেন্ট',
];

const supplierBenefits = [
  'হাজারো অ্যাক্টিভ রিসেলারের মাধ্যমে পণ্য বিক্রি',
  'জিরো মার্কেটিং খরচে সারা দেশে পণ্য পৌঁছান',
  'রিয়েল-টাইম স্টক, ইনভেন্টরি ও সেলস ট্র্যাকিং',
  'দ্রুত, নিরাপদ ও নির্ভরযোগ্য ব্যাংক/মোবাইল পেমেন্ট',
  'দেশব্যাপী বিস্তৃত ডেলিভারি ও লজিস্টিকস সাপোর্ট',
];

export function ResellerSupplierCTA() {
  return (
    <section className="w-full my-8 space-y-8">
      {/* ── Reseller Section ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-background to-primary/5 shadow-lg">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left: Text Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide border border-primary/20">
                <Store className="h-4 w-4" />
                রিসেলার পার্টনারশিপ
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                  পুঁজি ছাড়াই শুরু করুন{' '}
                  <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-4">
                    নিজের ই-কমার্স ব্যবসা
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  পণ্য কেনা বা ডেলিভারির ঝামেলা আমাদের। আপনি শুধু নিজের ব্র্যান্ডে ও দামে বিক্রি করে লাভ বুঝে নিন!
                </p>
              </div>

              <ul className="space-y-2.5">
                {resellerBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/reseller/register"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm sm:text-base py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles className="h-4 w-4" />
                  রিসেলার হিসেবে যোগ দিন
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/reseller-program"
                  className="inline-flex items-center justify-center gap-2 border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-foreground font-semibold text-sm sm:text-base py-3 px-5 rounded-xl transition-all duration-200"
                >
                  বিস্তারিত জানুন
                </Link>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-lg aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-border/80 bg-muted">
                <Image
                  src="/assets/images/sectionbanner/reseller-section.webp"
                  alt="রিসেলার প্রোগ্রাম"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supplier Section ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-bl from-card via-background to-secondary/30 shadow-lg">
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left: Image */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-border/80 bg-muted">
                <Image
                  src="/assets/images/sectionbanner/supplier-section.webp"
                  alt="সাপ্লায়ার নেটওয়ার্ক"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide border border-border">
                <Package className="h-4 w-4 text-primary" />
                সাপ্লায়ার / মার্চেন্ট প্রোগ্রাম
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                  আপনার পণ্য পৌঁছে দিন{' '}
                  <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-4">
                    হাজারো বিক্রেতার হাতে
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  দেশের অন্যতম দ্রুত বর্ধনশীল ড্রপশিপিং নেটওয়ার্কে যুক্ত হয়ে বিজ্ঞাপন খরচ ছাড়াই আপনার ফ্যাক্টরি বা হোলসেল পণ্যের বিক্রি বহুগুণ বাড়ান।
                </p>
              </div>

              <ul className="space-y-2.5">
                {supplierBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm sm:text-base py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Package className="h-4 w-4" />
                  সাপ্লায়ার হিসেবে আবেদন করুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/supplier-program"
                  className="inline-flex items-center justify-center gap-2 border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-foreground font-semibold text-sm sm:text-base py-3 px-5 rounded-xl transition-all duration-200"
                >
                  বিস্তারিত জানুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}