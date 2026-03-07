import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – StreetSmarts',
  description: 'Terms of Service for StreetSmarts.',
};

export default function TOSPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black px-6 py-16 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-12">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to StreetSmarts
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-2">Effective date: March 6, 2025</p>
        <p className="text-slate-500 text-sm mb-12">Last updated: March 6, 2025</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Acceptance of terms</h2>
            <p>
              By accessing or using StreetSmarts at streetsmarts.app (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service. These Terms apply to all visitors and users of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Description of the service</h2>
            <p>
              StreetSmarts is a free, web-based tool that allows users to explore neighborhoods by visualizing nearby amenities — including restaurants, coffee shops, parks, gyms, grocery stores, bars, and cultural attractions — relative to any address. The Service is intended for personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Permitted use</h2>
            <p className="mb-3">You may use StreetSmarts for any lawful personal purpose. You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>Use the Service to scrape, harvest, or systematically extract data</li>
              <li>Access the Service through automated means, bots, or scripts</li>
              <li>Attempt to reverse engineer, copy, or replicate the Service using our infrastructure</li>
              <li>Interfere with or disrupt the servers or networks connected to the Service</li>
              <li>Use the Service in any way that violates applicable local, national, or international laws or regulations</li>
              <li>Transmit any content that is unlawful, harmful, or otherwise objectionable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Accuracy of information</h2>
            <p>
              Place data, addresses, distances, and travel time estimates displayed by StreetSmarts are sourced from Google Maps Platform and are provided for informational purposes only. StreetSmarts makes no representations or warranties regarding the accuracy, completeness, or timeliness of any information displayed. Business hours, locations, and availability are subject to change. You should independently verify any information before relying on it for important decisions, including real estate transactions.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Intellectual property</h2>
            <p>
              All content, design, and code comprising the StreetSmarts Service — excluding third-party map and place data — is the property of StreetSmarts and its operators. You may not reproduce, distribute, or create derivative works from any part of the Service without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Third-party services</h2>
            <p>
              StreetSmarts relies on third-party services including Google Maps Platform and Mapbox. Your use of the Service is also subject to the terms and policies of these providers. We are not responsible for any issues arising from the availability, accuracy, or policies of these third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Disclaimer of warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without any warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. Your use of the Service is at your sole risk.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, StreetSmarts and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of profits, data, goodwill, or other intangible losses — arising out of or in connection with your access to or use of (or inability to use) the Service, even if advised of the possibility of such damages. This includes any decisions made based on information displayed by the Service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Modifications to the service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">10. Changes to these terms</h2>
            <p>
              We may revise these Terms from time to time. The most current version will always be posted at this URL. By continuing to use the Service after revisions become effective, you agree to be bound by the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">11. Governing law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">12. Contact us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
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
