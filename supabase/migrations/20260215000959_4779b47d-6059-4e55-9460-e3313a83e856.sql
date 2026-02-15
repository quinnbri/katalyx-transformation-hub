
CREATE TABLE public.generated_backlogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  backlog_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_backlogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backlogs"
  ON public.generated_backlogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backlogs"
  ON public.generated_backlogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backlogs"
  ON public.generated_backlogs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_generated_backlogs_assessment ON public.generated_backlogs (assessment_id);
