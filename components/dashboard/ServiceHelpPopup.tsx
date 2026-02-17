"use client";
import React from "react";

interface ServiceHelpPopupProps {
  show: boolean;
  onClose: () => void;
}

export default function ServiceHelpPopup({ show, onClose }: ServiceHelpPopupProps) {
  if (!show) return null;

  return (
    <div className="fixed top-0 right-0 z-50 w-[400px] h-full bg-white shadow-lg border-l p-5 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Service Help Guide</h2>
        <button onClick={onClose} className="text-red-500 font-bold text-xl">×</button>
      </div>

      <p className="text-sm text-gray-700 mb-3">
        This guide will help you fill out the Add Service form. Each section includes examples so you know exactly what to enter.
      </p>

      <hr className="my-3" />

      <h3 className="font-semibold">1. Service Name & Description</h3>
      <p className="text-sm text-gray-700 mb-2">
        Name your service clearly and add a short description.
      </p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li><strong>Name Example:</strong> "Classic Blowout" or "Gel Manicure"</li>
        <li><strong>Description Example:</strong> "Includes wash, cut, and style for all hair types."</li>
      </ul>

      <h3 className="font-semibold">2. Category</h3>
      <p className="text-sm text-gray-700 mb-2">
        Pick a category. The form will show extra fields depending on your choice.
      </p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Hair, Nails, Waxing, Body Enhancements, Permanent Makeup (PMU), Makeup, Beauty Treatments</li>
      </ul>

      <h3 className="font-semibold">3. Category-Specific Fields</h3>
      <p className="text-sm text-gray-700 mb-2">Fill the fields that appear for your category.</p>

      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>
          <strong>Hair:</strong> <br />
          Length Tier: "Short / Medium / Long" <br />
          Density: "Thin / Medium / Thick" <br />
          Install Method: "Weave / Wig / Braid" <br />
          Retouch Type: "Full / Partial" <br />
          Brand Used: "L'Oreal, Wella"
        </li>

        <li>
          <strong>Nails:</strong> <br />
          Nail Type: "Acrylic / Gel / Natural" <br />
          Style: "French / Matte / Ombre"
        </li>

        <li>
          <strong>Body Enhancements:</strong> <br />
          Size: "Small / Medium / Large" <br />
          Color Type: "Black / Red / Custom"
        </li>

        <li>
          <strong>Permanent Makeup:</strong> <br />
          Technique: "Microblading / Ombre Brows" <br />
          Touch-Up Duration: "6" (months)
        </li>

        <li>
          <strong>Beauty Treatments:</strong> <br />
          Treatment Type: "Facial / Massage / Body Scrub" <br />
          Technique / Focus: "Anti-aging / Relaxation"
        </li>
      </ul>

      <h3 className="font-semibold">4. Staff</h3>
      <p className="text-sm text-gray-700 mb-2">
        Select staff who can perform this service. Only assigned staff will show this service to customers.
      </p>
      <p className="text-sm text-gray-700 mb-3"><em>Example:</em> Select Jane Doe and John Smith for Hair services.</p>

      <h3 className="font-semibold">5. Pricing</h3>
      <p className="text-sm text-gray-700 mb-2">Enter the service price. You can use tiers and ranges:</p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Base Price: 1500</li>
        <li>Price Range: 1000 – 2000</li>
        <li>Price Tier Example: Label "Premium", Price "2500"</li>
      </ul>

      <h3 className="font-semibold">6. Add-Ons</h3>
      <p className="text-sm text-gray-700 mb-2">Extra options your customers can select:</p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Title: "Deep Conditioning" <br /> Price: 500 <br /> Duration: 30 min</li>
        <li>Title: "Nail Art" <br /> Price: 300 <br /> Duration: 20 min</li>
      </ul>

      <h3 className="font-semibold">7. Session Packages</h3>
      <p className="text-sm text-gray-700 mb-2">Combine multiple sessions for a discount:</p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Sessions: 3 <br /> Price: 4000</li>
      </ul>

      <h3 className="font-semibold">8. Area Pricing</h3>
      <p className="text-sm text-gray-700 mb-2">Price depends on service area (like waxing):</p>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Area: "Full Legs" <br /> Min: 1500 <br /> Max: 2000</li>
        <li>Area: "Half Arms" <br /> Min: 800 <br /> Max: 1200</li>
      </ul>

      <h3 className="font-semibold">9. Deposits & Mobile Eligibility</h3>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Enable Deposit: tick to allow partial payment upfront (Fixed or Percent)</li>
        <li>Mobile Eligibility: tick if service can be done at customer’s location</li>
      </ul>

      <h3 className="font-semibold">10. Gallery</h3>
      <p className="text-sm text-gray-700 mb-3">Upload pictures of your service. Example: Before & After hair styling photos.</p>

      <h3 className="font-semibold">Tips</h3>
      <ul className="list-disc ml-5 mb-3 text-sm">
        <li>Fill each category separately if you offer multiple service types.</li>
        <li>Always assign staff to the correct service.</li>
        <li>Use dropdowns and examples to avoid mistakes.</li>
      </ul>

      <button onClick={onClose} className="bg-blue-500 text-white w-full py-2 rounded">Close Help</button>
    </div>
  );
}
