"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  Compass,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import { kenyaAdministrative } from "@/lib/constants/kenyaAdministrative";

export interface MarketplaceBusiness {
  id: string;
  name: string;
  username: string;
  description: string;
  location: string;
  area?: string;
  county?: string;
  subCounty?: string;
  ward?: string;
  phone: string;
  logo?: string;
  bookingUrl: string;
  website?: string;
  services: string[];
  serviceCount: number;
  bookingCount: number;
  categories: string[];
  tags: string[];
  featured: boolean;
  priceFrom?: number | null;
  availableToday?: boolean;
  availableTomorrow?: boolean;
  createdAt?: string;
}

interface Props {
  businesses: MarketplaceBusiness[];
  totalBusinesses: number;
  totalCategories: number;
}

type AvailabilityFilter = "any" | "today" | "tomorrow";
type PriceTier = "any" | "under-1000" | "1000-3000" | "3000-plus";
type SortMode = "recommended" | "top-rated" | "price-low-high";

const faqItems = [
  {
    question: "How does the Lodday Marketplace work?",
    answer:
      "Customers browse businesses, compare services and locations, then click through to each business booking page on booking.lodday.com.",
  },
  {
    question: "Can I book directly from a business card?",
    answer:
      "Yes. Every business card has a direct booking link that takes the customer to that business's online booking page.",
  },
  {
    question: "Why is this page good for SEO?",
    answer:
      "The marketplace is server-rendered, includes crawlable business links, descriptive copy, canonical metadata, and structured data to help Google understand the directory.",
  },
];

const showcaseGradients = [
  "from-[#0f5a66] via-[#134750] to-[#08242d]",
  "from-[#5a3415] via-[#3f2210] to-[#1f120b]",
  "from-[#2f4f7e] via-[#1d3453] to-[#111827]",
  "from-[#5f3d71] via-[#33203f] to-[#17131d]",
];

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreForBusiness(business: MarketplaceBusiness, index: number) {
  const base = 4.4 + ((business.tags.length + business.services.length + index) % 5) * 0.1;
  return Number(base.toFixed(1));
}

function getCategoryVisual(category: string) {
  const value = category.toLowerCase();

  if (value.includes("hair")) return "Hair";
  if (value.includes("barber")) return "Barber";
  if (value.includes("nail")) return "Nails";
  if (value.includes("makeup")) return "Makeup";
  if (value.includes("spa")) return "Spa";
  if (value.includes("beauty")) return "Beauty";
  return category;
}

function slugifyCategory(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    business.area,
    business.county,
    business.subCounty,
    business.ward,
    ...business.tags,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(area.toLowerCase());
}

function inferCountyFromBusiness(business: MarketplaceBusiness) {
  if (business.county) return business.county;
  const haystack = [business.area, business.subCounty, business.ward].join(" ").toLowerCase();
  const match = kenyaAdministrative.find((item) => haystack.includes(item.county.toLowerCase()));
  return match?.county || "";
}

function formatPrice(price?: number | null) {
  if (!price) return "Price on booking page";
  return `From KES ${price.toLocaleString()}`;
}

function displayLocationForCard(business: MarketplaceBusiness) {
  return (
    [business.area, business.ward].filter(Boolean).join(", ") ||
    business.location ||
    business.county ||
    "Kenya"
  );
}

function displayBadgeLabel(business: MarketplaceBusiness) {
  return business.area || business.location || business.ward || "Kenya";
}

function serviceStartLabel(price?: number | null) {
  if (!price) return "Services start on booking page";
  return `Services start from KES ${price.toLocaleString()}`;
}

function locationForCard(business: MarketplaceBusiness) {
  return (
    [business.ward, business.area].filter(Boolean).join(", ") ||
    business.area ||
    business.county ||
    "Kenya"
  );
}

function cardBadgeLabel(business: MarketplaceBusiness) {
  return business.area || business.ward || business.area || "Kenya";
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
  if (availability === "today") {
    return business.availableToday === undefined ? true : Boolean(business.availableToday);
  }
  return business.availableTomorrow === undefined ? true : Boolean(business.availableTomorrow);
}

