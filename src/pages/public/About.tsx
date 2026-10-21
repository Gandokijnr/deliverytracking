import { Link } from '@tanstack/react-router';
import { Shield, Globe, Lock, FileCheck, Clock, ArrowRight, Check, Eye, Users } from 'lucide-react';
import { ABOUT_IMAGE, SECURITY_IMAGE } from '@/lib/images';

export default function About() {
  return (
    <div>
      <section className="bg-[#0c1a33] text-white py-16 lg:py-24">
        <div className="container-mx text-center">
          <div className="gold-divider mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">About MeridianVault</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            A specialized logistics company dedicated to the secure transportation of high-value assets across international destinations.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-mx grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img src={ABOUT_IMAGE} alt="Professional operations" className="w-full h-[400px] object-cover" />
          </div>
          <div>
            <div className="gold-divider mb-4" />
            <h2 className="text-3xl font-bold text-[#0c1a33] mb-6">Our Company</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              MeridianVault provides specialized secure logistics services for the transportation of high-value assets, including cash consignments, gold bullion, precious metals, diamonds, jewelry, luxury watches, and confidential documents.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Our operational framework is built around transparency and documented procedures. Every shipment is registered with a unique 17-character tracking number, and authorized parties can monitor approved public shipment information without requiring an account.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We maintain a clear separation between verified operational events — recorded by authorized administrators as checkpoints — and illustrative route progress shown on the tracking map. This ensures our customers always know which information is confirmed and which is illustrative.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white section-padding">
        <div className="container-mx">
          <div className="text-center mb-12">
            <div className="gold-divider mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-4">Our Core Principles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Security', desc: 'Every shipment follows structured security protocols with documented chain-of-custody at each operational stage.' },
              { icon: Eye, title: 'Transparency', desc: 'We clearly distinguish verified operational events from illustrative tracking, so customers always know what is confirmed.' },
              { icon: Lock, title: 'Privacy', desc: 'Declared values, customer addresses, internal notes, and security arrangements are never exposed on public tracking.' },
              { icon: FileCheck, title: 'Compliance', desc: 'Administrative records track documentation, customs review, identity verification, and regulatory approval — not automated claims.' },
              { icon: Globe, title: 'International', desc: 'Multi-country shipment support with customs, anti-money-laundering, and import/export documentation tracking.' },
              { icon: Clock, title: 'Reliability', desc: 'From registration through delivery confirmation, every shipment maintains a documented operational timeline.' },
            ].map((p, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#112342] flex items-center justify-center mb-4">
                  <p.icon className="w-6 h-6 text-[#c9a227]" />
                </div>
                <h3 className="font-bold text-[#0c1a33] mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-mx">
          <div className="rounded-2xl bg-[#0c1a33] p-8 lg:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <img src={SECURITY_IMAGE} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">What We Do Not Claim</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                We believe in honest representation of our services. The following are important clarifications:
              </p>
              <ul className="space-y-3">
                {[
                  'We do not fabricate shipment movement, customs clearance, or delivery events',
                  'We do not falsely claim insurance coverage, regulatory licenses, or physical delivery guarantees',
                  'We do not bypass customs, anti-money-laundering, sanctions, or import/export requirements',
                  'We do not expose sensitive valuable asset information publicly',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#c9a227] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white section-padding">
        <div className="container-mx text-center">
          <Users className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-[#0c1a33] mb-4">Get in Touch</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Have questions about our services or need to arrange a shipment? Our support team is ready to help.
          </p>
          <Link to="/support" className="btn-primary">
            Contact Support
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
