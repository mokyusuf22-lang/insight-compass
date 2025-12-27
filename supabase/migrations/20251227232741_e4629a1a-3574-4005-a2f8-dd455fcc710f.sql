-- Add subscription tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier text DEFAULT NULL,
ADD COLUMN last_payment_date timestamp with time zone DEFAULT NULL,
ADD COLUMN subscription_end_date timestamp with time zone DEFAULT NULL;