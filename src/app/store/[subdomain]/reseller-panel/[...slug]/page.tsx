/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Fallback = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Map slug path → existing reseller page component
const PAGE_MAP: Record<string, React.ComponentType<any>> = {
  'wallet': dynamic(() => import('@/app/(reseller)/reseller/wallet/page'), { loading: Fallback }),
  'orders': dynamic(() => import('@/app/(reseller)/reseller/orders/page'), { loading: Fallback }),
  'products': dynamic(() => import('@/app/(reseller)/reseller/products/page'), { loading: Fallback }),
  'products/new': dynamic(() => import('@/app/(reseller)/reseller/products/new/page'), { loading: Fallback }),
  'products/source': dynamic(() => import('@/app/(reseller)/reseller/products/source/page'), { loading: Fallback }),
  'abandoned-carts': dynamic(() => import('@/app/(reseller)/reseller/abandoned-carts/page'), { loading: Fallback }),
  'expenses-incomes': dynamic(() => import('@/app/(reseller)/reseller/expenses-incomes/page'), { loading: Fallback }),
  'ledger': dynamic(() => import('@/app/(reseller)/reseller/ledger/page'), { loading: Fallback }),
  'low-stock': dynamic(() => import('@/app/(reseller)/reseller/low-stock/page'), { loading: Fallback }),
  'upcoming-expiry': dynamic(() => import('@/app/(reseller)/reseller/upcoming-expiry/page'), { loading: Fallback }),
  'users': dynamic(() => import('@/app/(reseller)/reseller/users/page'), { loading: Fallback }),
  'cms/banners': dynamic(() => import('@/app/(reseller)/reseller/cms/banners/page'), { loading: Fallback }),
  'coupons': dynamic(() => import('@/app/(reseller)/reseller/coupons/page'), { loading: Fallback }),
  'settings': dynamic(() => import('@/app/(reseller)/reseller/settings/page'), { loading: Fallback }),
  'marketing': dynamic(() => import('@/app/(reseller)/reseller/marketing/page'), { loading: Fallback }),
};

export default function ResellerPanelSubPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const key = slug.join('/');

  const Page = PAGE_MAP[key];
  if (!Page) return notFound();

  return <Page />;
}
