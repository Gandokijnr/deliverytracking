export const HERO_IMAGE = 'https://images.pexels.com/photos/29787612/pexels-photo-29787612.jpeg?auto=compress&cs=tinysrgb&w=1920';
export const ABOUT_IMAGE = 'https://images.pexels.com/photos/8847200/pexels-photo-8847200.jpeg?auto=compress&cs=tinysrgb&w=1280';
export const SECURITY_IMAGE = 'https://images.pexels.com/photos/33175650/pexels-photo-33175650.jpeg?auto=compress&cs=tinysrgb&w=1280';
export const COVERAGE_IMAGE = 'https://images.pexels.com/photos/36712857/pexels-photo-36712857.jpeg?auto=compress&cs=tinysrgb&w=1280';

export const SERVICE_IMAGES: Record<string, string> = {
  cash: 'https://images.pexels.com/photos/15633962/pexels-photo-15633962.jpeg?auto=compress&cs=tinysrgb&w=940',
  gold: 'https://images.pexels.com/photos/8442330/pexels-photo-8442330.jpeg?auto=compress&cs=tinysrgb&w=940',
  diamond: 'https://images.pexels.com/photos/5370644/pexels-photo-5370644.jpeg?auto=compress&cs=tinysrgb&w=940',
  luxury: 'https://images.pexels.com/photos/10343908/pexels-photo-10343908.jpeg?auto=compress&cs=tinysrgb&w=940',
  documents: 'https://images.pexels.com/photos/8371715/pexels-photo-8371715.jpeg?auto=compress&cs=tinysrgb&w=940',
  cargo: 'https://images.pexels.com/photos/11146455/pexels-photo-11146455.jpeg?auto=compress&cs=tinysrgb&w=940',
};

export const SERVICES = [
  {
    id: 'cash',
    title: 'Cash and Banknote Logistics',
    description: 'Secure collection, transportation, and delivery of cash consignments and banknote shipments with full chain-of-custody documentation.',
    image: SERVICE_IMAGES.cash,
    icon: 'Banknote',
  },
  {
    id: 'gold',
    title: 'Gold and Precious Metals Transportation',
    description: 'Specialized handling and secure transport of gold bullion, bars, and precious metal consignments across international routes.',
    image: SERVICE_IMAGES.gold,
    icon: 'CircleDot',
  },
  {
    id: 'diamond',
    title: 'Diamond and Jewelry Logistics',
    description: 'Discreet, fully documented transportation of diamonds, gemstones, and high-value jewelry consignments.',
    image: SERVICE_IMAGES.diamond,
    icon: 'Gem',
  },
  {
    id: 'luxury',
    title: 'Luxury Asset Transportation',
    description: 'Secure logistics for luxury watches, collectibles, and other approved high-value personal assets.',
    image: SERVICE_IMAGES.luxury,
    icon: 'Watch',
  },
  {
    id: 'documents',
    title: 'Confidential Document Transportation',
    description: 'Tamper-evident, chain-of-custody transport of confidential documents, legal instruments, and sensitive records.',
    image: SERVICE_IMAGES.documents,
    icon: 'FileLock2',
  },
  {
    id: 'cargo',
    title: 'International Secure Cargo Logistics',
    description: 'Coordinated international secure cargo movement for approved high-value consignments across global destinations.',
    image: SERVICE_IMAGES.cargo,
    icon: 'Plane',
  },
];
