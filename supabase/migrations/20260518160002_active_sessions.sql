CREATE TABLE IF NOT EXISTS active_sessions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_ping TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session" ON active_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read count" ON active_sessions
  FOR SELECT USING (true);
