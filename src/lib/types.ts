export interface Shipment {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  recipient_name: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  asset_category: string;
  asset_description: string | null;
  asset_image_path: string | null;
  packaging_type: string | null;
  weight: string | null;
  declared_value: number | null;
  currency: string;
  special_handling_notes: string | null;
  origin_country: string;
  origin_city: string;
  origin_address: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_country: string;
  destination_city: string;
  destination_address: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  dispatch_date: string | null;
  estimated_delivery_date: string | null;
  current_status: string;
  documentation_status: string;
  customs_review_status: string;
  identity_verification_status: string;
  proof_of_ownership: string;
  source_of_funds_review: string;
  regulatory_approval_status: string;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentCheckpoint {
  id: string;
  shipment_id: string;
  status: string;
  location: string | null;
  description: string | null;
  checkpoint_date: string;
  internal_note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ShipmentSimulation {
  id: string;
  shipment_id: string;
  route_data: number[];
  progress: number;
  simulated_time: string | null;
  playback_speed: number;
  is_playing: boolean;
  updated_at: string;
}

export interface SupportConversation {
  id: string;
  customer_name: string;
  customer_email: string;
  tracking_number: string | null;
  access_token: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  record_type: string | null;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PublicShipment {
  tracking_number: string;
  asset_category: string;
  asset_description: string | null;
  asset_image_path: string | null;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  current_status: string;
  dispatch_date: string | null;
  estimated_delivery_date: string | null;
  updated_at: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
}

export interface PublicCheckpoint {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  checkpoint_date: string;
}

export interface PublicSimulation {
  route_data: number[];
  progress: number;
  simulated_time: string | null;
  is_playing: boolean;
}
