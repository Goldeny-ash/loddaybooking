"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Filter,
  MapPin,
  Search,
  Star,
  X,
} from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/marketplace";
import { kenyaAdministrative } from "@/lib/constants/kenyaAdministrative";

interface Props {
  businesses: MarketplaceBusiness[];
  title?: string;
  subtitle?: string;
  backHref?: string;
  initialCounty?: string;
  initialArea?: string;
  initialQuery?: string;
  initialCategory?: string;
  initialPriceTier?: PriceTier;
  initialAvailability?: AvailabilityFilter;
  initialSortMode?: SortMode;
}

type AvailabilityFilter = "any" | "today" | "tomorrow";
type PriceTier = "any" | "under-1000" | "1000-3000" | "3000-plus";
type SortMode = "recommended" | "top-rated" | "price-low-high";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatPrice(price?: number | null) {
  if (!price) return "Price on booking page";
  return `KSh ${price.toLocaleString()}`;
}

function scoreForBusiness(business: MarketplaceBusiness, index: number) {
  const base = 4.4 + ((business.tags.length + business.services.length + index) % 5) * 0.1;
  return base.toFixed(1);
}

function formatCardLocation(business: MarketplaceBusiness) {
  return (
    [business.area, business.ward].filter(Boolean).join(", ") ||
    business.location ||
    business.county ||
    "Kenya"
  );
}

function formatCardBadge(business: MarketplaceBusiness) {
  return business.area || business.location || business.ward || "Kenya";
}

function serviceStartLabel(price?: number | null) {
  if (!price) return "Services start on booking page";
  return `Services start from KES ${price.toLocaleString()}`;
}

function getAreasForCounty(county: string) {
  const units =
    !county || county === "All Counties"
      ? kenyaAdministrative
      : kenyaAdministrative.filter((item) => item.county === county);
  if (units.length === 0) return [];

  const values = units.flatMap((unit) =>
    unit.subCounties.flatMap((subCounty) =>
      (subCounty.wards || []).flatMap((ward) => {
        if (typeof ward === "string") return [ward];
        return [ward.name, ...(ward.areas || [])];
      })
    )
  );

  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function matchesBusinessCounty(business: MarketplaceBusiness, county: string) {
  if (!county || county === "All Counties") return true;
  return normalize(business.county || "").includes(normalize(county));
}

function matchesArea(business: MarketplaceBusiness, area: string) {
  if (!area || area === "All Areas") return true;
  const haystack = [
    business.location,
    business.county,
    business.subCounty,
    business.ward,
    ...business.tags,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(area.toLowerCase());
}

function matchesPriceTier(price: number | null | undefined, priceTier: PriceTier) {
  if (priceTier === "any") return true;
  if (price === null || price === undefined) return true;
  if (priceTier === "under-1000") return price < 1000;
  if (priceTier === "1000-3000") return price >= 1000 && price <= 3000;
  return price > 3000;
}

function matchesAvailability(business: MarketplaceBusiness, availability: AvailabilityFilter) {
  if (availability === "any") return true;
  if (availability === "today") return business.availableToday === undefined ? true : Boolean(business.availableToday);
  return business.availableTomorrow === undefined ? true : Boolean(business.availableTomorrow);
}

function sortBusinesses(items: MarketplaceBusiness[], sortMode: SortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === "top-rated") {
      if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
      return Number(scoreForBusiness(b, 0)) - Number(scoreForBusiness(a, 0));
    }
    if (sortMode === "price-low-high") {
      if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
      return (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER);
    }

    if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;

    const aScore = (a.featured ? 2 : 0) + (a.availableToday ? 1 : 0) + (a.priceFrom ? 1 : 0);
    const bScore = (b.featured ? 2 : 0) + (b.availableToday ? 1 : 0) + (b.priceFrom ? 1 : 0);
    return bScore - aScore;
  });
}

