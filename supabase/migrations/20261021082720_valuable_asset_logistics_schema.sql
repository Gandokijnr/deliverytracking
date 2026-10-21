/*
# Valuable Asset Logistics Platform — Core Schema

## Overview
Creates the full database schema for a valuable-asset secure logistics and shipment tracking platform.
Administrators create and manage shipments; customers track them publicly by tracking number and contact support without registering.

## New Tables

1. **shipments** — Master shipment records for valuable assets.
   - tracking_number: unique 17-char alphanumeric public reference.
   - Customer contact fields (sender/recipient name, email, phone) — PRIVATE, admin-only.
   - Asset fields: category, description, image path, packaging, weight, declared value, currency, handling notes — declared value & handling notes are PRIVATE.
   - Route fields: origin/destination country, city, address, lat/lng for map.
   - Dates: dispatch, estimated delivery.
   - current_status: operational status string.
   - Admin compliance fields: documentation_status, customs_review_status, identity_verification_status, proof_of_ownership, source_of_funds_review, regulatory_approval_status — admin-only, not automated claims.
   - archived_at: null = active, timestamp = archived.
   - created_by: admin user id.

2. **shipment_checkpoints** — Chronological operational event log.
   - shipment_id FK, status, location, description, checkpoint_date, internal_note (PRIVATE), created_by.

3. **shipment_simulations** — Illustrative route simulation state (one per shipment).
   - shipment_id FK UNIQUE, route_data (jsonb waypoints), progress (0-100), simulated_time, playback_speed, is_playing.
   - SEPARATE from operational status — movement here never creates checkpoints or changes status.

4. **support_conversations** — Customer support threads (no registration required).
   - customer_name, customer_email, tracking_number (optional), access_token (secure random), status (open/resolved).

5. **support_messages** — Messages within a conversation.
   - conversation_id FK, sender_type (customer/admin), message, is_read.

6. **admin_audit_logs** — Audit trail of admin actions.
   - admin_id, action, record_type, record_id, details (jsonb).

## Security (RLS)

- **shipments, shipment_checkpoints, shipment_simulations, admin_audit_logs**: `TO authenticated` only. All authenticated users are administrators (no public signup exists). Private fields (declared_value, special_handling_notes, sender/recipient contact, addresses, internal_note) are never exposed to the public — the `public-portal` edge function selects only approved public fields using the service role key.
- **support_conversations**: authenticated can SELECT/UPDATE (admin inbox). `anon` can INSERT (customers creating conversations without registering).
- **support_messages**: `TO authenticated` only for direct access. Customer access is through SECURITY DEFINER RPC functions that verify the access token.

## RPC Functions

- **create_support_conversation(name, email, tracking, message)**: Creates a conversation + first message, generates a secure access token. Returns conversation id + token. Callable by anon.
- **get_customer_conversation(token)**: Returns conversation for a valid token. SECURITY DEFINER.
- **get_customer_messages(token)**: Returns messages for a valid token. SECURITY DEFINER.
- **send_customer_message(token, message)**: Appends a customer message. SECURITY DEFINER.
- **mark_customer_messages_read(token)**: Marks admin messages as read. SECURITY DEFINER.

## Storage

- Creates a public bucket `asset-images` for approved asset photographs visible on the public tracking page.

## Admin User

- Creates a default administrator account in auth.users with role "admin" in app metadata.

## Notes

1. The `public-portal` edge function is the ONLY public read path for shipment data — it uses the service role key and returns only approved, non-sensitive fields.
2. Simulation progress is fully decoupled from operational status by design.
3. Tracking numbers use a UNIQUE constraint; generation happens client-side with crypto and retries on conflict.
*/

