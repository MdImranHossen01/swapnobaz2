"use client";

/**
 * Reseller Storefront Pixel Tracking Utility
 * 
 * Mirrors the structure of fpixel.ts and tiktok.ts but:
 * - Posts to /api/store/[subdomain]/facebook/event (uses reseller's own Pixel ID/Token)
 * - Posts to /api/store/[subdomain]/tiktok/event
 * - Also fires browser-side via window.fbq and window.ttq (if loaded by ResellerPixels component)
 */

const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type UserData = {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  country?: string;
};

const TT_EVENT_MAP: Record<string, string> = {
  'PageView': 'PageView',
  'AddToCart': 'AddToCart',
  'AddToWishlist': 'AddToWishlist',
  'InitiateCheckout': 'InitiateCheckout',
  'Purchase': 'CompletePayment',
  'ViewContent': 'ViewContent',
  'Contact': 'Contact',
  'Search': 'Search',
};

export const resellerFbEvent = (
  subdomain: string,
  eventName: string,
  customData: Record<string, unknown> = {},
  userData: UserData = {},
  providedEventId?: string
) => {
  const eventId = providedEventId || generateEventId();

  // 1. Browser Pixel (if reseller pixel script is loaded)
  if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
    const standardEvents = [
      "ViewContent", "AddToCart", "AddToWishlist", "InitiateCheckout",
      "Purchase", "Lead", "PageView", "Contact", "Search"
    ];
    if (userData?.em || userData?.ph) {
      (window as any).fbq('set', 'user_data', {
        ...(userData.em && { em: userData.em.trim().toLowerCase() }),
        ...(userData.ph && { ph: userData.ph.replace(/\D/g, '') }),
        ...(userData.fn && { fn: userData.fn.trim().toLowerCase() }),
        ...(userData.ln && { ln: userData.ln.trim().toLowerCase() }),
        ...(userData.ct && { ct: userData.ct.trim().toLowerCase() }),
        ...(userData.st && { st: userData.st.trim().toLowerCase() }),
        ...(userData.country && { country: userData.country.trim().toLowerCase() }),
      });
    }
    if (standardEvents.includes(eventName)) {
      (window as any).fbq("track", eventName, customData, { eventID: eventId });
    } else {
      (window as any).fbq("trackCustom", eventName, customData, { eventID: eventId });
    }
  }

  // 2. Server-side CAPI using reseller's own pixel config
  if (typeof window !== "undefined") {
    fetch(`/api/store/${subdomain}/facebook/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({
        eventName,
        eventUrl: window.location.href,
        userAgent: navigator.userAgent,
        eventId,
        userData,
        customData,
      }),
    }).catch(() => { /* Fail silently */ });
  }

  return eventId;
};

export const resellerTtEvent = (
  subdomain: string,
  eventName: string,
  customData: Record<string, unknown> = {},
  userData: UserData = {},
  providedEventId?: string
) => {
  const eventId = providedEventId || generateEventId();
  const mappedEvent = TT_EVENT_MAP[eventName] || eventName;

  // 1. Browser TikTok Pixel (if loaded)
  if (typeof window !== "undefined" && (window as any).ttq && typeof (window as any).ttq.track === "function") {
    (window as any).ttq.track(mappedEvent, customData, { event_id: eventId });
  }

  // 2. Server-side Events API using reseller's own pixel config
  if (typeof window !== "undefined") {
    fetch(`/api/store/${subdomain}/tiktok/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: mappedEvent,
        eventUrl: window.location.href,
        userAgent: navigator.userAgent,
        eventId,
        userData,
        customData,
      }),
    }).catch(() => { /* Fail silently */ });
  }

  return eventId;
};
