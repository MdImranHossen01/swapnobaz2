'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';

interface MapAddressSelectorProps {
  onSelectAddress: (address: { street: string; city: string }) => void;
}

export function MapAddressSelector({ onSelectAddress }: MapAddressSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const initMap = () => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Load Leaflet assets dynamically if not already loaded
    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setupLeafletMap();
      document.body.appendChild(script);
    } else {
      setupLeafletMap();
    }
  };

  const setupLeafletMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at Dhaka, Bangladesh
    const defaultLat = 23.8103;
    const defaultLng = 90.4125;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    markerInstanceRef.current = marker;

    const debounceTimeoutRef = { current: null as any };

    const handleLocationSelect = (lat: number, lng: number) => {
      setLoadingAddress(true);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/geocode?lat=${lat}&lng=${lng}`
          );
          const data = await response.json();
          if (data && data.address) {
            const street = data.display_name || `${data.address.road || ''}, ${data.address.suburb || ''}`;
            const city = data.address.city || data.address.town || data.address.state || 'Dhaka';
            onSelectAddress({ street, city });
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        } finally {
          setLoadingAddress(false);
        }
      }, 1000);
    };

    // On map click, move marker and fetch address
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      handleLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // On marker dragend, fetch address
    marker.on('dragend', (e: any) => {
      const position = marker.getLatLng();
      handleLocationSelect(position.lat, position.lng);
    });
  };

  useEffect(() => {
    if (mapOpen) {
      setTimeout(() => {
        initMap();
      }, 100);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapOpen]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMapOpen(!mapOpen)}
        className="w-full h-10 border-primary/20 text-xs font-semibold"
      >
        <MapPin className="h-4 w-4 mr-2 text-primary" />
        {mapOpen ? 'মানচিত্র বন্ধ করুন' : 'মানচিত্র থেকে অবস্থান নির্বাচন করুন'}
      </Button>

      {mapOpen && (
        <div className="border rounded-xl overflow-hidden bg-background">
          <div ref={mapContainerRef} className="h-60 w-full z-10" />
          {loadingAddress && (
            <div className="flex items-center justify-center p-2 text-xs text-muted-foreground bg-muted/30">
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              ঠিকানা খোঁজা হচ্ছে...
            </div>
          )}
          <p className="text-[10px] text-muted-foreground p-2 bg-muted/10 border-t">
            * মানচিত্রে যেকোনো স্থানে ক্লিক করে বা লাল পিনটি টেনে নিয়ে আপনার সঠিক ডেলিভারি ঠিকানা নির্বাচন করুন।
          </p>
        </div>
      )}
    </div>
  );
}
