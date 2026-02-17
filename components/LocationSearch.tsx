"use client";

import { Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";

export interface LocationResult {
  name: string;
  addressLine: string;
  lat: number;
  lng: number;
}

export default function LocationSearch({
  onSelect,
}: {
  onSelect: (loc: LocationResult) => void;
}) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  return (
    <Autocomplete
      onLoad={(a) => (autocompleteRef.current = a)}
      onPlaceChanged={() => {
        const place = autocompleteRef.current?.getPlace();

        if (!place?.geometry) return;

        onSelect({
          name: place.name || "",
          addressLine: place.formatted_address || "",
          lat: place.geometry.location!.lat(),
          lng: place.geometry.location!.lng(),
        });
      }}
    >
      <input
        className="border px-3 py-2 rounded w-full"
        placeholder="Search business location..."
      />
    </Autocomplete>
  );
}