-- ============ SHIPMENTS ============
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text UNIQUE NOT NULL,
  sender_name text NOT NULL,
  sender_email text,
  sender_phone text,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_phone text,
  asset_category text NOT NULL,
  asset_description text,
  asset_image_path text,
  packaging_type text,
  weight text,
  declared_value numeric,
  currency text DEFAULT 'USD',
  special_handling_notes text,
  origin_country text NOT NULL,
  origin_city text NOT NULL,
  origin_address text,
  origin_lat double precision,
  origin_lng double precision,
  destination_country text NOT NULL,
  destination_city text NOT NULL,
  destination_address text,
  destination_lat double precision,
  destination_lng double precision,
  dispatch_date date,
  estimated_delivery_date date,
  current_status text NOT NULL DEFAULT 'Shipment Registered',
  documentation_status text DEFAULT 'Pending',
  customs_review_status text DEFAULT 'Not Started',
  identity_verification_status text DEFAULT 'Pending',
  proof_of_ownership text DEFAULT 'Pending',
  source_of_funds_review text DEFAULT 'Pending',
  regulatory_approval_status text DEFAULT 'Pending',
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_current_status ON shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_shipments_archived ON shipments(archived_at) WHERE archived_at IS NOT NULL;

DROP POLICY IF EXISTS "admin_select_shipments" ON shipments;
CREATE POLICY "admin_select_shipments" ON shipments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_shipments" ON shipments;
CREATE POLICY "admin_insert_shipments" ON shipments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_shipments" ON shipments;
CREATE POLICY "admin_update_shipments" ON shipments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_shipments" ON shipments;
CREATE POLICY "admin_delete_shipments" ON shipments FOR DELETE
  TO authenticated USING (true);

