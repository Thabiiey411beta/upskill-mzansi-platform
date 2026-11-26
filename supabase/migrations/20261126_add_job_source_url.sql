-- Add a source URL column so scraped jobs can link back to the original advert.
-- Careers24 adverts must link back to careers24.com (apply on Careers24),
-- so every scraped row carries its canonical advert URL here.
-- Safe to run more than once.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url text;
