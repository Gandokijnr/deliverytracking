import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Search, Shield, Package, Clock, Globe, Lock, ArrowRight, Check,
  Banknote, CircleDot, Gem, Watch, FileLock2, Plane, ChevronDown,
  Truck, FileCheck, ClipboardCheck, MapPin, Phone, Mail, Users,
} from 'lucide-react';
import { SERVICES, HERO_IMAGE, ABOUT_IMAGE, SECURITY_IMAGE, COVERAGE_IMAGE } from '@/lib/images';

const iconMap: Record<string, typeof Shield> = {
  Banknote, CircleDot, Gem, Watch, FileLock2, Plane,
};

const howItWorks = [
  { icon: Phone, title: 'Request a Shipment', desc: 'Contact us or request a shipment for your valuable assets.' },
  { icon: FileCheck, title: 'Submit Information', desc: 'Provide the required shipment and asset information.' },
  { icon: ClipboardCheck, title: 'Verification & Approval', desc: 'Complete the necessary verification and approval process.' },
  { icon: Truck, title: 'Secure Collection', desc: 'Arrange secure collection and transportation of your assets.' },
  { icon: Package, title: 'Track Your Shipment', desc: 'Receive tracking updates using your unique tracking number.' },
  { icon: Check, title: 'Confirm Delivery', desc: 'Confirm secure delivery of your valuable assets.' },
];

