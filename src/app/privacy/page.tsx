import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – StreetSmarts',
  description: 'How StreetSmarts handles your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black px-6 py-16 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-12">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to StreetSmarts
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-2">Effective date: March 6, 2025</p>
        <p className="text-slate-500 text-sm mb-12">Last updated: March 6, 2025</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Overview</h2>
            <p>
              StreetSmarts (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website located at streetsmarts.app (the &quot;Service&quot;). This Privacy Policy explains what information we collect, how we use it, and your rights with respect to that information. We take privacy seriously and have designed StreetSmarts to collect as little data as possible.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Information we collect</h2>
            <p className="mb-4">
              StreetSmarts does not require account registration and does not collect personal information such as your name, email address, or phone number in the course of normal use.
            </p>
            <p className="mb-4">
              When you perform a search, the address or location query you enter is transmitted to our servers solely for the purpose of returning map and place data. These queries are not logged or stored beyond the duration of the request.
            </p>
            <p>
              We may collect standard server-side access logs (IP address, browser type, referring URL, timestamp) as part of normal web server operation. These logs are used for security monitoring and are not used to identify individual users or build behavioral profiles.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Cookies and tracking technologies</h2>
            <p className="mb-4">
              StreetSmarts does not use cookies for tracking, advertising, or analytics. We do not deploy third-party advertising pixels, session recording tools, or behavioral analytics software.
            </p>
            <p>
              Your browser may store certain data locally (such as URL parameters) as part of normal application behavior. This data remains on your device and is not transmitted to us.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Third-party services</h2>
            <p className="mb-4">
              To provide its core functionality, StreetSmarts integrates with the following third-party services. Your use of StreetSmarts involves data being processed by these providers in accordance with their own privacy policies:
            </p>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white font-medium mb-1">Google Maps Platform</p>
                <p className="text-sm text-slate-400">Used for geocoding addresses and querying nearby places. Address queries are sent to Google&apos;s servers. Google&apos;s use of this data is governed by the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">Google Privacy Policy</a>.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white font-medium mb-1">Mapbox</p>
                <p className="text-sm text-slate-400">Used for rendering the interactive map. Map tile requests are processed by Mapbox servers. Their use of data is governed by the <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">Mapbox Privacy Policy</a>.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. How we use information</h2>
            <p className="mb-3">The limited information we process is used solely to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>Return relevant map and place results in response to your search queries</li>
              <li>Monitor for abuse, security threats, and technical errors</li>
              <li>Improve the reliability and performance of the Service</li>
            </ul>
            <p className="mt-4">We do not sell, rent, or share your data with any third parties for advertising or marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Data retention</h2>
            <p>
              Search queries are not retained after the server response is sent. Server access logs, if retained, are kept for no longer than 30 days and are then deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Children&apos;s privacy</h2>
            <p>
              StreetSmarts is not directed at children under the age of 13. We do not knowingly collect any personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we do, we will revise the &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Contact us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please contact us at{' '}
              <a href="mailto:hello@streetsmarts.app" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                hello@streetsmarts.app
              </a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
