export type Province =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Free State'
  | 'Northern Cape'

export type Sector =
  | 'IT & Tech'
  | 'Finance & Banking'
  | 'Mining & Resources'
  | 'Manufacturing'
  | 'Healthcare'
  | 'Education'
  | 'Retail & FMCG'
  | 'Construction & Engineering'
  | 'Government & Public Sector'
  | 'Agriculture'

export type JobType = 'Permanent' | 'Contract' | 'Remote' | 'Hybrid'
export type ExperienceLevel = 'Entry-level' | 'Mid-level' | 'Senior' | 'Executive'
export type ApplicationStatus = 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected'

export interface Job {
  id: string
  title: string
  company: string
  sector: Sector
  province: Province
  location: string
  type: JobType
  experienceLevel: ExperienceLevel
  salaryText: string
  annualSalary: number
  postedAt: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  tags: string[]
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  company: string
  location: string
  appliedAt: string
  status: ApplicationStatus
  coverLetter: string
}

export interface UploadedCv {
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export interface Profile {
  fullName: string
  headline: string
  phone: string
  email: string
  provincePreference: Province | ''
  skills: string[]
  experienceYears: string
  summary: string
  workExperience: Array<{
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string
  }>
  education: string[]
  certifications: string[]
  languages: string[]
}

// Company size bands used in the business_profiles table
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'

export interface BusinessProfile {
  id: string                  // mirrors auth.users.id
  company_name: string
  registration_number: string | null  // CIPC format: YYYY/NNNNNN/NN
  industry: string | null
  size: CompanySize | null
  credits_balance: number     // purchased credits for AI tools / job posts
  created_at: string
}

export interface GapAnalysis {
  overallMatchScore: number
  strongMatches: string[]
  skillGaps: Array<{
    skill: string
    setaAlignment: string
    setaLink: string
    suggestedCourses: string[]
  }>
  fundingOptions: string[]
  priorityPlan: string[]
  summary: string
}
