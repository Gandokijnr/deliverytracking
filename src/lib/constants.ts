export const SHIPMENT_STATUSES = [
  'Shipment Registered',
  'Awaiting Collection',
  'Asset Collected',
  'Processing at Origin Facility',
  'Dispatched',
  'In Transit',
  'Arrived at Transit Hub',
  'Customs Processing',
  'Customs Cleared',
  'Arrived at Destination Facility',
  'Out for Secure Delivery',
  'Delivered',
] as const;

export const EXCEPTION_STATUSES = [
  'Shipment On Hold',
  'Documentation Required',
  'Delivery Rescheduled',
  'Shipment Cancelled',
] as const;

export const ASSET_CATEGORIES = [
  'Banknotes and Cash Consignments',
  'Gold Bullion',
  'Precious Metals',
  'Diamonds and Gemstones',
  'Jewelry',
  'Luxury Watches',
  'Confidential Documents',
  'Other Approved Valuable Assets',
] as const;

export const COMPLIANCE_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Not Started'] as const;

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'AED', 'SGD', 'JPY'] as const;

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Switzerland',
  'United Arab Emirates', 'Singapore', 'Japan', 'Poland', 'Netherlands',
  'Belgium', 'Luxembourg', 'Hong Kong', 'Canada', 'Australia',
  'Italy', 'Spain', 'Austria', 'Sweden', 'Norway',
] as const;

export const PACKAGING_TYPES = [
  'Sealed Security Container',
  'Tamper-Evident Pouch',
  'Reinforced Security Case',
  'Certified Bullion Crate',
  'Confidential Document Seal',
  'Insured Valuable Parcel',
] as const;

export const ADMIN_EMAIL = 'admin@meridianvault.com';
export const ADMIN_PASSWORD = 'MeridianAdmin2024!';
