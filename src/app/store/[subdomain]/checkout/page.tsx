import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Reseller from '@/models/Reseller';
import { ResellerCheckout } from '@/components/reseller/ResellerCheckout';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function ResellerCheckoutPage({ params }: Props) {
  const { subdomain } = await params;
  await dbConnect();

  const reseller = await Reseller.findOne({ subdomain, status: 'active' }).lean();
  if (!reseller) notFound();

  const GlobalSettings = (await import('@/models/GlobalSettings')).default;
  const globalSettings = await GlobalSettings.findOne().sort({ updatedAt: -1 }).lean();
  const stripeActive = globalSettings?.paymentConfig?.activeMethod === 'stripe';

  const storeInfo = {
    storeName: reseller.storeName,
    deliveryInside: reseller.deliveryConfig?.insideDhaka ?? 60,
    deliveryOutside: reseller.deliveryConfig?.outsideDhaka ?? 120,
    paymentConfig: reseller.paymentConfig as any,
    stripeActive,
  };

  return <ResellerCheckout subdomain={subdomain} storeInfo={storeInfo} />;
}
