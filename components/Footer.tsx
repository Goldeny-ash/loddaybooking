import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#001524] px-8 py-20 text-[#FFECD1]">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-3">
        <div>
          <h3 className="mb-4 font-serif text-3xl">Lodday</h3>
          <p className="opacity-80">Booking systems built for serious service businesses.</p>
        </div>

        <div>
          <h4 className="mb-4 font-semibold">Contact</h4>
          <p>Email: hello@lodday.com</p>
          <p>WhatsApp: +254 700 000 000</p>
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
            <p>
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-semibold">Follow us</h4>
          <div className="flex gap-4">
            <Link href="https://instagram.com" aria-label="Instagram">
              <Instagram />
            </Link>
            <Link href="https://facebook.com" aria-label="Facebook">
              <Facebook />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-sm opacity-70">
        (c) {new Date().getFullYear()} Lodday. All rights reserved.
      </div>
    </footer>
  );
}

