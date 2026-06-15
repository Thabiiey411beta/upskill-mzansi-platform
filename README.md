# Enhanced Vite React TypeScript Template

This template includes built-in detection for missing CSS variables between your Tailwind config and CSS files.

## Features

- **CSS Variable Detection**: Automatically detects if CSS variables referenced in `tailwind.config.cjs` are defined in `src/index.css`
- **Enhanced Linting**: Includes ESLint, Stylelint, and custom CSS variable validation
- **Shadcn/ui**: Pre-configured with all Shadcn components
- **Modern Stack**: Vite + React + TypeScript + Tailwind CSS

## Available Scripts

```bash
# Development
npm run dev        # Start Vite dev server (http://localhost:3000)
npm run build      # Build for production
npm run preview    # Preview production build

# Job Data Seeding
npm run scrape     # Scrape and seed job data from src/data/jobs.ts into Supabase

# Linting
npm run lint       # Run all linting (includes CSS variable check)
npm run check:css-vars  # Check only CSS variables
npm run lint:js    # ESLint
npm run lint:css   # Stylelint
```

## Job Scraper Setup

The job scraper automates seeding job data into your Supabase database.

### Prerequisites

1. **Supabase Project**: Set up a Supabase project at https://supabase.com
2. **Environment Variables**: Add these to your `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Database Setup

Before running the scraper, create the `jobs` table in your Supabase database:

1. Go to the **SQL Editor** in your Supabase dashboard
2. Create a new query and paste this SQL:

```sql
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

-- Create policy to allow authenticated users to manage jobs
CREATE POLICY "Enable insert for authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.jobs
  FOR DELETE USING (auth.role() = 'authenticated');
```

3. Click **Run** to execute the SQL

### Running the Scraper

```bash
# Seed all jobs from src/data/jobs.ts into Supabase
npm run scrape

# Expected output:
# 🔄 Starting job scraper...
# 📖 Loading jobs from src/data/jobs.ts...
# ✅ Loaded 15 jobs
# 📤 Upserting 15 jobs into Supabase...
# ✅ Successfully upserted 15 jobs
# ✨ Job scraping completed successfully!
```

### How It Works

1. **Loads job data** from `src/data/jobs.ts` (all jobs with their details)
2. **Connects to Supabase** using your environment variables
3. **Transforms job properties** from camelCase to snake_case for the database
4. **Upserts jobs** (updates existing, inserts new based on job ID)
5. **Logs success/failure** with detailed error messages

### Troubleshooting

**Error: Missing Supabase environment variables**
- Ensure `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Error: Table does not exist**
- Run the SQL setup above to create the `jobs` table

**Error: Permission denied**
- Check that RLS policies allow inserts/updates for authenticated users

## CSS Variable Detection

The template includes a custom script that:

1. **Parses `tailwind.config.cjs`** to find all `var(--variable)` references
2. **Parses `src/index.css`** to find all defined CSS variables (`--variable:`)
3. **Cross-references** them to find missing definitions
4. **Reports undefined variables** with clear error messages

### Example Output

When CSS variables are missing:
```
❌ Undefined CSS variables found in tailwind.config.cjs:
   --sidebar-background
   --sidebar-foreground
   --sidebar-primary

Add these variables to src/index.css
```

When all variables are defined:
```
✅ All CSS variables in tailwind.config.cjs are defined
```

## How It Works

The detection happens during the `npm run lint` command, which will:
- Exit with error code 1 if undefined variables are found
- Show exactly which variables need to be added to your CSS file
- Integrate seamlessly with your development workflow

This prevents runtime CSS issues where Tailwind classes reference undefined CSS variables.