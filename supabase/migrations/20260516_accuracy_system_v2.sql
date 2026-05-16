-- Accuracy System v2: 5 tables with privacy classification and causal chain support
-- Every table has data_classification: 'operational' or 'sensitive'
-- Sensitive tables are subject to GDPR/Privacy Act deletion on request

-- 1. ingestion_events (sensitive: contains document metadata)
CREATE TABLE IF NOT EXISTS ingestion_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  parent_event_id UUID REFERENCES ingestion_events(id),
  doc_id TEXT,
  doc_filename TEXT,
  doc_type TEXT,
  extraction_method TEXT CHECK (extraction_method IN ('clean_pdf', 'ocr_image', 'ocr_handwritten', 'multilingual', 'empty')),
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  raw_text_length INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  pages_used_for_extraction INTEGER[] DEFAULT '{}',
  confidence_score FLOAT DEFAULT 0,
  confidence_by_field JSONB DEFAULT '{}',
  low_confidence_fields JSONB DEFAULT '{}',
  extracted_fields JSONB DEFAULT '{}',
  document_context_available BOOLEAN DEFAULT false,
  brieftext_length INTEGER DEFAULT 0,
  staleness_expires_at TIMESTAMPTZ,
  user_confirmed BOOLEAN DEFAULT false,
  user_correction_delta JSONB,
  correction_timestamp TIMESTAMPTZ,
  data_classification TEXT DEFAULT 'sensitive'
);

ALTER TABLE ingestion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ingestion events" ON ingestion_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ingestion events" ON ingestion_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ingestion events" ON ingestion_events FOR UPDATE USING (auth.uid() = user_id);

-- 2. aura_context_snapshots (operational: no learner content, just metadata)
CREATE TABLE IF NOT EXISTS aura_context_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  call_id TEXT NOT NULL,
  session_id TEXT,
  parent_ingestion_event_id UUID REFERENCES ingestion_events(id),
  call_timestamp TIMESTAMPTZ DEFAULT NOW(),
  profile_version_used TEXT,
  steering_dials JSONB DEFAULT '{}',
  active_task_id TEXT,
  rubric_confidence_at_call FLOAT DEFAULT 0,
  context_fields_present JSONB DEFAULT '{}',
  context_fields_missing JSONB DEFAULT '{}',
  estimated_token_count INTEGER DEFAULT 0,
  context_truncated BOOLEAN DEFAULT false,
  truncated_fields TEXT[] DEFAULT '{}',
  brieftext_length_at_call INTEGER DEFAULT 0,
  document_context_available BOOLEAN DEFAULT false,
  data_classification TEXT DEFAULT 'operational'
);

ALTER TABLE aura_context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own context snapshots" ON aura_context_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own context snapshots" ON aura_context_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. aura_response_flags (operational: user feedback on AURA quality)
CREATE TABLE IF NOT EXISTS aura_response_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  call_id TEXT,
  session_id TEXT,
  parent_ingestion_event_id UUID,
  response_id TEXT,
  call_timestamp TIMESTAMPTZ DEFAULT NOW(),
  expressed_confidence_level TEXT CHECK (expressed_confidence_level IN ('certain', 'hedged', 'uncertain')),
  actual_rubric_confidence FLOAT DEFAULT 0,
  calibration_delta FLOAT DEFAULT 0,
  learner_flagged_wrong BOOLEAN DEFAULT false,
  flag_category TEXT,
  flag_timestamp TIMESTAMPTZ,
  session_ended_without_submission BOOLEAN DEFAULT false,
  data_classification TEXT DEFAULT 'operational'
);

ALTER TABLE aura_response_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own response flags" ON aura_response_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own response flags" ON aura_response_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own response flags" ON aura_response_flags FOR UPDATE USING (auth.uid() = user_id);

-- 4. profile_behaviour_divergence (sensitive: learner behaviour patterns)
CREATE TABLE IF NOT EXISTS profile_behaviour_divergence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  observation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  sessions_analysed INTEGER DEFAULT 0,
  declared_scaffolding_preference TEXT,
  observed_tier1_usage_rate FLOAT DEFAULT 0,
  declared_processing_speed TEXT,
  observed_idle_events_per_session FLOAT DEFAULT 0,
  divergence_score FLOAT DEFAULT 0,
  divergence_fields TEXT[] DEFAULT '{}',
  surfaced_to_learner BOOLEAN DEFAULT false,
  data_classification TEXT DEFAULT 'sensitive'
);

ALTER TABLE profile_behaviour_divergence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own divergence" ON profile_behaviour_divergence FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own divergence" ON profile_behaviour_divergence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own divergence" ON profile_behaviour_divergence FOR UPDATE USING (auth.uid() = user_id);

-- 5. outcome_signals (sensitive: grade data and task completion)
CREATE TABLE IF NOT EXISTS outcome_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  task_id TEXT,
  session_ids TEXT[] DEFAULT '{}',
  submission_completed BOOLEAN DEFAULT false,
  submission_timestamp TIMESTAMPTZ,
  self_reported_grade TEXT,
  grade_entered_timestamp TIMESTAMPTZ,
  aura_calls_in_session_count INTEGER DEFAULT 0,
  tier1_usage_rate FLOAT DEFAULT 0,
  tier2_response_count INTEGER DEFAULT 0,
  idle_events_count INTEGER DEFAULT 0,
  pareto_steps_completed INTEGER DEFAULT 0,
  data_classification TEXT DEFAULT 'sensitive'
);

ALTER TABLE outcome_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own outcome signals" ON outcome_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own outcome signals" ON outcome_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own outcome signals" ON outcome_signals FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ingestion_events_user ON ingestion_events(user_id, extraction_timestamp DESC);
CREATE INDEX idx_aura_context_user ON aura_context_snapshots(user_id, call_timestamp DESC);
CREATE INDEX idx_response_flags_user ON aura_response_flags(user_id, call_timestamp DESC);
CREATE INDEX idx_outcome_signals_user ON outcome_signals(user_id, submission_timestamp DESC);
CREATE INDEX idx_divergence_user ON profile_behaviour_divergence(user_id, observation_timestamp DESC);
