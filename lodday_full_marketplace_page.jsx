"use client";

import { motion } from "framer-motion";
import { Star, Crown, Instagram, Facebook, Youtube, MapPin, Phone } from "lucide-react";

const allBusinesses = [
  {
    name: "Radiant Looks",
    category: "Hair & Beauty",
    rating: 4.9,
    priority: true,
    location: "Westlands, Nairobi",
    phone: "+254 712 345 678",
    services: ["Knotless Braids", "Silk Press", "Luxury Wig Install"],
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
  },
  {
    name: "Elegant Occasions",
    category: "Event Decor",
    rating: 4.8,
    priority: false,
    location: "Kilimani",
    phone: "+254 733 222 111",
    services: ["Wedding Decor", "Birthday Setup", "Corporate Events"],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552"
  },
  {
    name: "Alba Glam Studio",
    category: "Makeup",
    rating: 5.0,
    priority: true,
    location: "CBD, Nairobi",
    phone: "+254 701 987 654",
    services: ["Bridal Makeup", "Soft Glam", "Photoshoot Glam"],
    image: "https://images.unsplash.com/photo-1487412912498-0447578fcca8"
  },
  {
    name: "Urban Braids Hub",
    category: "Hair Styling",
    rating: 4.7,
    priority: false,
    location: "Runda",
    phone: "+254 710 555 444",
    services: ["Box Braids", "Cornrows", "Twists"],
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1"
  }
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function FullMarketplacePage() {
  const priorityBusinesses = allBusinesses.filter(b => b.priority);
  const normalBusinesses = allBusinesses.filter(b => !b.priority);

  return (
    <div className="min-h-screen bg-[#15616D] text-white">

      {/* HEADER */}
      <div className="px-12 py-10">
        <h1 className="text-4xl font-black tracking-wide">
          LOD<span className="text-[#FE7F2D]">DAY</span> MARKETPLACE
        </h1>
        <p className="text-[#C2E0E0] mt-3">
          Explore all verified businesses on Lodday.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-10 px-12 pb-20">

        {/* LEFT SIDE */}
        <div className="lg:col-span-3 space-y-16">

          {/* PRIORITY SECTION */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-wide">FEATURED BUSINESSES</h2>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 gap-6"
            >
              {priorityBusinesses.map((biz, i) => (
                <motion.div key={i} variants={item}>
                  <div className="flex bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-500">

                    <div className="w-1/3 relative">
                      <div className="absolute top-4 left-4 bg-[#FE7F2D] text-black text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold z-20">
                        <Crown size={14} /> PRIORITY
                      </div>
                      <img src={biz.image} alt={biz.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="w-2/3 p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold">{biz.name}</h3>
                        <p className="text-sm text-[#C2E0E0]">{biz.category}</p>
                        <div className="flex items-center gap-2 mt-2 text-[#FE7F2D]">
                          <Star size={14} fill="#FE7F2D" /> {biz.rating}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#FE7F2D]" />
                          <span>{biz.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-[#FE7F2D]" />
                          <span>{biz.phone}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-[#FFECD1]">Services Offered</h4>
                        <div className="flex flex-wrap gap-2">
                          {biz.services.map((service, idx) => (
                            <span key={idx} className="text-xs bg-white/20 border border-white/30 px-3 py-1 rounded-full">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button className="bg-[#FE7F2D] text-black py-2 rounded-xl font-bold hover:opacity-90 transition">
                        View Business
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-white/30 pt-10">
            <h2 className="text-2xl font-bold tracking-wide mb-6">ALL BUSINESSES</h2>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {normalBusinesses.map((biz, i) => (
                <motion.div key={i} variants={item}>
                  <div className="rounded-3xl overflow-hidden bg-white/15 backdrop-blur-2xl border border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-500 aspect-square flex flex-col">
                    <img src={biz.image} alt={biz.name} className="h-2/3 w-full object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="text-sm font-bold">{biz.name}</h3>
                      <p className="text-xs text-[#C2E0E0]">{biz.category}</p>
                      <div className="flex items-center gap-2 mt-2 text-[#FE7F2D] text-xs">
                        <Star size={12} fill="#FE7F2D" /> {biz.rating}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 h-fit"
        >
          <h2 className="text-2xl font-bold mb-6">Boost Your Visibility</h2>
          <p className="text-[#C2E0E0] text-sm mb-8">
            Request to feature your business on Lodday's official social media pages.
          </p>

          <div className="space-y-6">
            <button className="w-full flex items-center justify-between bg-white/20 border border-white/30 rounded-xl px-5 py-4 hover:bg-white/30 transition">
              <div className="flex items-center gap-3">
                <Instagram size={20} /> Instagram Feature
              </div>
              <span className="text-sm text-[#FE7F2D]">KES 2,000</span>
            </button>

            <button className="w-full flex items-center justify-between bg-white/20 border border-white/30 rounded-xl px-5 py-4 hover:bg-white/30 transition">
              <div className="flex items-center gap-3">
                <Facebook size={20} /> Facebook Promotion
              </div>
              <span className="text-sm text-[#FE7F2D]">KES 1,500</span>
            </button>

            <button className="w-full flex items-center justify-between bg-white/20 border border-white/30 rounded-xl px-5 py-4 hover:bg-white/30 transition">
              <div className="flex items-center gap-3">
                <Youtube size={20} /> Video Spotlight
              </div>
              <span className="text-sm text-[#FE7F2D]">KES 3,500</span>
            </button>
          </div>

          <button className="mt-10 w-full bg-[#FE7F2D] py-3 rounded-xl font-bold text-black hover:opacity-90 transition">
            Request Marketing
          </button>
        </motion.div>

      </div>

      {/* FOOTER */}
      <footer className="px-12 py-10 border-t border-white/20 text-sm text-[#C2E0E0]">
        © {new Date().getFullYear()} Lodday Marketplace
      </footer>

    </div>
  );
}
