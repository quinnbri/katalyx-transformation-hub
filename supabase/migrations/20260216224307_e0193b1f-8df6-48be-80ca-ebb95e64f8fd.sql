-- Add column to track question format (direct vs scenario)
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS question_format text NOT NULL DEFAULT 'direct';

-- Add column to store the original question text before transformation
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS original_question_text text;

-- Add column for scenario context (the situation description)
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS scenario_context text;

-- Comment for clarity
COMMENT ON COLUMN public.assessment_questions.question_format IS 'direct = standard maturity scale, scenario = scenario-based behavioral';
COMMENT ON COLUMN public.assessment_questions.scenario_context IS 'The situational context presented before the question in scenario format';
