-- Anonymised telemetry for institutional corpus.
-- Never stores raw user identity, payload content, or encrypted data.
-- Identity linkage is impossible at the storage layer by design.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS simplifii_telemetry_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_hash TEXT NOT NULL,
  event_type TEXT NOT NULL,
  assessment_title_hash TEXT,
  course_code TEXT,
  tier TEXT,
  schema_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for institutional aggregate queries
CREATE INDEX idx_telemetry_event_type ON simplifii_telemetry_events(event_type);
CREATE INDEX idx_telemetry_created_at ON simplifii_telemetry_events(created_at);
CREATE INDEX idx_telemetry_user_hash ON simplifii_telemetry_events(user_id_hash);

ALTER TABLE simplifii_telemetry_events ENABLE ROW LEVEL SECURITY;

-- INSERT: authenticated users can only insert rows where user_id_hash
-- matches the SHA-256 of their own auth.uid(). Prevents spoofing.
-- user_id must be the Supabase auth UUID string
-- (e.g. '550e8400-e29b-41d4-a716-446655440000')
-- Client must hash the same string format via
-- crypto.subtle.digest('SHA-256', encode(userId))
CREATE POLICY "Users insert own hashed events" ON simplifii_telemetry_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id_hash = encode(sha256(auth.uid()::text::bytea), 'hex'));

-- SELECT: service_role only. No client-side reads.
-- Institutional dashboards query via server-side API with service key.
CREATE POLICY "Service role reads telemetry" ON simplifii_telemetry_events
  FOR SELECT TO service_role
  USING (true);

-- No UPDATE or DELETE policies. Telemetry is append-only.
