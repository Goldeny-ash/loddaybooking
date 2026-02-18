"use client";

import { useState } from "react";
import { Search, Star, Crown } from "lucide-react";
import { motion } from "framer-motion";

// Businesses (priority businesses appear first)
const businesses = [
  {
    name: "Radiant Looks",
    category: "Hair & Beauty",
    rating: 4.9,
    price: "From KES 4,500",
    priority: true,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
  },
  {
    name: "Elegant Occasions",
    category: "Event Decor",
    rating: 4.8,
    price: "From KES 6,000",
    priority: false,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552"
  },
  {
    name: "Alba Glam Studio",
    category: "Makeup",
    rating: 5.0,
    price: "From KES 6,000",
    priority: true,
    image: "https://images.unsplash.com/photo-1487412912498-0447578fcca8"
  }
];

const services = [
  {
    title: "Luxury Gel Nails",
    vendor: "Aisha Nails Studio",
    price: "KES 1,200",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371"
  },
  {
    title: "Knotless Braids",
    vendor: "Zuri Hair Lounge",
    price: "KES 1,500",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1"
  },
  {
    title: "Bridal Makeup",
    vendor: "GlowUp Artists",
    price: "KES 6,000",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
  }
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function Marketplace() {
  const [query, setQuery] = useState("");

  const sortedBusinesses = [...businesses].sort(
    (a, b) => Number(b.priority) - Number(a.priority)
  );

  return (
    <div className="min-h-screen bg-[#15616D] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="flex justify-between items-center px-12 py-8">
        <h1 className="text-3xl font-black tracking-widest">
          LOD<span className="text-[#FE7F2D]">DAY</span>
        </h1>
        <div className="space-x-10 text-sm uppercase tracking-wide">
          <button className="hover:text-[#FE7F2D] transition">Hair</button>
          <button className="hover:text-[#FE7F2D] transition">Beauty</button>
          <button className="hover:text-[#FE7F2D] transition">Events</button>
          <button className="hover:text-[#FE7F2D] transition">Photography</button>
        </div>
      </nav>

      {/* HERO */}
      <motion.section
        variants={item}
        initial="hidden"
        animate="show"
        className="px-12 pt-10 pb-24 grid lg:grid-cols-2 gap-16 items-center"
      >
        <div>
          <h2 className="text-6xl lg:text-7xl font-extrabold leading-[1.05]">
            BOOK
            <br />
            <span className="text-[#FE7F2D]">EXCEPTIONAL</span>
            <br />
            SERVICES
          </h2>

          <p className="mt-8 text-xl text-[#C2E0E0] max-w-xl">
            Discover verified businesses and book premium local services instantly.
          </p>
        </div>
      </motion.section>

      {/* TOP BUSINESSES */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="px-12 pb-28"
      >
        <motion.h3 variants={item} className="text-4xl font-bold mb-12 tracking-wide">
          TOP BUSINESSES
        </motion.h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedBusinesses.map((biz, i) => (
            <motion.div
              key={i}
              variants={item}
              className="relative rounded-3xl overflow-hidden bg-white/15 backdrop-blur-2xl border border-white/30 transition-all duration-500 hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:-translate-y-3"
            >
              {biz.priority && (
                <div className="absolute top-4 left-4 bg-[#FE7F2D] text-black text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold z-20">
                  <Crown size={14} /> PRIORITY
                </div>
              )}

              <img
                src={biz.image}
                alt={biz.name}
                className="h-[280px] w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/50" />

              <div className="absolute bottom-0 p-6">
                <h4 className="text-xl font-bold">{biz.name}</h4>
                <p className="text-sm text-[#FFECD1] mt-1">{biz.category}</p>
                <div className="flex items-center gap-2 mt-4 text-[#FE7F2D]">
                  <Star size={16} fill="#FE7F2D" /> {biz.rating}
                </div>
                <p className="mt-3 text-lg font-semibold">{biz.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* APPLY SECTION */}
      <section className="px-12 pb-32">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/25 rounded-3xl p-12 max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold mb-6">List Your Business on Lodday</h3>
          <p className="text-[#C2E0E0] mb-10">
            Apply to join our curated marketplace. Get discovered by customers looking for trusted local services.
          </p>

          <div className="grid md:grid-cols-2 gap-8">

            <div className="bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl p-8">
              <h4 className="text-2xl font-bold mb-3">Standard Listing</h4>
              <p className="text-[#C2E0E0] mb-4">Free review by admin</p>
              <ul className="text-sm space-y-2 mb-6">
                <li>✔ Visible in marketplace</li>
                <li>✔ Appear in search results</li>
                <li>✔ Normal ranking</li>
              </ul>
              <button className="w-full bg-white text-[#15616D] py-3 rounded-xl font-bold">
                Apply Now
              </button>
            </div>

            <div className="bg-[#FE7F2D]/90 backdrop-blur-2xl border border-[#FE7F2D] rounded-2xl p-8 text-black">
              <h4 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Crown size={20} /> Priority Listing
              </h4>
              <p className="mb-4">KES 3,000 / month</p>
              <ul className="text-sm space-y-2 mb-6">
                <li>✔ Appears at top</li>
                <li>✔ Priority badge</li>
                <li>✔ Higher visibility</li>
              </ul>
              <button className="w-full bg-black text-white py-3 rounded-xl font-bold">
                Apply with Priority
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-12 py-12 border-t border-white/20 text-sm text-[#C2E0E0]">
        © {new Date().getFullYear()} Lodday. All rights reserved.
      </footer>

    </div>
  );
}
