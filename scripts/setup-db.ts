/**
 * Supabase Table Setup Script
 * 
 * Creates the jobs table and sets up RLS policies
 * Run this once to initialize the database schema
 * 
 * Usage: npm run setup:db
 */

import 'dotenv/config'
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Error: Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)'
  )
  console.error('Please add these to your .env.local file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const CREATE_JOBS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  sector TEXT NOT NULL,
  province TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  salary_text TEXT NOT NULL,
  annual_salary INTEGER NOT NULL,
  posted_at TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL,
  responsibilities TEXT[] NOT NULL,
  benefits TEXT[] NOT NULL,
  tags TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
CREATE POLICY "Enable read access for all users" ON public.jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.jobs;
CREATE POLICY "Enable insert for authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.jobs;
CREATE POLICY "Enable update for authenticated users" ON public.jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.jobs;
CREATE POLICY "Enable delete for authenticated users" ON public.jobs
  FOR DELETE USING (auth.role() = 'authenticated');
`

async function setupDatabase() {
  console.log('🔄 Setting up Supabase database schema...\n')

  try {
    console.log('📋 Verifying jobs table in Supabase...')

    const { error: checkError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .limit(0)

    if (checkError) {
      throw checkError
    }

    console.log('✅ Verified jobs table exists and is accessible.')
    console.log('\n📊 The jobs table is ready. You can now run: npm run scrape\n')
  } catch (error) {
    console.error('\n❌ Could not verify the jobs table in Supabase.')
    console.error('\nThis script cannot create database tables using a Supabase anon key.')
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    }
    console.error('\nIf the jobs table is missing, create it manually in the Supabase SQL editor using the SQL below:\n')
    console.error('---START SQL---')
    console.error(CREATE_JOBS_TABLE_SQL)
    console.error('---END SQL---\n')
    console.error('After creating the table, run: npm run scrape')
    process.exit(1)
  }
}

setupDatabase()
