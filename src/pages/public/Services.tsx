import { Link } from '@tanstack/react-router';
import {
  Banknote, CircleDot, Gem, Watch, FileLock2, Plane,
  Shield, Check, ArrowRight, Lock, FileCheck, Globe,
} from 'lucide-react';
import { SERVICES } from '@/lib/images';

const iconMap: Record<string, typeof Shield> = {
  Banknote, CircleDot, Gem, Watch, FileLock2, Plane,
};

const serviceDetails: Record<string, { features: string[]; process: string }> = {
  cash: {
    features: ['Secure cash consignment handling', 'Chain-of-custody documentation', 'Tamper-evident packaging', 'Discreet collection and delivery'],
    process: 'Cash and banknote consignments are handled with sealed security containers, documented at every checkpoint from collection through delivery confirmation.',
  },
  gold: {
    features: ['Certified bullion crate packaging', 'Weight verification records', 'Precious metal handling protocols', 'International route coordination'],
    process: 'Gold bullion and precious metal consignments are transported in certified reinforced containers with documented weight verification at each operational stage.',
  },
  diamond: {
    features: ['Discreet, unbranded transport', 'Gemstone-specific packaging', 'Full operational timeline', 'Confidential handling'],
    process: 'Diamond and jewelry consignments are transported discreetly with specialized packaging. Sensitive value information remains restricted to authorized personnel.',
  },
  luxury: {
    features: ['Luxury watch secure transport', 'Collectible asset handling', 'Climate-appropriate packaging', 'Insured valuable parcel options'],
    process: 'Luxury assets including watches and collectibles are handled with reinforced security cases designed for fragile, high-value items.',
  },
  documents: {
    features: ['Confidential document seals', 'Tamper-evident pouches', 'Legal instrument transport', 'Sensitive record handling'],
    process: 'Confidential documents are transported in tamper-evident sealed pouches with full chain-of-custody documentation from origin to destination.',
  },
  cargo: {
    features: ['International route planning', 'Multi-country coordination', 'Customs documentation tracking', 'Regulatory compliance records'],
    process: 'International secure cargo shipments are coordinated across multiple countries with administrative tracking of customs review, documentation, and regulatory approval status.',
  },
};

export default function Services() {
  return (
    <div>
      <section className="bg-[#0c1a33] text-white py-16 lg:py-24">
        <div className="container-mx text-center">
          <div className="gold-divider mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Our Secure Logistics Services</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Specialized transportation solutions for high-value assets, each handled with documented operational procedures and professional security standards.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-mx space-y-16">
          {SERVICES.map((service, idx) => {
            const Icon = iconMap[service.icon] || Shield;
            const details = serviceDetails[service.id];
            const reversed = idx % 2 === 1;
            return (
              <div key={service.id} id={service.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${reversed ? '' : ''}`}>
                <div className={reversed ? 'lg:order-2' : ''}>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <img src={service.image} alt={service.title} className="w-full h-[300px] lg:h-[360px] object-cover" />
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-[#c9a227] flex items-center justify-center shadow-lg">
                      <Icon className="w-6 h-6 text-[#0c1a33]" strokeWidth={2} />
                    </div>
                  </div>
                </div>
                <div className={reversed ? 'lg:order-1' : ''}>
                  <span className="text-xs font-bold text-[#c9a227] uppercase tracking-widest">Service {String(idx + 1).padStart(2, '0')}</span>
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#0c1a33] mt-2 mb-4">{service.title}</h2>
                  <p className="text-slate-600 mb-4 leading-relaxed">{service.description}</p>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">{details.process}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {details.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-[#c9a227] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/support" className="btn-navy !py-2.5 !text-sm">
                    Inquire About This Service
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#0c1a33] text-white section-padding">
        <div className="container-mx">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#c9a227]" />
              </div>
              <h3 className="font-bold mb-2">Privacy First</h3>
              <p className="text-sm text-slate-300">Declared values, addresses, and security arrangements are never exposed publicly.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-7 h-7 text-[#c9a227]" />
              </div>
              <h3 className="font-bold mb-2">Documented Process</h3>
              <p className="text-sm text-slate-300">Every operational event is recorded as a verified checkpoint in the shipment timeline.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-[#c9a227]" />
              </div>
              <h3 className="font-bold mb-2">International Reach</h3>
              <p className="text-sm text-slate-300">Multi-country route support with customs and regulatory compliance tracking.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-mx text-center">
          <div className="gold-divider mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-[#0c1a33] mb-4">Ready to Arrange a Shipment?</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">Contact our team to discuss your valuable asset transportation requirements.</p>
          <Link to="/support" className="btn-primary">
            Contact Support
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}


