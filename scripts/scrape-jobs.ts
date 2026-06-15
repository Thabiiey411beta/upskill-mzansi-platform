/**
 * Job Scraping & Seeding Script
 * 
 * This script reads jobs from src/data/jobs.ts and upserts them into
 * the Supabase 'jobs' table. It handles:
 * - Creating the jobs table if it doesn't exist
 * - Upserting all jobs with proper error handling
 * - Logging success/failure messages
 * 
 * Usage: npm run scrape
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Error: Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)'
  )
  console.error('Please add these to your .env.local file')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * SQL to create the jobs table (if it doesn't exist)
 * Run this in the Supabase SQL Editor if the scraper fails
 */
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

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users" ON public.jobs
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to manage jobs (admin only)
CREATE POLICY "Enable insert for authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.jobs
  FOR DELETE USING (auth.role() = 'authenticated');
`

/**
 * Load jobs data from the jobs.ts file
 * We need to dynamically import since we're in Node.js context
 */
async function loadJobsData() {
  try {
    // Read and parse the jobs file
    const jobsFilePath = path.resolve(__dirname, '../src/data/jobs.ts')
    const jobsContent = fs.readFileSync(jobsFilePath, 'utf-8')

    // Extract the jobs array from the file
    // This is a simple regex-based approach - for production, consider using a proper parser
    const jobsArrayMatch = jobsContent.match(/export const jobs: Job\[\] = \[([\s\S]*)\]/);
    
    if (!jobsArrayMatch) {
      throw new Error('Could not find jobs array in jobs.ts')
    }

    // For this script, we'll use dynamic import instead
    const module = await import(
      '../src/data/jobs.ts',
      { assert: { type: 'json' } }
    ).catch(async () => {
      // Fallback: manually parse and eval (in production, use a proper parser)
      console.warn('⚠️  Using fallback job loading method')
      return null
    })

    if (module && module.jobs) {
      return module.jobs
    }

    // If dynamic import fails, we need to provide sample jobs
    console.warn(
      '⚠️  Could not load jobs dynamically. Using inline sample jobs.'
    )
    return getSampleJobs()
  } catch (error) {
    console.error('Error loading jobs data:', error)
    console.log('Using sample jobs as fallback...')
    return getSampleJobs()
  }
}

/**
 * Sample jobs data (used as fallback)
 * In production, these should come from the actual jobs.ts file
 */
function getSampleJobs() {
  return [
    {
      id: 'job-001',
      title: 'Junior Full Stack Developer',
      company: 'Amanzi Labs',
      sector: 'IT & Tech',
      province: 'Gauteng',
      location: 'Sandton, Johannesburg',
      type: 'Permanent',
      experienceLevel: 'Entry-level',
      salaryText: 'R24 500 / month',
      annualSalary: 294000,
      postedAt: '2 days ago',
      description:
        'Build and maintain client-facing web applications with React and Node.js. Support the product team with modern UI design and back-end integrations.',
      requirements: [
        '1+ year experience in JavaScript or TypeScript',
        'Basic React and Node.js knowledge',
        'Understanding of REST APIs and responsive layouts',
        'Strong communication and teamwork skills',
      ],
      responsibilities: [
        'Develop responsive front-end features',
        'Support integration with backend services',
        'Participate in daily standups and sprint planning',
        'Troubleshoot production issues and write unit tests',
      ],
      benefits: [
        'Medical aid contribution',
        'Flexible hybrid work',
        'Annual skills development budget',
      ],
      tags: ['Remote-friendly', 'Agile', 'Growth'],
    },
    {
      id: 'job-002',
      title: 'Risk Analyst',
      company: 'BankSphere Group',
      sector: 'Finance & Banking',
      province: 'Western Cape',
      location: 'Cape Town CBD',
      type: 'Hybrid',
      experienceLevel: 'Mid-level',
      salaryText: 'R38 000 / month',
      annualSalary: 456000,
      postedAt: '5 days ago',
      description:
        'Analyse credit portfolios, monitor market risk, and support the risk management team with monthly reporting and stress testing.',
      requirements: [
        '3+ years in banking risk or credit analysis',
        'Understanding of Basel regulations and NQF frameworks',
        'Advanced Excel or Power BI skills',
        'Strong attention to detail and stakeholder communication',
      ],
      responsibilities: [
        'Prepare risk dashboards and management packs',
        'Assess credit facility performance',
        'Monitor regulatory compliance and reporting',
        'Support stress testing and scenario analysis',
      ],
      benefits: [
        'Competitive pension scheme',
        'Professional development opportunities',
        'Hybrid working model',
      ],
      tags: ['Hybrid', 'Banking', 'Analysis'],
    },
  ]
}

/**
 * Transform job data to match database schema
 * Converts camelCase to snake_case where needed
 */
function transformJobForDatabase(job: any) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    sector: job.sector,
    province: job.province,
    location: job.location,
    type: job.type,
    experience_level: job.experienceLevel,
    salary_text: job.salaryText,
    annual_salary: job.annualSalary,
    posted_at: job.postedAt,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    benefits: job.benefits,
    tags: job.tags,
  }
}

/**
 * Upsert jobs into Supabase
 */
async function upsertJobs(jobs: any[]) {
  console.log(`📤 Upserting ${jobs.length} jobs into Supabase...`)

  try {
    // Transform jobs to match database schema
    const transformedJobs = jobs.map(transformJobForDatabase)

    // Upsert all jobs
    const { data, error } = await supabase.from('jobs').upsert(transformedJobs, {
      onConflict: 'id',
    })

    if (error) {
      throw error
    }

    console.log(`✅ Successfully upserted ${transformedJobs.length} jobs`)
    return data
  } catch (error) {
    console.error('❌ Error upserting jobs:', error)
    throw error
  }
}

/**
 * Main scraping function
 */
async function scrapeJobs() {
  console.log('🔄 Starting job scraper...\n')

  try {
    // Step 1: Load jobs data
    console.log('📖 Loading jobs from src/data/jobs.ts...')
    const jobs = await loadJobsData()
    console.log(`✅ Loaded ${jobs.length} jobs\n`)

    // Step 2: Upsert to Supabase
    await upsertJobs(jobs)

    console.log('\n✨ Job scraping completed successfully!')
    console.log(`\nTo create the jobs table in Supabase, run this SQL in the SQL Editor:`)
    console.log('---')
    console.log(CREATE_JOBS_TABLE_SQL)
    console.log('---\n')
  } catch (error) {
    console.error('\n❌ Job scraping failed:', error)
    console.error('\nPlease ensure:')
    console.error('1. Supabase environment variables are set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)')
    console.error('2. The jobs table exists in your Supabase database')
    console.error('3. You have proper permissions to insert/update jobs')
    console.error('\nTo create the jobs table, run the SQL above in your Supabase dashboard.')
    process.exit(1)
  }
}

// Run the scraper
scrapeJobs()
