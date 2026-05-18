-- Sprint 1: Pre-Session Intelligence columns
-- Adds three fields to aura_history so AURA can reference the student's stated
-- grade target, teacher priority, and hardest part in every response.
ALTER TABLE aura_history ADD COLUMN IF NOT EXISTS target_grade TEXT;
ALTER TABLE aura_history ADD COLUMN IF NOT EXISTS teacher_priority TEXT;
ALTER TABLE aura_history ADD COLUMN IF NOT EXISTS hardest_part TEXT;
