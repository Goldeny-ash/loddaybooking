import { Instagram, Facebook, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-[#001524] text-[#FFECD1] py-20 px-8"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">

        {/* Brand */}
        <div>
          <h3 className="font-serif text-3xl mb-4">Lodday</h3>
          <p className="opacity-80">
            Booking systems built for serious service businesses.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <p>Email: hello@lodday.com</p>
          <p>WhatsApp: +254 700 000 000</p>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-semibold mb-4">Follow us</h4>

          <div className="flex gap-4">
            <Link href="https://instagram.com">
              <Instagram />
            </Link>

            <Link href="https://facebook.com">
              <Facebook />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-sm opacity-70">
        © {new Date().getFullYear()} Lodday. All rights reserved.
      </div>
    </footer>
  );
}
