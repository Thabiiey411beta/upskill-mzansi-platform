import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load environmental configurations cleanly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required operational database environment credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const southAfricanJobPayloads = [
  { id: "sa-job-1", title: "Junior Full-Stack Web Developer", company: "Silicon Cape Solutions", sector: "Information Technology", province: "Western Cape", location: "Century City", type: "Full-time", experience_level: "Junior", salary_text: "R300,000 - R420,000 per annum", annual_salary: 360000, description: "Develop React workflows aligned to core cloud infrastructure frameworks.", requirements: ["React", "TypeScript", "Node.js"], responsibilities: ["Maintain clean APIs", "Write components"], benefits: ["Remote flexibility", "Medical Aid assistance"], tags: ["Tech", "React", "CapeTown"], posted_at: new Date().toISOString() },
  { id: "sa-job-2", title: "Electrical Engineering Apprentice", company: "Anglo American Platinum", sector: "Mining & Heavy Industry", province: "North West", location: "Rustenburg", type: "Learnership", experience_level: "Entry Level", salary_text: "R9,500 monthly stipend", annual_salary: 114000, description: "Gain MQA SETA aligned electrical engineering certification fields safely inside mining installations.", requirements: ["N2 Engineering Math", "Matric Physics"], responsibilities: ["Assist master technicians", "Comply with safety protocols"], benefits: ["Full training funding", "Housing allowance assistance"], tags: ["SETA", "Learnership", "Mining"], posted_at: new Date().toISOString() },
  { id: "sa-job-3", title: "FinTech Compliance Officer", company: "Yoco Payments", sector: "Financial Services", province: "Gauteng", location: "Rosebank", type: "Full-time", experience_level: "Mid-Senior", salary_text: "R550,000 - R700,000 annual", annual_salary: 625000, description: "Ensure internal payments channels scale fluidly alongside SARS, FICA, and Reserve Bank regulations.", requirements: ["BCom Law or equivalent", "3+ years corporate compliance track record"], responsibilities: ["Audit transaction parameters", "Liaise with regulators"], benefits: ["Equity options", "Performance incentives"], tags: ["FinTech", "Compliance", "Johannesburg"], posted_at: new Date().toISOString() },
  { id: "sa-job-4", title: "Call Centre Agent (Fluency in isiZulu/English)", company: "Discovery Health", sector: "Healthcare Logistics", province: "KwaZulu-Natal", location: "Umhlangaga Ridge", type: "Contract", experience_level: "Intermediate", salary_text: "R14,000 pm + target performance commission", annual_salary: 168000, description: "Field and route healthcare claim optimization tickets via digital desks.", requirements: ["Matric certificate", "Excellent multilingual verbal translation skills"], responsibilities: ["Resolve client inbound calls", "Log claims securely"], benefits: ["Comprehensive company training", "Shift travel allowance"], tags: ["CustomerCare", "Durban", "Discovery"], posted_at: new Date().toISOString() },
  { id: "sa-job-5", title: "Supply Chain Graduate Intern", company: "Shoprite Group Logistics", sector: "Retail & Supply Systems", province: "Free State", location: "Bloemfontein", type: "Internship", experience_level: "Graduate", salary_text: "R12,500 monthly compensation", annual_salary: 150000, description: "Gain hands-on inventory tracking training within one of Africa's largest distribution grids.", requirements: ["Diploma/Degree in Logistics or Supply Chain Management"], responsibilities: ["Track fulfillment metrics", "Optimize delivery rosters"], benefits: ["Direct corporate fast-track mentorship options"], tags: ["Retail", "Graduate", "Logistics"], posted_at: new Date().toISOString() }
];

async function executeSeedingCycle() {
  console.log("🔄 Starting structural job data injection services...");
  
  const { data, error } = await supabase
    .from('jobs')
    .upsert(southAfricanJobPayloads, { onConflict: 'id' });

  if (error) {
    console.error("❌ Seeding failure exception details:", error.message);
    process.exit(1);
  }

  console.log("✨ Data synchronization complete! 5 verified enterprise positions injected into Supabase securely.");
}

executeSeedingCycle();