export default function MarketplaceAllBusinessesClient({
  businesses,
  title = "Browse businesses",
  subtitle = "All businesses",
  backHref = "/",
  initialCounty = "All Counties",
  initialArea = "All Areas",
  initialQuery = "",
  initialCategory = "All",
  initialPriceTier = "any",
  initialAvailability = "any",
  initialSortMode = "recommended",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCounty, setSelectedCounty] = useState(initialCounty);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceTier, setPriceTier] = useState<PriceTier>(initialPriceTier);
  const [availability, setAvailability] = useState<AvailabilityFilter>(initialAvailability);
  const [sortMode, setSortMode] = useState<SortMode>(initialSortMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counties = useMemo(
    () => kenyaAdministrative.map((item) => item.county).sort((a, b) => a.localeCompare(b)),
    []
  );

  const categories = useMemo(() => {
    const values = Array.from(new Set(businesses.flatMap((business) => business.categories.filter(Boolean))));
    return ["All", ...values.sort((a, b) => a.localeCompare(b))];
  }, [businesses]);

  const areaOptions = useMemo(() => getAreasForCounty(selectedCounty), [selectedCounty]);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = normalize(query);

    const filtered = businesses.filter((business) => {
      const matchesCounty = matchesBusinessCounty(business, selectedCounty);
      const matchesSelectedArea = matchesArea(business, selectedArea);
      const matchesCategory =
        selectedCategory === "All" ||
        business.categories.some((category) => normalize(category) === normalize(selectedCategory));
      const matchesPrice = matchesPriceTier(business.priceFrom, priceTier);
      const matchesDay = matchesAvailability(business, availability);

      if (!matchesCounty || !matchesSelectedArea || !matchesCategory || !matchesPrice || !matchesDay) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        business.name,
        business.description,
        business.location,
        business.county,
        business.subCounty,
        business.ward,
        business.username,
        ...business.categories,
        ...business.services,
        ...business.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return sortBusinesses(filtered, sortMode);
  }, [availability, businesses, priceTier, query, selectedArea, selectedCategory, selectedCounty, sortMode]);

  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
    setSelectedArea("All Areas");
  };

  const clearFilters = () => {
    setSelectedCounty("All Counties");
    setSelectedArea("All Areas");
    setSelectedCategory("All");
    setPriceTier("any");
    setAvailability("any");
    setSortMode("recommended");
  };

  return (
    <div className="px-3 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
          <div className="mb-3 flex items-center gap-3">
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f4ef] px-4 py-3">
                <Search size={16} className="text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#ffcab0] bg-[#fff1e7] px-4 py-3 text-sm font-semibold text-[#f05a28]"
            >
              <Filter size={16} />
              Filter
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              
              <h1 className="mt-1 font-serif text-2xl text-[#111827]">{title}</h1>
            </div>
            <div className="text-sm text-slate-500">{filteredBusinesses.length} results</div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business, index) => (
              <article
                key={business.id}
                className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.14)]"
              >
                <div className="relative min-h-[11rem] bg-[linear-gradient(135deg,#0f5a66_0%,#1f2937_100%)] p-4 text-white">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={`${business.name} logo`}
                      className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold">
                        {formatCardBadge(business)}
                      </span>
                   
                    </div>
                    <div>
                      <h2 className="line-clamp-2 font-serif text-lg leading-tight">{business.name}</h2>
                    
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[13.5rem] flex-col p-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Star size={12} className="fill-[#FE7F2D] text-[#FE7F2D]" />
                      <span>{scoreForBusiness(business, index)}</span>
                    </div>
                    <div className="rounded-full bg-[#f7f4ef] px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                      @{business.username}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eef3f5] px-2.5 py-1 text-[10px] font-medium text-[#15616D]">
                      {business.serviceCount} service{business.serviceCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-[#fff1e7] px-2.5 py-1 text-[10px] font-medium text-[#78290F]">
                      {business.bookingCount} booking{business.bookingCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-slate-600">{business.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
                    <MapPin size={12} className="text-[#FE7F2D]" />
                    <span className="line-clamp-1">{formatCardLocation(business)}</span>
                  </div>
                 
                  {business.availableToday || business.availableTomorrow ? (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                      <CalendarDays size={12} className="text-[#15616D]" />
                      <span>{business.availableToday ? "Available today" : "Available tomorrow"}</span>
                    </div>
                  ) : null}
                  <a
                    href={business.bookingUrl}
                    className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#111827] px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    Book now
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-black/10 bg-white p-8 text-center">
              <h2 className="font-serif text-2xl text-[#111827]">No results found</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Try broader categories, nearby locations, or a shorter search phrase to discover more businesses.
              </p>
            </div>
          ) : null}
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/45">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-[#f7f4ef] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#78290F]/60">
                  Filters
                </p>
                <h3 className="mt-2 font-serif text-2xl text-[#111827]">Refine browse page</h3>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full bg-white p-3 text-slate-600 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-black/5 bg-[#f7f4ef] px-4 py-3 text-sm text-[#111827] outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">County</label>
                <div className="relative">
                  <select
                    value={selectedCounty}
                    onChange={(event) => handleCountyChange(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-black/5 bg-[#f7f4ef] px-4 py-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="All Counties">All Counties</option>
                    {counties.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Area</label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(event) => setSelectedArea(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-black/5 bg-[#f7f4ef] px-4 py-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="All Areas">All Areas</option>
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Sort by</label>
                <div className="relative">
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="w-full appearance-none rounded-2xl border border-black/5 bg-[#f7f4ef] px-4 py-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="top-rated">Top rated</option>
                    <option value="price-low-high">Price: Low to High</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "any", label: "Any price" },
                  { value: "under-1000", label: "Under 1,000" },
                  { value: "1000-3000", label: "1,000 - 3,000" },
                  { value: "3000-plus", label: "3,000+" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriceTier(option.value as PriceTier)}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      priceTier === option.value ? "bg-[#111827] text-white" : "bg-[#f7f4ef] text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "any", label: "Any day" },
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAvailability(option.value as AvailabilityFilter)}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      availability === option.value ? "bg-[#111827] text-white" : "bg-[#f7f4ef] text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#111827] px-4 py-3 text-sm font-semibold text-white"
                >
                  Show {filteredBusinesses.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
