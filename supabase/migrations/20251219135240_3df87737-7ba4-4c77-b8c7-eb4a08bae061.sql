-- Add unique constraint for upsert on assessment_responses
ALTER TABLE public.assessment_responses ADD CONSTRAINT assessment_responses_user_question_unique UNIQUE (user_id, question_id);