CREATE POLICY "Users can delete own results" 
ON public.assessment_results 
FOR DELETE 
USING (auth.uid() = user_id);