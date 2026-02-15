
-- ============================================================================
-- KATALYX Schema Fixes - Foreign Keys, Constraints, and Security
-- Created: 2026-02-15
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Add Missing Foreign Key Constraints
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.business_context
  ADD CONSTRAINT fk_business_context_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.generated_backlogs
  ADD CONSTRAINT fk_generated_backlogs_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.generated_backlogs
  ADD CONSTRAINT fk_generated_backlogs_assessment
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

ALTER TABLE public.shared_backlogs
  ADD CONSTRAINT fk_shared_backlogs_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shared_backlogs
  ADD CONSTRAINT fk_shared_backlogs_backlog
  FOREIGN KEY (backlog_id) REFERENCES public.generated_backlogs(id) ON DELETE CASCADE;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Fix Share Link Expiration Security
-- ──────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view by token" ON public.shared_backlogs;

CREATE POLICY "Anyone can view non-expired shares by token"
  ON public.shared_backlogs FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Add Backlog Action Progress Tracking
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE public.backlog_action_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backlog_id UUID NOT NULL REFERENCES public.generated_backlogs(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  success_metric_achieved TEXT,
  retrospective_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (backlog_id, action_id)
);

ALTER TABLE public.backlog_action_progress
  ADD CONSTRAINT valid_status CHECK (
    status IN ('not_started', 'in_progress', 'blocked', 'complete')
  );

ALTER TABLE public.backlog_action_progress
  ADD CONSTRAINT valid_success_metric CHECK (
    success_metric_achieved IS NULL OR
    success_metric_achieved IN ('yes', 'partially', 'no')
  );

ALTER TABLE public.backlog_action_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.backlog_action_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON public.backlog_action_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.backlog_action_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.backlog_action_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_backlog_action_progress_updated_at
  BEFORE UPDATE ON public.backlog_action_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_backlog_action_progress_backlog 
  ON public.backlog_action_progress (backlog_id);

CREATE INDEX idx_backlog_action_progress_user 
  ON public.backlog_action_progress (user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Add API Rate Limiting Infrastructure
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_rate_limits_user_endpoint_window 
  ON public.api_rate_limits (user_id, endpoint, window_start DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Add Backlog Generation Analytics/Logging
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE public.backlog_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  backlog_id UUID REFERENCES public.generated_backlogs(id) ON DELETE SET NULL,
  transformation_driver TEXT,
  budget_usd NUMERIC,
  generation_duration_ms INT,
  ai_model TEXT,
  tokens_used INT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backlog_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation logs"
  ON public.backlog_generation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert generation logs"
  ON public.backlog_generation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_generation_log_user 
  ON public.backlog_generation_log (user_id, created_at DESC);

CREATE INDEX idx_generation_log_assessment 
  ON public.backlog_generation_log (assessment_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Add Unique Constraint to Prevent Duplicate Backlogs
-- ──────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX idx_one_backlog_per_assessment 
  ON public.generated_backlogs (assessment_id)
  WHERE is_customized = false;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Add Helper Function for Sprint Progress Calculation
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calculate_sprint_progress(
  p_backlog_id UUID,
  p_sprint_number INT
)
RETURNS TABLE (
  total_actions INT,
  completed_actions INT,
  in_progress_actions INT,
  blocked_actions INT,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH sprint_actions AS (
    SELECT jsonb_array_elements(
      (SELECT backlog_data->'sprints'->p_sprint_number->'actions' 
       FROM generated_backlogs 
       WHERE id = p_backlog_id)
    )->>'id' AS action_id
  ),
  progress_stats AS (
    SELECT
      COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE bap.status = 'complete')::INT AS completed,
      COUNT(*) FILTER (WHERE bap.status = 'in_progress')::INT AS in_prog,
      COUNT(*) FILTER (WHERE bap.status = 'blocked')::INT AS block
    FROM sprint_actions sa
    LEFT JOIN backlog_action_progress bap 
      ON bap.action_id = sa.action_id 
      AND bap.backlog_id = p_backlog_id
  )
  SELECT
    ps.total,
    ps.completed,
    ps.in_prog,
    ps.block,
    CASE 
      WHEN ps.total > 0 THEN ROUND((ps.completed::NUMERIC / ps.total::NUMERIC) * 100, 1)
      ELSE 0
    END AS completion_percentage
  FROM progress_stats ps;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Add Helper Function to Clean Up Old Rate Limit Records
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 9. Add Data Validation Constraints
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.business_context
  ADD CONSTRAINT budget_reasonable CHECK (
    budget_usd IS NULL OR (budget_usd >= 0 AND budget_usd <= 100000000)
  );

ALTER TABLE public.business_context
  ADD CONSTRAINT transformation_driver_not_empty CHECK (
    transformation_driver IS NOT NULL AND length(trim(transformation_driver)) > 0
  );

-- ──────────────────────────────────────────────────────────────────────────
-- 10. Add Comments for Documentation
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.backlog_action_progress IS 
  'Tracks user progress on individual backlog action items';

COMMENT ON TABLE public.api_rate_limits IS 
  'Rate limiting for API endpoints to prevent abuse';

COMMENT ON TABLE public.backlog_generation_log IS 
  'Audit log of all backlog generation requests for analytics';

COMMENT ON FUNCTION public.calculate_sprint_progress IS 
  'Calculates completion statistics for a specific sprint within a backlog';

COMMENT ON FUNCTION public.cleanup_old_rate_limits IS 
  'Removes rate limit records older than 24 hours to keep table size manageable';
