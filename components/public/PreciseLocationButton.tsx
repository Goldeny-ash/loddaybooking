"use client";

import { useState } from "react";
import { MapPinned } from "lucide-react";

interface Props {
  onLocationResolved: (payload: { lat: number; lng: number; mapsLink: string }) => void;
}

export default function PreciseLocationButton({ onLocationResolved }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    setIsLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
        onLocationResolved({ lat, lng, mapsLink });
        setIsLoading(false);
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Unable to get your current location."
        );
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerateLocation}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MapPinned className="h-4 w-4" />
        {isLoading ? "Generating precise location..." : "Generate precise location"}
      </button>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