function sortBusinesses(items: MarketplaceBusiness[], sortMode: SortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === "top-rated") {
      if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
      return scoreForBusiness(b, 0) - scoreForBusiness(a, 0);
    }

    if (sortMode === "price-low-high") {
      if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
      const aPrice = a.priceFrom ?? Number.MAX_SAFE_INTEGER;
      const bPrice = b.priceFrom ?? Number.MAX_SAFE_INTEGER;
      return aPrice - bPrice;
    }

    if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;

    const aScore =
      (a.featured ? 2 : 0) +
      (a.availableToday ? 1 : 0) +
      (a.services.length > 0 ? 1 : 0) +
      (a.priceFrom ? 1 : 0);
    const bScore =
      (b.featured ? 2 : 0) +
      (b.availableToday ? 1 : 0) +
      (b.services.length > 0 ? 1 : 0) +
      (b.priceFrom ? 1 : 0);

    return bScore - aScore;
  });
}

function MobileCountUp({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const duration = 900;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const nextValue = Math.max(1, Math.round(1 + (value - 1) * progress));
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function scrollRail(element: HTMLDivElement | null, direction: "left" | "right") {
  if (!element) return;
  const amount = Math.max(element.clientWidth * 0.82, 260);
  element.scrollBy({
    left: direction === "right" ? amount : -amount,
    behavior: "smooth",
  });
}

function SearchableDropdown({
  icon,
  value,
  options,
  allLabel,
  placeholder,
  onChange,
  dark = false,
}: {
  icon: ReactNode;
  value: string;
  options: string[];
  allLabel: string;
  placeholder: string;
  onChange: (value: string) => void;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalize(search);
    const values = [allLabel, ...options];
    if (!normalizedSearch) return values;
    return values.filter((option) => normalize(option).includes(normalizedSearch));
  }, [allLabel, options, search]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-[1.4rem] px-4 py-4 text-left ${
          dark ? "bg-white text-slate-600" : "bg-[#f7f4ef] text-[#111827]"
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-sm">{value || allLabel}</span>
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.35rem] border border-black/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
          <div className="border-b border-black/5 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#f7f4ef] px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setSearch("");
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${
                  value === option
                    ? "bg-[#111827] text-white"
                    : "text-slate-600 hover:bg-[#f7f4ef]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface FilterPanelProps {
  categories: string[];
  counties: string[];
  areaOptions: string[];
  activeCategory: string;
  selectedCounty: string;
  selectedArea: string;
  priceTier: PriceTier;
  availability: AvailabilityFilter;
  sortMode: SortMode;
  onCategoryChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onPriceTierChange: (value: PriceTier) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onSortModeChange: (value: SortMode) => void;
  onClear: () => void;
  applyHref: string;
  resultCount: number;
  compact?: boolean;
}

function FilterPanel({
  categories,
  counties,
  areaOptions,
  activeCategory,
  selectedCounty,
  selectedArea,
  priceTier,
  availability,
  sortMode,
  onCategoryChange,
  onCountyChange,
  onAreaChange,
  onPriceTierChange,
  onAvailabilityChange,
  onSortModeChange,
  onClear,
  applyHref,
  resultCount,
  compact = false,
}: FilterPanelProps) {
  return (
    <div className={`rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm ${compact ? "" : "sticky top-28"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#78290F]/60">
            Filters
          </p>
          <h3 className="mt-2 font-serif text-2xl text-[#111827]">Refine results</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-[#15616D] underline-offset-4 hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Category</label>
          <div className="relative">
            <select
              value={activeCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
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
          <SearchableDropdown
            icon={<MapPin size={16} className="text-[#FE7F2D]" />}
            value={selectedCounty}
            options={counties}
            allLabel="All Counties"
            placeholder="Search counties"
            onChange={onCountyChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Area</label>
          <SearchableDropdown
            icon={<Compass size={16} className="text-[#15616D]" />}
            value={selectedArea}
            options={areaOptions}
            allLabel="All Areas"
            placeholder="Search areas"
            onChange={onAreaChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Price range</label>
          <div className="grid gap-2">
            {[
              { value: "any", label: "Any price" },
              { value: "under-1000", label: "Under KES 1,000" },
              { value: "1000-3000", label: "KES 1,000 - 3,000" },
              { value: "3000-plus", label: "Above KES 3,000" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onPriceTierChange(option.value as PriceTier)}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                  priceTier === option.value
                    ? "bg-[#111827] text-white"
                    : "bg-[#f7f4ef] text-slate-600 hover:bg-[#ece6dc]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Availability</label>
          <div className="grid gap-2">
            {[
              { value: "any", label: "Any day" },
              { value: "today", label: "Available today" },
              { value: "tomorrow", label: "Available tomorrow" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onAvailabilityChange(option.value as AvailabilityFilter)}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                  availability === option.value
                    ? "bg-[#111827] text-white"
                    : "bg-[#f7f4ef] text-slate-600 hover:bg-[#ece6dc]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">Sort by</label>
          <div className="relative">
            <select
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value as SortMode)}
              className="w-full appearance-none rounded-2xl border border-black/5 bg-[#f7f4ef] px-4 py-3 text-sm text-[#111827] outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="top-rated">Top rated</option>
              <option value="price-low-high">Price: Low to High</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <Link
        href={applyHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white"
      >
        View {resultCount} result{resultCount === 1 ? "" : "s"}
      </Link>
    </div>
  );
}

export default function MarketplaceDirectoryClient({
  businesses,
  totalBusinesses,
  totalCategories,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [priceTier, setPriceTier] = useState<PriceTier>("any");
  const [availability, setAvailability] = useState<AvailabilityFilter>("any");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const featuredRailRef = useRef<HTMLDivElement | null>(null);
  const businessRailRef = useRef<HTMLDivElement | null>(null);

  const handleMarketplaceSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    router.push(`/marketplace/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleMarketplaceSearch();
  };

  const counties = useMemo(
    () => kenyaAdministrative.map((item) => item.county).sort((a, b) => a.localeCompare(b)),
    []
  );

  const normalizedBusinesses = useMemo(
    () =>
      businesses.map((business) => ({
        ...business,
        county: business.county || inferCountyFromBusiness(business),
      })),
    [businesses]
  );

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(normalizedBusinesses.flatMap((business) => business.categories.filter(Boolean)))
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...values];
  }, [normalizedBusinesses]);

  const areaOptions = useMemo(() => getAreasForCounty(selectedCounty), [selectedCounty]);
  const buildFilteredResultsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (selectedCounty && selectedCounty !== "All Counties") params.set("county", selectedCounty);
    if (selectedArea && selectedArea !== "All Areas") params.set("area", selectedArea);
    if (priceTier !== "any") params.set("price", priceTier);
    if (availability !== "any") params.set("availability", availability);
    if (sortMode !== "recommended") params.set("sort", sortMode);
    const queryString = params.toString();
    return queryString ? `/marketplace/filters?${queryString}` : "/marketplace/filters";
  }, [activeCategory, availability, priceTier, query, selectedArea, selectedCounty, sortMode]);
  const searchAllHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCounty && selectedCounty !== "All Counties") params.set("county", selectedCounty);
    if (selectedArea && selectedArea !== "All Areas") params.set("area", selectedArea);
    const queryString = params.toString();
    return queryString ? `/marketplace/all?${queryString}` : "/marketplace/all";
  }, [selectedArea, selectedCounty]);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = normalize(query);

    const filtered = normalizedBusinesses.filter((business) => {
      const matchesCategory =
        activeCategory === "All" ||
        business.categories.some((category) => normalize(category) === normalize(activeCategory));
      const matchesCounty = matchesBusinessCounty(business, selectedCounty);
      const matchesSelectedArea = matchesArea(business, selectedArea);
      const matchesPrice = matchesPriceTier(business.priceFrom, priceTier);
      const matchesDay = matchesAvailability(business, availability);

      if (!matchesCategory || !matchesCounty || !matchesSelectedArea || !matchesPrice || !matchesDay) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        business.name,
        business.description,
        business.area,
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
  }, [activeCategory, availability, normalizedBusinesses, priceTier, query, selectedArea, selectedCounty, sortMode]);

  const newestBusinesses = useMemo(
    () =>
      [...filteredBusinesses]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
          return bTime - aTime;
        })
        .slice(0, 10),
    [filteredBusinesses]
  );
  const categoryHighlights = categories.filter((category) => category !== "All").slice(0, 6);
  const previewBusinesses = filteredBusinesses.slice(0, 10);

  const clearFilters = () => {
    setActiveCategory("All");
    setSelectedCounty("All Counties");
    setSelectedArea("All Areas");
    setPriceTier("any");
    setAvailability("any");
    setSortMode("recommended");
  };

  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
    setSelectedArea("All Areas");
  };

  return (
    <div className="overflow-x-hidden bg-[#f7f4ef] text-[#101828]">
      <MarketplaceNavbar
        counties={counties}
        selectedCounty={selectedCounty}
        onCountyChange={setSelectedCounty}
        onOpenFilters={() => setMobileFiltersOpen(true)}
      />

      <section className="relative isolate min-h-[44rem] overflow-hidden bg-[#0f1723] px-4 pb-12 pt-28 sm:min-h-[52rem] sm:px-6 sm:pb-16 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(254,127,45,0.25),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(94,234,212,0.14),transparent_24%),linear-gradient(135deg,#0b1220_0%,#12192a_48%,#1e293b_100%)]" />
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-[#fe7f2d]/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full bg-[#15616d]/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur">
                <Compass size={14} />
                Lodday Marketplace
              </div>
              <h1 className="mt-6 font-serif text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                Find and book services near you.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
               Browse with confidence, then jump straight into the booking page.
              </p>

              <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/95 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <div className="rounded-[1.4rem] border border-black/5 bg-white">
                    <SearchableDropdown
                      icon={<MapPin size={18} className="text-[#FE7F2D]" />}
                      value={selectedCounty}
                      options={counties}
                      allLabel="All Counties"
                      placeholder="Search counties"
                      onChange={handleCountyChange}
                      dark
                    />
                  </div>

                  <div className="rounded-[1.4rem] border border-black/5 bg-white">
                    <SearchableDropdown
                      icon={<Compass size={18} className="text-[#15616D]" />}
                      value={selectedArea}
                      options={areaOptions}
                      allLabel="All Areas"
                      placeholder="Search areas"
                      onChange={setSelectedArea}
                      dark
                    />
                  </div>

                  <Link
                    href={searchAllHref}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-[#111827] px-6 py-4 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Search all
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>


              <div className="mt-8 sm:hidden">
                <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/8 p-2 backdrop-blur">
                  <div className="min-w-0 rounded-[1.1rem] bg-white/8 px-2 py-2 text-center">
                    <p className="text-lg font-serif leading-none">
                      <MobileCountUp value={10000} suffix="+" />
                    </p>
                    <p className="mt-1 text-[10px] leading-3 text-white/70">Bookings</p>
                  </div>
                  <div className="min-w-0 rounded-[1.1rem] bg-white/8 px-2 py-2 text-center">
                    <p className="text-lg font-serif leading-none">
                      <MobileCountUp value={Math.max(1, totalBusinesses)} suffix="+" />
                    </p>
                    <p className="mt-1 text-[10px] leading-3 text-white/70">Businesses</p>
                  </div>
                  <div className="min-w-0 rounded-[1.1rem] bg-white/8 px-2 py-2 text-center">
                    <p className="text-lg font-serif leading-none">
                      <MobileCountUp value={Math.max(1, totalCategories)} suffix="+" />
                    </p>
                    <p className="mt-1 text-[10px] leading-3 text-white/70">Categories</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 hidden gap-3 sm:mt-10 sm:grid sm:grid-cols-3 sm:gap-4">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-3xl font-serif">10k+</p>
                  <p className="mt-2 text-sm text-white/70">Bookings placed using Lodday</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-3xl font-serif">{totalBusinesses}+</p>
                  <p className="mt-2 text-sm text-white/70">Businesses discoverable on Lodday</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-3xl font-serif">{totalCategories}+</p>
                  <p className="mt-2 text-sm text-white/70">Service categories customers can explore</p>
                </div>
              </div>
            </div>

        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
              Discover around you
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[#111827]">
              Explore by category
            </h2>
           
          </div>

          <div className="mt-10 flex gap-4 overflow-x-auto px-1 pb-3 sm:mt-12 sm:gap-5 sm:px-0 sm:pb-4">
            {categoryHighlights.map((category, index) => {
              const gradient = showcaseGradients[index % showcaseGradients.length];
              const matchingCount = businesses.filter((business) =>
                business.categories.some((item) => normalize(item) === normalize(category))
              ).length;

              return (
                <Link
                  key={category}
                  href={`/marketplace/category/${slugifyCategory(category)}`}
                  className={`group relative min-h-[10.5rem] min-w-[15rem] overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br ${gradient} p-4 text-left text-white shadow-[0_20px_60px_rgba(15,23,42,0.15)] transition hover:-translate-y-1 sm:min-h-[12.5rem] sm:min-w-[18rem] sm:rounded-[2.4rem] sm:p-5`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_36%)]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                        {matchingCount.toString().padStart(2, "0")}
                      </span>
                      <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
                        Popular
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl sm:text-3xl">{getCategoryVisual(category)}</h3>
                      <p className="mt-2 text-sm text-white/72">
                        Discover businesses, compare styles, and jump directly into booking.
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {categoryHighlights.slice(0, Math.min(categoryHighlights.length, 5)).map((category, index) => (
              <span
                key={`${category}-${index}`}
                className={`h-2.5 rounded-full ${index === 0 ? "w-6 bg-[#15616D]" : "w-2.5 bg-slate-300"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {newestBusinesses.length > 0 ? (
        <section className="px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
                Fresh on Lodday
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#111827]">
                Discover recently added businesses
              </h2>
            </div>

            <div className="relative">
              <div
                ref={featuredRailRef}
                className="flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:px-0"
              >
                {newestBusinesses.map((business, index) => {
                const gradient = showcaseGradients[index % showcaseGradients.length];

                return (
                  <article
                    key={business.id}
                    className={`relative min-w-[18rem] max-w-[18rem] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${gradient} p-5 text-white shadow-[0_26px_80px_rgba(0,0,0,0.18)] sm:min-w-[20rem] sm:max-w-[20rem]`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_38%)]" />
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={`${business.name} cover`}
                        className="absolute inset-0 h-full w-full object-cover opacity-20"
                      />
                    ) : null}
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                          New
                        </span>
                        <span className="rounded-full bg-black/25 px-3 py-1 text-sm">
                          {scoreForBusiness(business, index)}
                        </span>
                      </div>
                      <div className="mt-12 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold">
                        {business.logo ? (
                          <img
                            src={business.logo}
                            alt={`${business.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initialsFor(business.name)
                        )}
                      </div>
                      <h3 className="mt-5 font-serif text-2xl leading-tight">{business.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/74">
                        {business.description}
                      </p>
                     
                      
                      <a
                        href={business.bookingUrl}
                        className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:scale-[0.99]"
                      >
                        Book now
                      </a>
                    </div>
                  </article>
                );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                {newestBusinesses.slice(0, Math.min(newestBusinesses.length, 5)).map((business, index) => (
                  <span
                    key={`${business.id}-${index}`}
                    className={`h-2.5 rounded-full ${index === 0 ? "w-6 bg-[#15616D]" : "w-2.5 bg-slate-300"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[110] bg-black/50 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-[#f7f4ef] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#78290F]/60">
                  Mobile Filters
                </p>
                <h3 className="mt-2 font-serif text-2xl text-[#111827]">Refine marketplace</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full bg-white p-3 text-slate-600 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <FilterPanel
              categories={categories}
              counties={counties}
              areaOptions={areaOptions}
              activeCategory={activeCategory}
              selectedCounty={selectedCounty}
              selectedArea={selectedArea}
              priceTier={priceTier}
              availability={availability}
              sortMode={sortMode}
              onCategoryChange={setActiveCategory}
              onCountyChange={handleCountyChange}
              onAreaChange={setSelectedArea}
              onPriceTierChange={setPriceTier}
              onAvailabilityChange={setAvailability}
              onSortModeChange={setSortMode}
              onClear={clearFilters}
              applyHref={buildFilteredResultsHref}
              resultCount={filteredBusinesses.length}
              compact
            />
          </div>
        </div>
      ) : null}

      <section id="directory" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleSearchSubmit} className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-black/5 bg-white px-4 py-3 shadow-sm">
              <Search size={16} className="shrink-0 text-[#15616D]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search businesses or services"
                className="w-full min-w-0 bg-transparent text-sm text-[#111827] outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#15616D] text-white shadow-sm"
              aria-label="Search marketplace"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white shadow-sm"
              aria-label="Open filters"
            >
              <Filter size={18} />
            </button>
          </form>

          <div className="mb-8 hidden items-center gap-3 lg:flex">
            <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-black/5 bg-white px-4 py-3 shadow-sm">
                <Search size={16} className="shrink-0 text-[#15616D]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search businesses or services"
                  className="w-full min-w-0 bg-transparent text-sm text-[#111827] outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#15616D] text-white shadow-sm"
                aria-label="Search marketplace"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <FilterPanel
                categories={categories}
                counties={counties}
                areaOptions={areaOptions}
                activeCategory={activeCategory}
                selectedCounty={selectedCounty}
                selectedArea={selectedArea}
                priceTier={priceTier}
                availability={availability}
                sortMode={sortMode}
                onCategoryChange={setActiveCategory}
                onCountyChange={handleCountyChange}
                onAreaChange={setSelectedArea}
                onPriceTierChange={setPriceTier}
                onAvailabilityChange={setAvailability}
                onSortModeChange={setSortMode}
                onClear={clearFilters}
                applyHref={buildFilteredResultsHref}
                resultCount={filteredBusinesses.length}
              />
            </aside>

            <div className="min-w-0">
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
                    Main Listing
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[#111827]">
                    Meet businesses you can book today
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <Link
                    href="/marketplace/all"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
                  >
                    See all
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="relative min-w-0">
                <div
                  ref={businessRailRef}
                  className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden px-1 pb-3 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-0"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
            {previewBusinesses.map((business, index) => {
              const gradient = showcaseGradients[index % showcaseGradients.length];

              return (
                <article
                  key={business.id}
                  className="w-[18rem] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.14)] sm:w-[20rem]"
                >
                  <div className="relative flex min-h-[29rem] flex-col overflow-hidden rounded-[1.95rem] bg-white">
                    <div className={`relative min-h-[13rem] bg-gradient-to-br ${gradient} p-5 text-white`}>
                      {business.logo ? (
                        <img
                          src={business.logo}
                          alt={`${business.name} visual`}
                          className="absolute inset-0 h-full w-full object-cover opacity-35"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />
                      <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold">
                          {displayBadgeLabel(business)}
                        </span>
                        
                      </div>

                      <div>
                        <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/12 text-base font-semibold">
                          {business.logo ? (
                            <img
                              src={business.logo}
                                alt={`${business.name} logo`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initialsFor(business.name)
                            )}
                          </div>
                          <h3 className="font-serif text-2xl leading-tight">{business.name}</h3>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-white/76">
                            {business.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Star size={15} className="fill-[#FE7F2D] text-[#FE7F2D]" />
                          <span>{scoreForBusiness(business, index)}</span>
                        </div>
                        <div className="rounded-full bg-[#f7f4ef] px-3 py-1 text-xs font-semibold text-slate-700">
                          @{business.username}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#eef3f5] px-3 py-1.5 text-xs font-medium text-[#15616D]">
                          {business.serviceCount} service{business.serviceCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-[#fff1e7] px-3 py-1.5 text-xs font-medium text-[#78290F]">
                          {business.bookingCount} booking{business.bookingCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-600">
                        {displayLocationForCard(business) ? (
                          <div className="flex items-center gap-2">
                            <MapPin size={15} className="text-[#FE7F2D]" />
                            <span>{displayLocationForCard(business)}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-auto pt-6">
                        <a
                          href={business.bookingUrl}
                          className="inline-flex w-full items-center justify-center rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                        >
                          Book now
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  {previewBusinesses.slice(0, Math.min(previewBusinesses.length, 5)).map((business, index) => (
                    <span
                      key={`${business.id}-${index}`}
                      className={`h-2.5 rounded-full ${
                        index === 0 ? "w-6 bg-[#15616D]" : "w-2.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {filteredBusinesses.length === 0 ? (
                <div className="mt-12 rounded-[2rem] border border-dashed border-black/10 bg-white p-10 text-center shadow-sm">
                  <Building2 size={34} className="mx-auto text-[#15616D]" />
                  <h3 className="mt-4 font-serif text-3xl text-[#111827]">
                    No businesses matched these filters
                  </h3>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Try a different county, category, price range, or availability selection to
                    discover more businesses on Lodday.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

   

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
              How it works
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[#111827]">
              Search, choose, and book in a few taps
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FE7F2D]">Step 1</p>
              <h3 className="mt-3 font-serif text-2xl text-[#111827]">Search for a service</h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Type a service, business name, or category, then narrow results with quick filters.
              </p>
            </article>
            <article className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FE7F2D]">Step 2</p>
              <h3 className="mt-3 font-serif text-2xl text-[#111827]">Pick the right business</h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Compare locations, services, and business details from image-led marketplace cards.
              </p>
            </article>
            <article className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FE7F2D]">Step 3</p>
              <h3 className="mt-3 font-serif text-2xl text-[#111827]">Book instantly</h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Open the business booking page and complete the appointment on Lodday Booking.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm"
              >
                <h3 className="font-serif text-2xl text-[#111827]">{item.question}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[2.2rem] bg-[linear-gradient(135deg,#111827_0%,#1f2937_60%,#0f5a66_100%)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                  Grow with Lodday
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight">
                  Own a salon, studio, or service business?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  Get discovered on the Lodday marketplace and send clients into your existing
                  booking flow.
                </p>
              </div>
              <Link
                href="/setup?mode=subscribe"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#111827] transition hover:scale-[0.99]"
              >
                List your business
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
