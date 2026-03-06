import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Lodday Booking, including account responsibilities, booking and payment terms, and acceptable use.",
  alternates: {
    canonical: "/terms",
  },
};

const LAST_UPDATED = "March 6, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FFF8EE] px-4 py-12 md:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#FED7AA] bg-white p-6 md:p-10">
        <h1 className="text-3xl font-bold text-[#001524] md:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-[#334155]">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#0f172a]">
          <section>
            <h2 className="text-xl font-semibold text-[#001524]">1. Agreement to Terms</h2>
            <p>
              These Terms of Service govern your access to and use of Lodday Booking, including
              booking pages, scheduling, communication, and payment-related features. By using the
              platform, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">2. Eligibility and Accounts</h2>
            <p>
              You must provide accurate account information and keep it up to date. You are
              responsible for maintaining account security and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">3. Platform Role</h2>
            <p>
              Lodday provides software tools for businesses and customers to manage bookings.
              Businesses are responsible for their services, pricing, policies, fulfillment quality,
              and compliance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">4. Bookings, Deposits, and Payments</h2>
            <p>
              Some bookings may require deposits or prepayment. Payment terms, cancellation terms,
              and refund terms may vary by business. You agree to review and accept a business&apos;s
              terms before confirming a booking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">5. Prohibited Conduct</h2>
            <p>
              You may not misuse the platform, attempt unauthorized access, interfere with system
              operations, submit fraudulent bookings, or use the service for unlawful activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">6. Content and Intellectual Property</h2>
            <p>
              Platform software, branding, and related materials are owned by Lodday or its
              licensors. You retain ownership of content you provide, but grant Lodday a license to
              host and process that content to operate the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">7. Availability and Changes</h2>
            <p>
              We may update, suspend, or discontinue features at any time. We do not guarantee
              uninterrupted availability and may perform maintenance or security updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">8. Termination</h2>
            <p>
              We may suspend or terminate access for violations of these Terms, suspected fraud, or
              security risk. You may stop using the platform at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">9. Disclaimer of Warranties</h2>
            <p>
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis, without warranties
              of any kind, to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Lodday is not liable for indirect,
              incidental, special, consequential, or punitive damages, or for loss of revenue,
              profits, data, or goodwill.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">11. Governing Law</h2>
            <p>
              These Terms are governed by applicable laws in your operating jurisdiction, unless
              otherwise required by mandatory law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">12. Contact</h2>
            <p>
              For questions about these Terms, contact:{" "}
              <a className="underline" href="mailto:hello@lodday.com">
                hello@lodday.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

