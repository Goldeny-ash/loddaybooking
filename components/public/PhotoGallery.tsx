"use client";

import Image from "next/image";

export default function PhotoGallery({
  photos = [],
}: {
  photos: string[];
}) {
  if (!photos.length) return null;

  return (
    <div className="grid grid-cols-3 gap-3 rounded-xl overflow-hidden">
      {photos.slice(0, 6).map((src, i) => (
        <div key={i} className="relative aspect-square">
          <Image
            src={src}
            alt="Business gallery"
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
