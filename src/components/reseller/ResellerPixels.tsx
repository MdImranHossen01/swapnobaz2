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

  const sanitizedPixelId = pixelId && /^\d+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  // Mark the pixel as ready — works whether we loaded fbevents.js freshly or fbq already existed.
  const markReady = useCallback(() => {
    if (sanitizedPixelId && typeof window !== "undefined") {
      (window as any)[`_resellerPixelReady_${sanitizedPixelId}`] = true;
    }
    setScriptLoaded(true);
  }, [sanitizedPixelId]);

  // If fbevents.js was already loaded by an earlier pixel (e.g. during development hot-reload
  // or if another script loaded it), the <Script> tag's onLoad may never fire because the
  // browser won't re-download a cached script. In that case we detect fbq and init manually.
  useEffect(() => {
    if (!sanitizedPixelId) return;
    if (typeof window === "undefined") return;
    if ((window as any).fbq) {
      // fbevents.js already present — just init our pixel ID and mark ready.
      (window as any).fbq('dataProcessingOptions', []);
      (window as any).fbq('set', 'autoConfig', false, sanitizedPixelId);
      (window as any).fbq('init', sanitizedPixelId);
      markReady();
    }
  }, [sanitizedPixelId, markReady]);

  const trackPageView = useCallback(() => {
    if (!sanitizedPixelId) return;
    import("@/lib/reseller-pixel").then(({ resellerFbEvent }) => {
      resellerFbEvent(subdomain, "PageView", {}, {}, undefined, sanitizedPixelId);
    });
  }, [sanitizedPixelId, subdomain]);

  useEffect(() => {
    if (!scriptLoaded || !sanitizedPixelId) return;
    trackPageView();
  }, [pathname, searchParams, scriptLoaded, sanitizedPixelId, trackPageView]);

  if (!sanitizedPixelId) return null;

  return (
    <>
      {/*
        Multi-pixel safe init:
        - We do NOT use the standard `if(f.fbq)return` guard because it exits before
          calling fbq('init', resellerPixelId) when another pixel already loaded fbevents.js.
        - Instead: only load fbevents.js if window.fbq is absent; always call fbq('init', id).
        - The window flag `_resellerPixelReady_<pixelId>` is set so waitForResellerPixel()
          can distinguish "reseller pixel ready" from "some other fbq exists".
      */}
      <Script
        id={`fb-pixel-reseller-${subdomain}`}
        strategy="afterInteractive"
        onLoad={markReady}
        dangerouslySetInnerHTML={{
          __html: `
            (function(f,b,e,v,n,t,s) {
              if (!f.fbq) {
                n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s);
              }
              // Always init the reseller pixel ID — safe to call even if fbq already exists.
              f.fbq('dataProcessingOptions', []);
              f.fbq('set', 'autoConfig', false, '${sanitizedPixelId}');
              f.fbq('init', '${sanitizedPixelId}');
              f['_resellerPixelReady_${sanitizedPixelId}'] = true;
            })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${sanitizedPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

function TikTokPixelScript({ pixelId, subdomain }: { pixelId: string; subdomain: string }) {
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sanitizedPixelId = pixelId && /^[a-zA-Z0-9]+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && (window as any).ttq) {
      setScriptLoaded(true);
    }
  }, []);

  const trackPageView = useCallback(() => {
    if (!sanitizedPixelId) return;
    import("@/lib/reseller-pixel").then(({ resellerTtEvent }) => {
      resellerTtEvent(subdomain, "PageView");
    });
  }, [sanitizedPixelId, subdomain]);

  useEffect(() => {
    if (!mounted || !sanitizedPixelId || !scriptLoaded) return;
    trackPageView();
  }, [pathname, searchParams, scriptLoaded, sanitizedPixelId, trackPageView, mounted]);

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
