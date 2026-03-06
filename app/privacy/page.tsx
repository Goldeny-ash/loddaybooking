import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Lodday Booking, including what data we collect, how we use it, and your privacy rights.",
  alternates: {
    canonical: "/privacy",
  },
};

const LAST_UPDATED = "March 6, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FFF8EE] px-4 py-12 md:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#FED7AA] bg-white p-6 md:p-10">
        <h1 className="text-3xl font-bold text-[#001524] md:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#334155]">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#0f172a]">
          <section>
            <h2 className="text-xl font-semibold text-[#001524]">1. Scope</h2>
            <p>
              This Privacy Policy explains how Lodday Booking collects, uses, shares, and protects
              personal information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">2. Information We Collect</h2>
            <p>We may collect:</p>
            <ul className="list-disc pl-6">
              <li>Account details such as name, email, phone number, and business profile data.</li>
              <li>Booking information such as services selected, dates, and notes.</li>
              <li>Payment-related metadata from payment providers (not full card details).</li>
              <li>Technical and usage data such as IP address, device/browser, and logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">3. How We Use Information</h2>
            <p>We use information to:</p>
            <ul className="list-disc pl-6">
              <li>Provide and improve booking, scheduling, and communication features.</li>
              <li>Process transactions and related notifications.</li>
              <li>Secure accounts and prevent fraud or abuse.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">4. Legal Bases</h2>
            <p>
              Depending on jurisdiction, we process personal data based on contract performance,
              legitimate interests, legal obligations, and consent where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">5. Sharing of Information</h2>
            <p>We may share data with:</p>
            <ul className="list-disc pl-6">
              <li>Businesses and customers involved in the same booking transaction.</li>
              <li>Service providers (hosting, analytics, messaging, payment processors).</li>
              <li>Authorities when required by law or to protect rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">6. Data Retention</h2>
            <p>
              We retain personal data only as long as necessary for service delivery, legal
              compliance, dispute resolution, and legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">7. Data Security</h2>
            <p>
              We use administrative, technical, and organizational safeguards to protect personal
              information. No system is perfectly secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">8. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, restrict,
              or object to processing of your personal data, and to request data portability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">9. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for children under the age required by applicable law.
              We do not knowingly collect personal information from children without lawful basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">10. International Transfers</h2>
            <p>
              Your data may be processed in countries other than your own. Where required, we apply
              appropriate safeguards for cross-border transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version
              with an updated &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#001524]">12. Contact</h2>
            <p>
              For privacy requests or questions, contact:{" "}
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

