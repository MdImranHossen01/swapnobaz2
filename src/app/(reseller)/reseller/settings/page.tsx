'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Store, Globe, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { PasswordChangeForm } from '@/components/user/PasswordChangeForm';

export default function ResellerSettingsPage() {
  const [reseller, setReseller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    storeName: '', description: '', logoUrl: '', faviconUrl: '', marqueeText: '',
    metaTitle: '', metaDescription: '',
  });
  const [contact, setContact] = useState({ email: '', phone: '', address: '' });
  const [social, setSocial] = useState({
    facebook: '', instagram: '', tiktok: '', whatsapp: '', youtube: '', twitter: '', linkedin: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/settings');
    if (res.ok) {
      const d = await res.json();
      const r = d.reseller;
      setReseller(r);
      setGeneral({
        storeName: r.storeName || '',
        description: r.description || '',
        logoUrl: r.logoUrl || '',
        faviconUrl: r.faviconUrl || '',
        marqueeText: r.marqueeText || '',
        metaTitle: r.seoConfig?.metaTitle || '',
        metaDescription: r.seoConfig?.metaDescription || '',
      });
      setContact({ email: r.contact?.email || '', phone: r.contact?.phone || '', address: r.contact?.address || '' });
      setSocial({
        facebook: r.socialLinks?.facebook || '',
        instagram: r.socialLinks?.instagram || '',
        tiktok: r.socialLinks?.tiktok || '',
        whatsapp: r.socialLinks?.whatsapp || '',
        youtube: r.socialLinks?.youtube || '',
        twitter: r.socialLinks?.twitter || '',
        linkedin: r.socialLinks?.linkedin || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const save = async (payload: Record<string, any>) => {
    setSaving(true);
    const res = await fetch('/api/reseller/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resellerId: reseller._id, ...payload }),
    });
    if (res.ok) { toast.success('Settings saved successfully'); fetchSettings(); }
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
          <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>
          <p className="text-muted-foreground">Configure your store branding, contact details, domain, and account security</p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full">
          <TabsTrigger value="general" className="flex-1 min-w-[90px]">General</TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 min-w-[90px]">Contact</TabsTrigger>
          <TabsTrigger value="social" className="flex-1 min-w-[90px]">Social</TabsTrigger>
          <TabsTrigger value="domain" className="flex-1 min-w-[90px]">Domain</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[90px]">Security</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Branding</CardTitle>
              <CardDescription>Manage your store's identity and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Brand Name (Store Name)</Label>
                <Input value={general.storeName} onChange={e => setGeneral(g => ({ ...g, storeName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Store Description</Label>
                <Textarea value={general.description} onChange={e => setGeneral(g => ({ ...g, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Marquee / Announcement Text</Label>
                <Input value={general.marqueeText} onChange={e => setGeneral(g => ({ ...g, marqueeText: e.target.value }))} placeholder="Free delivery on orders over ৳1000!" />
              </div>
              <div className="border-t pt-4 space-y-2">
                <Label className="font-semibold">Store Logo</Label>
                <ImageUpload value={general.logoUrl} onUpload={url => setGeneral(g => ({ ...g, logoUrl: url }))} aspect="square" />
              </div>
              <div className="border-t pt-4 space-y-2">
                <Label className="font-semibold">Store Favicon</Label>
                <ImageUpload value={general.faviconUrl} onUpload={url => setGeneral(g => ({ ...g, faviconUrl: url }))} aspect="square" />
              </div>
              <div className="border-t pt-4 space-y-3">
                <Label className="font-semibold">SEO / Meta Tags</Label>
                <div className="space-y-1">
                  <Label>Meta Title</Label>
                  <Input value={general.metaTitle} onChange={e => setGeneral(g => ({ ...g, metaTitle: e.target.value }))} placeholder="My Store - Best Online Shop" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Description</Label>
                  <Textarea value={general.metaDescription} onChange={e => setGeneral(g => ({ ...g, metaDescription: e.target.value }))} rows={2} />
                </div>
              </div>
              <Button onClick={() => save({
                storeName: general.storeName, description: general.description,
                logoUrl: general.logoUrl, faviconUrl: general.faviconUrl,
                marqueeText: general.marqueeText,
                seoConfig: { ...reseller?.seoConfig, metaTitle: general.metaTitle, metaDescription: general.metaDescription },
              })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-1">
                  <Label>Support Email</Label>
                  <Input value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="support@mystore.com" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Store Address</Label>
                <Textarea value={contact.address} onChange={e => setContact(c => ({ ...c, address: e.target.value }))} rows={2} />
              </div>
              <Button onClick={() => save({ contact })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Contact
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/your-page' },
                  { key: 'twitter', label: 'X (Twitter) URL', placeholder: 'https://twitter.com/your-handle' },
                  { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/your-handle' },
                  { key: 'youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/@your-channel' },
                  { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/your-profile' },
                  { key: 'tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@your-handle' },
                  { key: 'whatsapp', label: 'WhatsApp URL', placeholder: 'https://wa.me/your-number' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    <Input value={(social as any)[field.key]} onChange={e => setSocial(s => ({ ...s, [field.key]: e.target.value }))} placeholder={field.placeholder} />
                  </div>
                ))}
              </div>
              <Button onClick={() => save({ socialLinks: social })} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Social Links
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-4 mt-4">
          <DomainTab reseller={reseller} onSave={save} saving={saving} />
        </TabsContent>

        {/* Security Tab (Password Change) */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Account Security
              </CardTitle>
              <CardDescription>Update your password and manage account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <PasswordChangeForm hideHeader={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DomainTab({ reseller, onSave, saving }: { reseller: any; onSave: (p: any) => void; saving: boolean }) {
  const [subdomain, setSubdomain] = useState(reseller?.subdomain || '');
  const [customDomain, setCustomDomain] = useState(reseller?.customDomain || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Domain Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label className="font-semibold">Subdomain</Label>
          <div className="flex items-center gap-2">
            <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="mystore" className="font-mono" />
            <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">.swapnobaz.com</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: <a href={`https://${subdomain}.swapnobaz.com`} target="_blank" rel="noreferrer" className="text-primary underline">https://{subdomain || 'yourstore'}.swapnobaz.com</a>
          </p>
        </div>
        <div className="border-t pt-4 space-y-1.5">
          <Label className="font-semibold">Custom Domain</Label>
          <Input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="www.myonlinestore.com" className="font-mono" />
          <div className="rounded-lg bg-muted/40 p-3 text-xs border mt-2 space-y-1.5">
            <p className="font-bold text-foreground">DNS CNAME Setup Instructions:</p>
            <div className="font-mono bg-background p-2 rounded border space-y-1 text-[11px]">
              <p><strong>Type:</strong> CNAME</p>
              <p><strong>Host / Name:</strong> @ (or www)</p>
              <p><strong>Target / Value:</strong> cname.swapnobaz.com</p>
            </div>
          </div>
        </div>
        <Button onClick={() => onSave({ subdomain, customDomain })} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Domain Settings
        </Button>
      </CardContent>
    </Card>
  );
}
