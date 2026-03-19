import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About – StreetSmarts',
  description: 'How StreetSmarts helps you explore neighborhoods while house hunting online.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black px-6 py-16 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-12">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to StreetSmarts
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md mb-6">
          Street<span className="text-cyan-400">Smarts</span>
        </h1>
        <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold mb-12">About</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <p className="text-lg text-slate-200">
            Online house hunting has transformed real estate — but listings can only tell you so much about a home. StreetSmarts is the missing piece: what&apos;s the neighborhood actually like? How far is the nearest coffee shop? Is there a park within walking distance? Are there decent restaurants nearby?
          </p>

          <p>
            StreetSmarts was built to answer those questions before you ever book a showing. Drop in any address, pick the amenities that matter to you, and instantly see everything nearby plotted on a map — with walking and driving times already calculated.
          </p>

          <p>
            It&apos;s not just about checking boxes. It&apos;s about getting a real feel for a place. Whether you care about being five minutes from a gym, having good grocery options without a car, or living somewhere with actual nightlife — StreetSmarts shows you the truth about a location before you commit.
          </p>

          <p>
            The idea came from a simple frustration: every house hunting tool is focused on the property. None of them help you understand the street. We think the neighborhood is half the decision, and it deserves a tool built around that.
          </p>
        </div>
      </div>
    </main>
  );
}
