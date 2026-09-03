'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, Award, Wallet, Save, Truck, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResellerMarketingPage() {
  const [reseller, setReseller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tracking form state
  const [tracking, setTracking] = useState({
    metaPixelId: '', facebookAccessToken: '', facebookTestEventCode: '',
    facebookDomainVerification: '', tiktokPixelId: '', tiktokAccessToken: '',
    googleTagManagerId: '', googleAnalyticsId: '',
  });

  // Payment form state
  const [payment, setPayment] = useState({
    bkashNumber: '', bkashActive: true,
    nagadNumber: '', nagadActive: true,
    rocketNumber: '', rocketActive: false,
    insideDhaka: 60, outsideDhaka: 120,
    paymentInstructions: '',
  });

  // Courier form state
  const [courier, setCourier] = useState({
    activeProvider: 'none',
    insideDhaka: 60,
    outsideDhaka: 120,
    steadfastApiKey: '',
    steadfastSecretKey: '',
    pathaoStoreId: '',
    redxApiKey: '',
    bdCourierApiKey: '',
  });

  // Loyalty form state
  const [loyalty, setLoyalty] = useState({
    isEnabled: false, activationThreshold: 5000, rewardPercentage: 5,
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/settings');
    if (res.ok) {
      const d = await res.json();
      const r = d.reseller;
      setReseller(r);
      setTracking({
        metaPixelId: r.seoConfig?.metaPixelId || '',
        facebookAccessToken: r.seoConfig?.facebookAccessToken || '',
        facebookTestEventCode: r.seoConfig?.facebookTestEventCode || '',
        facebookDomainVerification: r.seoConfig?.facebookDomainVerification || '',
        tiktokPixelId: r.seoConfig?.tiktokPixelId || '',
        tiktokAccessToken: r.seoConfig?.tiktokAccessToken || '',
        googleTagManagerId: r.seoConfig?.googleTagManagerId || '',
        googleAnalyticsId: r.seoConfig?.googleAnalyticsId || '',
      });
      setPayment({
        bkashNumber: r.paymentConfig?.bkash?.number || '',
        bkashActive: r.paymentConfig?.bkash?.active ?? true,
        nagadNumber: r.paymentConfig?.nagad?.number || '',
        nagadActive: r.paymentConfig?.nagad?.active ?? true,
        rocketNumber: r.paymentConfig?.rocket?.number || '',
        rocketActive: r.paymentConfig?.rocket?.active ?? false,
        insideDhaka: r.deliveryConfig?.insideDhaka ?? 60,
        outsideDhaka: r.deliveryConfig?.outsideDhaka ?? 120,
        paymentInstructions: r.paymentConfig?.instructions || '',
      });
      setCourier({
        activeProvider: r.courierConfig?.activeProvider || 'none',
        insideDhaka: r.deliveryConfig?.insideDhaka ?? 60,
        outsideDhaka: r.deliveryConfig?.outsideDhaka ?? 120,
        steadfastApiKey: r.courierConfig?.steadfast?.apiKey || '',
        steadfastSecretKey: r.courierConfig?.steadfast?.secretKey || '',
        pathaoStoreId: r.courierConfig?.pathao?.storeId || '',
        redxApiKey: r.courierConfig?.redx?.apiKey || '',
        bdCourierApiKey: r.courierConfig?.bdCourier?.apiKey || '',
      });
      setLoyalty({
        isEnabled: r.loyaltyConfig?.isEnabled ?? false,
        activationThreshold: r.loyaltyConfig?.activationThreshold ?? 5000,
        rewardPercentage: r.loyaltyConfig?.rewardPercentage ?? 5,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const save = async (payload: Record<string, any>) => {
    setSaving(true);
    const res = await fetch('/api/reseller/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resellerId: reseller._id, ...payload }),
    });
    if (res.ok) { toast.success('Settings saved successfully'); fetchData(); }
    else toast.error('Failed to save settings');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing & Integration Settings</h2>
          <p className="text-muted-foreground">Configure tracking pixels, payment methods, couriers, and loyalty rewards</p>
        </div>
      </div>

      <Tabs defaultValue="loyalty">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full">
          <TabsTrigger value="loyalty" className="flex-1 min-w-[90px]">Loyalty</TabsTrigger>
          <TabsTrigger value="payment" className="flex-1 min-w-[90px]">Payment</TabsTrigger>
          <TabsTrigger value="courier" className="flex-1 min-w-[90px]">Courier</TabsTrigger>
          <TabsTrigger value="meta" className="flex-1 min-w-[150px]">
            <Zap className="h-3 w-3 mr-1" /> Meta Pixel & Server Track
          </TabsTrigger>
        </TabsList>

        {/* LOYALTY TAB */}
        <TabsContent value="loyalty" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Loyalty & Rewards System
              </CardTitle>
              <CardDescription>Configure how customers activate their lifetime rewards and the percentage they earn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/20">
                <div>
                  <p className="font-bold text-sm">Loyalty Program Status</p>
                  <p className="text-xs text-muted-foreground">When enabled, customers earn reward points on every purchase</p>
                </div>
                <Button variant={loyalty.isEnabled ? 'default' : 'outline'} onClick={() => setLoyalty(l => ({ ...l, isEnabled: !l.isEnabled }))}>
                  {loyalty.isEnabled ? '● Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Activation Threshold (TK)</Label>
                  <Input type="number" value={loyalty.activationThreshold}
                    onChange={e => setLoyalty(l => ({ ...l, activationThreshold: Number(e.target.value) }))} placeholder="5000" />
                  <p className="text-xs text-muted-foreground">Minimum single order amount to activate lifetime rewards for a user.</p>
                </div>
                <div className="space-y-2">
                  <Label>Reward Percentage (%)</Label>
                  <Input type="number" value={loyalty.rewardPercentage}
                    onChange={e => setLoyalty(l => ({ ...l, rewardPercentage: Number(e.target.value) }))} placeholder="5" />
                  <p className="text-xs text-muted-foreground">Percentage of purchase total awarded as tokens to active users.</p>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-muted/30 text-sm space-y-2">
                <p className="font-bold">How it works:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                  <li>All registered users of your store are enrolled automatically.</li>
                  <li>Users become <strong>Active</strong> after a single purchase ≥ {loyalty.activationThreshold} TK.</li>
                  <li>Active users earn <strong>{loyalty.rewardPercentage}%</strong> of every purchase as wallet tokens.</li>
                  <li>Tokens can be used for discounts on any future purchase.</li>
                </ul>
              </div>
              <Button onClick={() => save({ loyaltyConfig: loyalty })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT TAB */}
        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Manual Payment & Delivery
              </CardTitle>
              <CardDescription>Configure bKash, Nagad numbers and delivery charges for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="font-semibold">bKash</Label>
                <div className="flex items-center gap-3">
                  <Input value={payment.bkashNumber} onChange={e => setPayment(p => ({ ...p, bkashNumber: e.target.value }))} placeholder="01XXXXXXXXX" className="flex-1" />
                  <Button size="sm" variant={payment.bkashActive ? 'default' : 'outline'} onClick={() => setPayment(p => ({ ...p, bkashActive: !p.bkashActive }))}>
                    {payment.bkashActive ? 'Active' : 'Off'}
                  </Button>
                </div>
                <Label className="font-semibold">Nagad</Label>
                <div className="flex items-center gap-3">
                  <Input value={payment.nagadNumber} onChange={e => setPayment(p => ({ ...p, nagadNumber: e.target.value }))} placeholder="01XXXXXXXXX" className="flex-1" />
                  <Button size="sm" variant={payment.nagadActive ? 'default' : 'outline'} onClick={() => setPayment(p => ({ ...p, nagadActive: !p.nagadActive }))}>
                    {payment.nagadActive ? 'Active' : 'Off'}
                  </Button>
                </div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Inside Dhaka Delivery (৳)</Label>
                  <Input type="number" value={payment.insideDhaka} onChange={e => setPayment(p => ({ ...p, insideDhaka: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Outside Dhaka Delivery (৳)</Label>
                  <Input type="number" value={payment.outsideDhaka} onChange={e => setPayment(p => ({ ...p, outsideDhaka: Number(e.target.value) }))} />
                </div>
              </div>
              <Button onClick={() => save({
                paymentConfig: { bkash: { number: payment.bkashNumber, active: payment.bkashActive }, nagad: { number: payment.nagadNumber, active: payment.nagadActive }, rocket: { number: payment.rocketNumber, active: payment.rocketActive }, instructions: payment.paymentInstructions },
                deliveryConfig: { insideDhaka: payment.insideDhaka, outsideDhaka: payment.outsideDhaka },
              })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COURIER TAB */}
        <TabsContent value="courier" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Courier & Shipping Rules
              </CardTitle>
              <CardDescription>Configure courier logistics and delivery charge parameters.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Active Provider</Label>
                  <select
                    value={courier.activeProvider}
                    onChange={e => setCourier(c => ({ ...c, activeProvider: e.target.value }))}
                    className="w-full h-12 rounded-xl border px-3 text-sm bg-background font-medium"
                  >
                    <option value="none">None</option>
                    <option value="steadfast">Steadfast</option>
                    <option value="pathao">Pathao</option>
                    <option value="redx">RedX</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Inside Dhaka (TK)</Label>
                  <Input
                    type="number"
                    value={courier.insideDhaka}
                    onChange={e => setCourier(c => ({ ...c, insideDhaka: Number(e.target.value) }))}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Outside Dhaka (TK)</Label>
                  <Input
                    type="number"
                    value={courier.outsideDhaka}
                    onChange={e => setCourier(c => ({ ...c, outsideDhaka: Number(e.target.value) }))}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                <div className="md:col-span-2 font-black text-xs uppercase opacity-50 mb-2">Provider Credentials</div>
                
                <div className="space-y-2">
                  <Label className="font-bold text-xs">Steadfast API Key</Label>
                  <Input
                    type="password"
                    placeholder="Steadfast API Key"
                    value={courier.steadfastApiKey}
                    onChange={e => setCourier(c => ({ ...c, steadfastApiKey: e.target.value }))}
                    className="h-10 rounded-lg border px-3 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs">Steadfast Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="Steadfast Secret Key"
                    value={courier.steadfastSecretKey}
                    onChange={e => setCourier(c => ({ ...c, steadfastSecretKey: e.target.value }))}
                    className="h-10 rounded-lg border px-3 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs">Pathao Store ID</Label>
                  <Input
                    type="text"
                    placeholder="Pathao Store ID"
                    value={courier.pathaoStoreId}
                    onChange={e => setCourier(c => ({ ...c, pathaoStoreId: e.target.value }))}
                    className="h-10 rounded-lg border px-3 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs">RedX API Key</Label>
                  <Input
                    type="password"
                    placeholder="RedX API Key"
                    value={courier.redxApiKey}
                    onChange={e => setCourier(c => ({ ...c, redxApiKey: e.target.value }))}
                    className="h-10 rounded-lg border px-3 text-xs"
                  />
                </div>

                <div className="md:col-span-2 space-y-2 pt-2 border-t mt-2">
                  <Label className="font-bold text-xs">BD Courier Fraud Check API Key</Label>
                  <Input
                    type="password"
                    placeholder="BD Courier API Key"
                    value={courier.bdCourierApiKey}
                    onChange={e => setCourier(c => ({ ...c, bdCourierApiKey: e.target.value }))}
                    className="h-10 rounded-lg border px-3 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Used for automatic fraud detection & customer delivery success rate checking.</p>
                </div>
              </div>

              <div className="md:col-span-3">
                <Button
                  onClick={() => save({
                    courierConfig: {
                      activeProvider: courier.activeProvider,
                      steadfast: { apiKey: courier.steadfastApiKey, secretKey: courier.steadfastSecretKey },
                      pathao: { storeId: courier.pathaoStoreId },
                      redx: { apiKey: courier.redxApiKey },
                      bdCourier: { apiKey: courier.bdCourierApiKey },
                    },
                    deliveryConfig: {
                      insideDhaka: courier.insideDhaka,
                      outsideDhaka: courier.outsideDhaka,
                    },
                  })}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Save Courier Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* META TAB */}
        <TabsContent value="meta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta (Facebook) Pixel</CardTitle>
              <CardDescription>Configure Facebook Ads pixel and server-side conversion tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'metaPixelId', label: 'Meta Pixel ID', placeholder: '1403937488264485' },
                { key: 'facebookDomainVerification', label: 'Domain Verification Code', placeholder: 'abc123...' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input value={(tracking as any)[f.key]} onChange={e => setTracking(t => ({ ...t, [f.key]: e.target.value }))} placeholder={f.placeholder} className="font-mono text-sm" />
                </div>
              ))}
              <Button onClick={() => save({ seoConfig: { ...reseller?.seoConfig, ...tracking } })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Server-Side Tracking
              </CardTitle>
              <CardDescription>Configure Facebook Conversions API, TikTok Events API, and Google Tag Manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'facebookAccessToken', label: 'Facebook Access Token (CAPI)', placeholder: 'EAA...', type: 'password' },
                { key: 'facebookTestEventCode', label: 'Test Event Code', placeholder: 'TEST12345' },
                { key: 'tiktokPixelId', label: 'TikTok Pixel ID', placeholder: 'CXXXXXXXX' },
                { key: 'tiktokAccessToken', label: 'TikTok Access Token', placeholder: 'tok...', type: 'password' },
                { key: 'googleTagManagerId', label: 'Google Tag Manager ID', placeholder: 'GTM-XXXXXXX' },
                { key: 'googleAnalyticsId', label: 'Google Analytics 4 ID', placeholder: 'G-XXXXXXXXXX' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input type={f.type || 'text'} value={(tracking as any)[f.key]} onChange={e => setTracking(t => ({ ...t, [f.key]: e.target.value }))} placeholder={f.placeholder} className="font-mono text-sm" />
                </div>
              ))}
              <Button onClick={() => save({ seoConfig: { ...reseller?.seoConfig, ...tracking } })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
