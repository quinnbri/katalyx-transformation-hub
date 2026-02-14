
CREATE TABLE public.business_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  transformation_driver TEXT NOT NULL,
  target_date DATE,
  budget_usd NUMERIC,
  hard_constraints TEXT[] DEFAULT '{}',
  additional_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business context"
ON public.business_context FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own business context"
ON public.business_context FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business context"
ON public.business_context FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business context"
ON public.business_context FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_business_context_updated_at
BEFORE UPDATE ON public.business_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
