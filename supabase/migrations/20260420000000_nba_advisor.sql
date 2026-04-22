-- NBA Advisor: stores per-user, per-epic consulting sessions, the tasks the
-- advisor proposed (and whether the user accepted them), and any strategies
-- the advisor drafted.

-- 1. Sessions: one row per (user, assessment, roadmap item index)
CREATE TABLE public.nba_advisor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  roadmap_item_index INTEGER NOT NULL,
  epic_action TEXT NOT NULL,
  domain TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  epic_addressed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, assessment_id, roadmap_item_index)
);

ALTER TABLE public.nba_advisor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own advisor sessions"
  ON public.nba_advisor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own advisor sessions"
  ON public.nba_advisor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own advisor sessions"
  ON public.nba_advisor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own advisor sessions"
  ON public.nba_advisor_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_nba_sessions_assessment ON public.nba_advisor_sessions (assessment_id);
CREATE INDEX idx_nba_sessions_user ON public.nba_advisor_sessions (user_id);

-- 2. Proposed tasks: what the advisor suggested, plus acceptance state
CREATE TABLE public.nba_proposed_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.nba_advisor_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_role TEXT,
  effort_days INTEGER,
  outcome TEXT,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nba_proposed_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own proposed tasks"
  ON public.nba_proposed_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own proposed tasks"
  ON public.nba_proposed_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own proposed tasks"
  ON public.nba_proposed_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own proposed tasks"
  ON public.nba_proposed_tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_nba_tasks_session ON public.nba_proposed_tasks (session_id);

-- 3. Generated strategies: full markdown strategies the advisor drafted
CREATE TABLE public.nba_generated_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.nba_advisor_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  domain TEXT,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nba_generated_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own strategies"
  ON public.nba_generated_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own strategies"
  ON public.nba_generated_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own strategies"
  ON public.nba_generated_strategies FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_nba_strategies_session ON public.nba_generated_strategies (session_id);

-- Keep updated_at fresh on sessions when messages change
CREATE OR REPLACE FUNCTION public.nba_advisor_sessions_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nba_advisor_sessions_touch
  BEFORE UPDATE ON public.nba_advisor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.nba_advisor_sessions_touch_updated_at();
