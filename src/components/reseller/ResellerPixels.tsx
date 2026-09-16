"use client";

/**
 * ResellerPixels — loads the reseller's own Facebook and TikTok Pixel scripts.
 * Renders inside SettingsProvider context on reseller storefront pages.
 * Works exactly like FacebookPixel.tsx and TikTokPixel.tsx from the main layout,
 * but uses the reseller's own Pixel IDs.
 */

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

function FacebookPixelScript({ pixelId, subdomain }: { pixelId: string; subdomain: string }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sanitizedPixelId = /^\d+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  const trackPageView = useCallback(() => {
    if (!sanitizedPixelId) return;
    const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "PageView", {}, { eventID: eventId });
    }
    // CAPI PageView
    if (typeof window !== "undefined") {
      fetch(`/api/store/${subdomain}/facebook/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventName: "PageView",
          eventUrl: window.location.href,
          userAgent: navigator.userAgent,
          eventId,
          userData: {},
          customData: {},
        }),
      }).catch(() => {});
    }
  }, [sanitizedPixelId, subdomain]);

  useEffect(() => {
    if (!scriptLoaded || !sanitizedPixelId) return;
    trackPageView();
  }, [pathname, searchParams, scriptLoaded, sanitizedPixelId, trackPageView]);

  if (!sanitizedPixelId) return null;

  return (
    <Script
      id={`fb-pixel-reseller-${subdomain}`}
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${sanitizedPixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

function TikTokPixelScript({ pixelId, subdomain }: { pixelId: string; subdomain: string }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sanitizedPixelId = /^[a-zA-Z0-9]+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  const trackPageView = useCallback(() => {
    if (!sanitizedPixelId) return;
    if (typeof window !== "undefined" && (window as any).ttq && typeof (window as any).ttq.page === "function") {
      (window as any).ttq.page();
    }
    // CAPI PageView
    if (typeof window !== "undefined") {
      fetch(`/api/store/${subdomain}/tiktok/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "PageView",
          eventUrl: window.location.href,
          userAgent: navigator.userAgent,
          eventId: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
          userData: {},
          customData: {},
        }),
      }).catch(() => {});
    }
  }, [sanitizedPixelId, subdomain]);

  useEffect(() => {
    if (!scriptLoaded || !sanitizedPixelId) return;
    trackPageView();
  }, [pathname, searchParams, scriptLoaded, sanitizedPixelId, trackPageView]);

  if (!sanitizedPixelId) return null;

  return (
    <Script
      id={`tt-pixel-reseller-${subdomain}`}
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokSdkObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var e=0;e<ttq.methods.length;e++)ttq.setAndDefer(ttq,ttq.methods[e]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var i=d.getElementsByTagName("script")[0];i.parentNode.insertBefore(a,i)};
            ttq.load('${sanitizedPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}

interface ResellerPixelsProps {
  subdomain: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
}

export function ResellerPixels({ subdomain, metaPixelId, tiktokPixelId }: ResellerPixelsProps) {
  if (!metaPixelId && !tiktokPixelId) return null;
  return (
    <>
      {metaPixelId && (
        <Suspense fallback={null}>
          <FacebookPixelScript pixelId={metaPixelId} subdomain={subdomain} />
        </Suspense>
      )}
      {tiktokPixelId && (
        <Suspense fallback={null}>
          <TikTokPixelScript pixelId={tiktokPixelId} subdomain={subdomain} />
        </Suspense>
      )}
    </>
  );
}
