import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Schema: id (uuid auto), title, company, location, province, type, salary_min, salary_max,
//         currency, sector, seta_alignment, description, requirements (text[]), is_active, created_at
const jobs = [
  {
    title: 'Junior Full Stack Developer',
    company: 'Amanzi Labs',
    location: 'Sandton, Johannesburg',
    province: 'Gauteng',
    type: 'Permanent',
    salary_min: 264000,
    salary_max: 324000,
    currency: 'ZAR',
    sector: 'IT & Tech',
    seta_alignment: 'MICT SETA',
    description: 'Build and maintain client-facing React and Node.js applications. Support the product team with modern UI design and back-end integrations.',
    requirements: ['1+ year JavaScript or TypeScript', 'Basic React and Node.js', 'REST API knowledge', 'Strong teamwork skills'],
    is_active: true,
  },
  {
    title: 'Risk Analyst',
    company: 'BankSphere Group',
    location: 'Cape Town CBD',
    province: 'Western Cape',
    type: 'Hybrid',
    salary_min: 420000,
    salary_max: 504000,
    currency: 'ZAR',
    sector: 'Finance & Banking',
    seta_alignment: 'FASSET',
    description: 'Analyse credit portfolios, monitor market risk, and support the risk management team with monthly reporting and stress testing.',
    requirements: ['3+ years banking risk or credit analysis', 'Basel regulation knowledge', 'Advanced Excel or Power BI', 'Strong stakeholder communication'],
    is_active: true,
  },
  {
    title: 'Mine Environmental Technician',
    company: 'Kwanda Resources',
    location: 'Emalahleni',
    province: 'Mpumalanga',
    type: 'Contract',
    salary_min: 216000,
    salary_max: 264000,
    currency: 'ZAR',
    sector: 'Mining & Resources',
    seta_alignment: 'MQA',
    description: 'Support environmental compliance, perform water quality tests, and help with rehabilitation reports for a coal mine.',
    requirements: ['National Diploma in Environmental Management', 'Field sampling experience', 'Mining environmental legislation knowledge', 'Willingness to work on site'],
    is_active: true,
  },
  {
    title: 'Production Supervisor',
    company: 'Mzansi Steel Works',
    location: 'Rustenburg',
    province: 'North West',
    type: 'Permanent',
    salary_min: 576000,
    salary_max: 696000,
    currency: 'ZAR',
    sector: 'Manufacturing',
    seta_alignment: 'merSETA',
    description: 'Lead a production team in a steel manufacturing environment, optimise workflows, and ensure health and safety compliance.',
    requirements: ['5+ years manufacturing supervision', 'Lean Manufacturing or Six Sigma', 'Strong leadership skills', 'SAP or ERP experience'],
    is_active: true,
  },
  {
    title: 'Community Nurse Practitioner',
    company: 'Ubuntu Health Network',
    location: 'Gqeberha',
    province: 'Eastern Cape',
    type: 'Permanent',
    salary_min: 360000,
    salary_max: 432000,
    currency: 'ZAR',
    sector: 'Healthcare',
    seta_alignment: 'HWSETA',
    description: 'Provide primary healthcare at local clinics, coordinate outreach screening programmes, and support patient referral pathways.',
    requirements: ['SANC registered', '3+ years community or primary care', 'Strong patient communication', 'Health promotion experience'],
    is_active: true,
  },
  {
    title: 'Senior Curriculum Developer',
    company: 'EduFuture Academy',
    location: 'Durban',
    province: 'KwaZulu-Natal',
    type: 'Hybrid',
    salary_min: 528000,
    salary_max: 636000,
    currency: 'ZAR',
    sector: 'Education',
    seta_alignment: 'ETDP SETA',
    description: 'Design NQF-aligned training materials and facilitate educator development programmes across KwaZulu-Natal.',
    requirements: ['5+ years curriculum design', 'NQF and SETA accreditation knowledge', 'Blended learning content experience', 'Project coordination skills'],
    is_active: true,
  },
  {
    title: 'Civil Site Engineer',
    company: 'Nathi Constructions',
    location: 'Kimberley',
    province: 'Northern Cape',
    type: 'Contract',
    salary_min: 480000,
    salary_max: 600000,
    currency: 'ZAR',
    sector: 'Construction & Engineering',
    seta_alignment: 'CETA',
    description: 'Support civil engineering projects, manage site coordination, and maintain quality controls for road and infrastructure works.',
    requirements: ['BEng or Diploma in Civil Engineering', '3+ years site engineering', 'Construction safety knowledge', 'Project scheduling experience'],
    is_active: true,
  },
  {
    title: 'Policy & Stakeholder Advisor',
    company: 'National Skills Council',
    location: 'Pietermaritzburg',
    province: 'KwaZulu-Natal',
    type: 'Permanent',
    salary_min: 696000,
    salary_max: 840000,
    currency: 'ZAR',
    sector: 'Government & Public Sector',
    seta_alignment: 'PSETA',
    description: 'Guide public sector skills development policy, manage stakeholder engagement, and support SETA partnerships for national labour programmes.',
    requirements: ['8+ years public policy or government relations', 'Strong writing and stakeholder management', 'NSDS, WSP/ATR and SETA framework knowledge', 'Multi-party programme facilitation'],
    is_active: true,
  },
  {
    title: 'Agricultural Extension Officer',
    company: 'AgriGrowth Solutions',
    location: 'Tzaneen',
    province: 'Limpopo',
    type: 'Permanent',
    salary_min: 360000,
    salary_max: 444000,
    currency: 'ZAR',
    sector: 'Agriculture',
    seta_alignment: 'AgriSETA',
    description: 'Coordinate farmer training, support sustainable crop programmes, and help farmers access AgriSETA learnership opportunities.',
    requirements: ['Diploma or degree in Agriculture', 'Extension services or community training experience', 'Rural stakeholder communication', 'Agricultural funding knowledge'],
    is_active: true,
  },
  {
    title: 'Mechanical Fitter Apprentice',
    company: 'SteelCore Manufacturing',
    location: 'Ekurhuleni',
    province: 'Gauteng',
    type: 'Contract',
    salary_min: 180000,
    salary_max: 216000,
    currency: 'ZAR',
    sector: 'Manufacturing',
    seta_alignment: 'merSETA',
    description: 'Join a learnership programme to develop mechanical fitting skills, support production maintenance, and gain accredited trade experience.',
    requirements: ['Matric certificate', 'Interest in mechanical engineering', 'Willingness to work on factory floor', 'Good attendance and reliability'],
    is_active: true,
  },
];

async function seed() {
  console.log('🔄 Starting job seeding...');

  const { error } = await supabase.from('jobs').insert(jobs);

  if (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${jobs.length} jobs into Supabase.`);
}

seed();