const faqs = [
  {
    q: 'How do I track my shipment?',
    a: 'Enter your 17-character tracking number in the tracking search field on our homepage or the Track Shipment page. No registration is required.',
  },
  {
    q: 'What is a tracking number?',
    a: 'A tracking number is a unique 17-character alphanumeric reference assigned to your shipment when it is registered in our system. It is provided to you by the authorized party who arranged the shipment.',
  },
  {
    q: 'Do I need to create an account to track my shipment?',
    a: 'No. Public shipment tracking does not require registration or login. Simply enter your tracking number to view approved shipment information.',
  },
  {
    q: 'What information is shown on the tracking page?',
    a: 'The tracking page displays approved public information including asset category, general description, origin, destination, current status, shipment progress, checkpoint history, and an illustrative route map. Sensitive details such as declared values, exact addresses, and security arrangements are never displayed publicly.',
  },
  {
    q: 'Is the route map live GPS tracking?',
    a: 'No. The route map is an illustrative route progress visualization, not live GPS tracking. Verified operational events appear in the checkpoint history timeline, which is maintained separately from the illustrative map.',
  },
  {
    q: 'How do I contact support about my shipment?',
    a: 'Use the Contact Support page to send a message to our team. You can optionally include your tracking number. A secure conversation link will be provided so you can return to your conversation thread.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate({ to: '/track', search: { t: trackingNumber.trim().toUpperCase() } });
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Secure logistics operations" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a33]/95 via-[#0c1a33]/80 to-[#0c1a33]/50" />
        </div>

        <div className="container-mx relative z-10 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a227]/15 border border-[#c9a227]/30 rounded-full mb-6 animate-fade-in-up">
              <Shield className="w-4 h-4 text-[#c9a227]" />
              <span className="text-xs font-semibold text-[#c9a227] uppercase tracking-wider">Secure Valuable Asset Logistics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              Secure Transportation of Your Most Valuable Assets.
            </h1>

            <p className="text-lg text-slate-200 mb-8 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              Specialized logistics solutions for the secure handling, transportation, and delivery of high-value assets across international destinations.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <Link to="/track" className="btn-primary">
                <Search className="w-5 h-5" />
                Track Your Shipment
              </Link>
              <Link to="/services" className="btn-outline">
                Explore Our Services
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/support" className="btn-outline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Search */}
      <section className="relative -mt-20 z-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-6 lg:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#112342] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#c9a227]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0c1a33]">Track Your Shipment</h2>
                <p className="text-sm text-slate-500">Enter your 17-character tracking number</p>
              </div>
            </div>

            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MVK7X2NP9QRST4YZK"
                maxLength={17}
                className="input-field flex-1 font-mono text-lg tracking-wider uppercase"
              />
              <button type="submit" className="btn-navy whitespace-nowrap">
                <Search className="w-5 h-5" />
                Track Shipment
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              No registration required. Your tracking number was provided when your shipment was arranged.
            </p>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section-padding">
        <div className="container-mx">
          <div className="text-center mb-12">
            <div className="gold-divider mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-4">Our Secure Logistics Services</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Specialized transportation solutions for high-value assets, handled with the highest standards of security and discretion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => {
              const Icon = iconMap[service.icon] || Package;
              return (
                <Link
                  key={service.id}
                  to="/services"
                  className="group card overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a33]/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-lg bg-[#c9a227] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#0c1a33]" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#0c1a33] mb-2 group-hover:text-[#1e3a6f] transition-colors">{service.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#c9a227] group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white section-padding">
        <div className="container-mx">
          <div className="text-center mb-12">
            <div className="gold-divider mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A straightforward, secure process from request to delivery confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[#112342] flex items-center justify-center relative">
                      <step.icon className="w-6 h-6 text-[#c9a227]" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c9a227] text-[#0c1a33] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0c1a33] mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section-padding">
        <div className="container-mx">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="gold-divider mb-4" />
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-6">About MeridianVault</h2>
              <p className="text-slate-600 mb-4 leading-relaxed">
                MeridianVault is a specialized logistics company focused on the secure transportation of high-value assets across international destinations, including the United States.
              </p>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Our approach combines structured operational procedures, documented chain-of-custody protocols, and professional handling standards. Every shipment is registered with a unique tracking reference, allowing authorized parties to monitor approved shipment information from registration through delivery confirmation.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <Globe className="w-8 h-8 text-[#c9a227] mb-2" />
                  <h4 className="font-bold text-[#0c1a33] text-sm">International Coverage</h4>
                  <p className="text-xs text-slate-500 mt-1">Multiple destination countries supported</p>
                </div>
                <div className="card p-4">
                  <Clock className="w-8 h-8 text-[#c9a227] mb-2" />
                  <h4 className="font-bold text-[#0c1a33] text-sm">Tracked Process</h4>
                  <p className="text-xs text-slate-500 mt-1">From registration to delivery confirmation</p>
                </div>
              </div>
              <Link to="/about" className="btn-navy mt-6">
                Learn More About Us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img src={ABOUT_IMAGE} alt="Professional business partnership" className="w-full h-[400px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a33]/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Security & Handling */}
      <section className="bg-[#0c1a33] text-white section-padding relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={SECURITY_IMAGE} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container-mx relative z-10">
          <div className="max-w-3xl">
            <div className="gold-divider mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Our Security & Handling Approach</h2>
            <p className="text-slate-300 mb-8 leading-relaxed text-lg">
              We maintain a structured operational framework that separates verified operational events from illustrative tracking, ensuring transparency about confirmed events and illustrative route progress.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <Lock className="w-8 h-8 text-[#c9a227] mb-3" />
                <h3 className="font-bold mb-2">Chain of Custody</h3>
                <p className="text-sm text-slate-300">Every shipment event is recorded as a checkpoint by authorized administrators, creating a documented operational timeline.</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <FileCheck className="w-8 h-8 text-[#c9a227] mb-3" />
                <h3 className="font-bold mb-2">Compliance Records</h3>
                <p className="text-sm text-slate-300">Administrative fields track documentation, customs review, identity verification, and regulatory approval statuses as records — not automated claims.</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <Shield className="w-8 h-8 text-[#c9a227] mb-3" />
                <h3 className="font-bold mb-2">Private Data Protection</h3>
                <p className="text-sm text-slate-300">Declared values, customer addresses, internal notes, and security arrangements are never exposed on the public tracking page.</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <Globe className="w-8 h-8 text-[#c9a227] mb-3" />
                <h3 className="font-bold mb-2">International Standards</h3>
                <p className="text-sm text-slate-300">Our process supports international shipping requirements including customs, anti-money-laundering, and import/export documentation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* International Coverage */}
      <section className="section-padding">
        <div className="container-mx">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl">
              <img src={COVERAGE_IMAGE} alt="International operations" className="w-full h-[400px] object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="gold-divider mb-4" />
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-6">International Service Coverage</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                We support shipment records involving multiple countries, with particular focus on routes involving the United States, Europe, and select international financial centers.
              </p>
              <ul className="space-y-3">
                {[
                  'Origin and destination country selection for every shipment',
                  'Multi-currency support for declared values',
                  'International date format handling',
                  'Customs and regulatory review tracking fields',
                  'Documentation status and identity verification records',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#c9a227] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white section-padding">
        <div className="container-mx max-w-3xl">
          <div className="text-center mb-12">
            <div className="gold-divider mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0c1a33] mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-[#0c1a33]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-3 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed animate-slide-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding">
        <div className="container-mx">
          <div className="rounded-2xl bg-gradient-to-r from-[#112342] to-[#1e3a6f] p-8 lg:p-12 text-center text-white shadow-xl">
            <Users className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Need Assistance?</h2>
            <p className="text-slate-200 mb-8 max-w-xl mx-auto">
              Our support team is available to help with your shipment inquiries. No registration required — simply send us a message.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/support" className="btn-primary">
                <Mail className="w-5 h-5" />
                Contact Support
              </Link>
              <Link to="/track" className="btn-outline">
                <Package className="w-5 h-5" />
                Track a Shipment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
