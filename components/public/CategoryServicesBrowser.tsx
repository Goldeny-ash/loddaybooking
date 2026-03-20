"use client";

import { useEffect, useMemo } from "react";
import type { Service, Theme } from "@/components/public/PublicBookingPageClient";

interface CategoryServicesBrowserProps {
  services: Service[];
  theme: Theme;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const ALL_CATEGORY = "All";

export default function CategoryServicesBrowser({
  services,
  theme,
  selectedCategory,
  onCategoryChange,
}: CategoryServicesBrowserProps) {
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        services
          .map((service) => service.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    );

    return [ALL_CATEGORY, ...uniqueCategories];
  }, [services]);

  useEffect(() => {
    if (selectedCategory === ALL_CATEGORY) return;
    if (categories.includes(selectedCategory)) return;
    onCategoryChange(ALL_CATEGORY);
  }, [categories, selectedCategory]);

  return (
    <section className="space-y-5">
      <div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: theme.primaryDark || theme.primary }}>
            Browse by Category
          </h2>
          <p className="mt-1 text-sm opacity-80" style={{ color: theme.primaryDark || theme.primary }}>
            Choose a category to filter the main service listing below.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {categories.map((category) => {
          const isActive = category === selectedCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? theme.primary : "rgba(255,255,255,0.45)",
                color: isActive ? "#ffffff" : theme.primaryDark || theme.primary,
                borderColor: isActive ? theme.primary : `${theme.primary}33`,
                boxShadow: isActive ? `0 10px 25px ${theme.primary}33` : "none",
              }}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}
