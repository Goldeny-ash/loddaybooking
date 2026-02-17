"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  uploadPreset?: string; // Allows custom preset
  maxFiles?: number;     // Allows max file override
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  uploadPreset = "business_logos",
  maxFiles = 5,
}) => {
  const handleUpload = (result: any) => {
    if (result.event === "success") {
      const url = result.info.secure_url;
      onChange([...value, url]);
    }
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((v) => v !== url));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        {value.map((url) => (
          <div key={url} className="relative w-32 h-32">
            <Image src={url} alt="uploaded" fill className="object-cover rounded" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 bg-white p-1 rounded-full shadow hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ))}

        <CldUploadWidget
          uploadPreset={uploadPreset}
          onSuccess={handleUpload}
          options={{ maxFiles }}
        >
          {({ open }) => (
            <Button
              type="button"
              onClick={() => open()}
              className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded"
            >
              <Plus className="w-6 h-6 mb-1" />
              Upload
            </Button>
          )}
        </CldUploadWidget>
      </div>
    </div>
  );
};

export default ImageUpload;
