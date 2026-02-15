
CREATE TABLE public.shared_backlogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  backlog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_name TEXT,
  backlog_data JSONB NOT NULL,
  scores JSONB,
  business_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.shared_backlogs ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Users can view own shares"
  ON public.shared_backlogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares"
  ON public.shared_backlogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON public.shared_backlogs FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone with the token can view (for public sharing)
CREATE POLICY "Anyone can view by token"
  ON public.shared_backlogs FOR SELECT
  USING (true);

CREATE INDEX idx_shared_backlogs_token ON public.shared_backlogs (share_token);
