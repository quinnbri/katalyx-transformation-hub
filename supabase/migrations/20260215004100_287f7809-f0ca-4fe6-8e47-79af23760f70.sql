
CREATE POLICY "Users can update own backlogs"
  ON public.generated_backlogs FOR UPDATE
  USING (auth.uid() = user_id);
