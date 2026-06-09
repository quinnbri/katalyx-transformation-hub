
-- 1) shared_backlogs: replace overly broad public SELECT with a token-scoped RPC
DROP POLICY IF EXISTS "Anyone can view non-expired shares by token" ON public.shared_backlogs;

CREATE OR REPLACE FUNCTION public.get_shared_backlog(p_token text)
RETURNS TABLE (
  company_name text,
  backlog_data jsonb,
  scores jsonb,
  business_context jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sb.company_name, sb.backlog_data, sb.scores, sb.business_context, sb.created_at
  FROM public.shared_backlogs sb
  WHERE sb.share_token = p_token
    AND (sb.expires_at IS NULL OR sb.expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_backlog(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_backlog(text) TO anon, authenticated;

-- 2) api_rate_limits: restrict INSERT/UPDATE/DELETE to the row owner (service_role bypasses RLS)
CREATE POLICY "Users can insert own rate limits"
  ON public.api_rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
  ON public.api_rate_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rate limits"
  ON public.api_rate_limits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) Lock down SECURITY DEFINER helper functions not meant for direct client calls
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_sprint_progress(uuid, integer) FROM PUBLIC, anon;
-- handle_new_user is a trigger function; remove direct execute access
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4) Set immutable search_path on trigger function flagged by linter
CREATE OR REPLACE FUNCTION public.nba_advisor_sessions_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
