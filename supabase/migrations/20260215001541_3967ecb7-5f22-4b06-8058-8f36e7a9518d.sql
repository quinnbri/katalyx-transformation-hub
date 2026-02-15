
ALTER TABLE public.generated_backlogs
  ADD COLUMN is_customized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN original_backlog_data JSONB;
