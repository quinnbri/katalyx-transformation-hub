
-- Pool of AI-generated scenario variants for each template question
CREATE TABLE public.question_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  variant_number INTEGER NOT NULL DEFAULT 1,
  scenario_context TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_descriptions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Each template can have multiple variants, but variant_number must be unique per template
ALTER TABLE public.question_variants
  ADD CONSTRAINT uq_template_variant UNIQUE (template_question_id, variant_number);

-- Index for fast lookup
CREATE INDEX idx_question_variants_template ON public.question_variants(template_question_id);

-- RLS: questions are public (read-only like assessment_questions)
ALTER TABLE public.question_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view question variants"
  ON public.question_variants FOR SELECT
  USING (true);

-- Track which variant each user got per assessment for consistency
CREATE TABLE public.assessment_variant_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.question_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, question_id)
);

ALTER TABLE public.assessment_variant_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON public.assessment_variant_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own assignments"
  ON public.assessment_variant_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()
  ));