-- ============ SHIPMENT CHECKPOINTS ============
CREATE TABLE IF NOT EXISTS shipment_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  description text,
  checkpoint_date timestamptz NOT NULL DEFAULT now(),
  internal_note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shipment_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_checkpoints_shipment_id ON shipment_checkpoints(shipment_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_date ON shipment_checkpoints(checkpoint_date);

DROP POLICY IF EXISTS "admin_select_checkpoints" ON shipment_checkpoints;
CREATE POLICY "admin_select_checkpoints" ON shipment_checkpoints FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_checkpoints" ON shipment_checkpoints;
CREATE POLICY "admin_insert_checkpoints" ON shipment_checkpoints FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_checkpoints" ON shipment_checkpoints;
CREATE POLICY "admin_update_checkpoints" ON shipment_checkpoints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_checkpoints" ON shipment_checkpoints;
CREATE POLICY "admin_delete_checkpoints" ON shipment_checkpoints FOR DELETE
  TO authenticated USING (true);

-- ============ SHIPMENT SIMULATIONS ============
CREATE TABLE IF NOT EXISTS shipment_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
  route_data jsonb DEFAULT '[]'::jsonb,
  progress double precision NOT NULL DEFAULT 0,
  simulated_time timestamptz,
  playback_speed double precision DEFAULT 1,
  is_playing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipment_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_simulations" ON shipment_simulations;
CREATE POLICY "admin_select_simulations" ON shipment_simulations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_simulations" ON shipment_simulations;
CREATE POLICY "admin_insert_simulations" ON shipment_simulations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_simulations" ON shipment_simulations;
CREATE POLICY "admin_update_simulations" ON shipment_simulations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_simulations" ON shipment_simulations;
CREATE POLICY "admin_delete_simulations" ON shipment_simulations FOR DELETE
  TO authenticated USING (true);

-- ============ SUPPORT CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  tracking_number text,
  access_token text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_access_token ON support_conversations(access_token);

DROP POLICY IF EXISTS "admin_select_conversations" ON support_conversations;
CREATE POLICY "admin_select_conversations" ON support_conversations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON support_conversations;
CREATE POLICY "anon_insert_conversations" ON support_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_conversations" ON support_conversations;
CREATE POLICY "admin_update_conversations" ON support_conversations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ SUPPORT MESSAGES ============
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'customer',
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON support_messages(conversation_id, is_read) WHERE is_read = false;

DROP POLICY IF EXISTS "admin_select_messages" ON support_messages;
CREATE POLICY "admin_select_messages" ON support_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_messages" ON support_messages;
CREATE POLICY "admin_insert_messages" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_messages" ON support_messages;
CREATE POLICY "admin_update_messages" ON support_messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_messages" ON support_messages;
CREATE POLICY "admin_delete_messages" ON support_messages FOR DELETE
  TO authenticated USING (true);

-- ============ ADMIN AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  record_type text,
  record_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_audit_logs" ON admin_audit_logs;
CREATE POLICY "admin_select_audit_logs" ON admin_audit_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON admin_audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON admin_audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ RPC FUNCTIONS ============
CREATE OR REPLACE FUNCTION create_support_conversation(
  p_customer_name text,
  p_customer_email text,
  p_tracking_number text,
  p_message text
) RETURNS TABLE(conversation_id uuid, access_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_token text;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO support_conversations (id, customer_name, customer_email, tracking_number, access_token)
  VALUES (gen_random_uuid(), p_customer_name, p_customer_email, p_tracking_number, v_token)
  RETURNING id INTO v_id;

  INSERT INTO support_messages (conversation_id, sender_type, message)
  VALUES (v_id, 'customer', p_message);

  RETURN QUERY SELECT v_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION create_support_conversation TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_customer_conversation(p_access_token text)
RETURNS TABLE(
  conversation_id uuid,
  customer_name text,
  customer_email text,
  tracking_number text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, customer_name, customer_email, tracking_number, status, created_at
  FROM support_conversations
  WHERE access_token = p_access_token
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_conversation TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_customer_messages(p_access_token text)
RETURNS TABLE(
  message_id uuid,
  sender_type text,
  message text,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sm.id, sm.sender_type, sm.message, sm.is_read, sm.created_at
  FROM support_messages sm
  JOIN support_conversations sc ON sc.id = sm.conversation_id
  WHERE sc.access_token = p_access_token
  ORDER BY sm.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_messages TO anon, authenticated;

CREATE OR REPLACE FUNCTION send_customer_message(p_access_token text, p_message text)
RETURNS TABLE(message_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_msg_id uuid;
BEGIN
  SELECT id INTO v_conversation_id FROM support_conversations WHERE access_token = p_access_token LIMIT 1;
  IF v_conversation_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO support_messages (conversation_id, sender_type, message)
  VALUES (v_conversation_id, 'customer', p_message)
  RETURNING id INTO v_msg_id;
  RETURN QUERY SELECT v_msg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION send_customer_message TO anon, authenticated;

CREATE OR REPLACE FUNCTION mark_customer_messages_read(p_access_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE support_messages sm
  SET is_read = true
  FROM support_conversations sc
  WHERE sc.id = sm.conversation_id
    AND sc.access_token = p_access_token
    AND sm.sender_type = 'admin'
    AND sm.is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_customer_messages_read TO anon, authenticated;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_asset_images" ON storage.objects;
CREATE POLICY "public_read_asset_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'asset-images');

DROP POLICY IF EXISTS "admin_insert_asset_images" ON storage.objects;
CREATE POLICY "admin_insert_asset_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images');

DROP POLICY IF EXISTS "admin_update_asset_images" ON storage.objects;
CREATE POLICY "admin_update_asset_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images') WITH CHECK (bucket_id = 'asset-images');

DROP POLICY IF EXISTS "admin_delete_asset_images" ON storage.objects;
CREATE POLICY "admin_delete_asset_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'asset-images');

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipments_updated_at ON shipments;
CREATE TRIGGER shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON support_conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ ADMIN USER ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@meridianvault.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      encrypted_password,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      confirmation_token,
      email_change_token_current,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@meridianvault.com',
      now(),
      crypt('MeridianAdmin2024!', gen_salt('bf')),
      now(),
      now(),
      '{"role":"admin"}'::jsonb,
      '{}'::jsonb,
      '',
      '',
      ''
    );
  END IF;
END $$;
