import type { GapAnalysis, Job, Profile } from '@/types'

export const CV_PARSING_PROMPT = `You are an expert CV/resume parser for South African job seekers.

Extract all key information from the following CV text and return it as clean, structured JSON.

CV Text:
{{CV_TEXT}}

Required JSON structure (use null for missing fields, empty arrays where appropriate):

{
  "full_name": "string",
  "professional_headline": "string or null",
  "phone": "string or null",
  "email": "string or null",
  "location": "string or null",
  "province_preference": "string or null",
  "skills": ["skill1", "skill2"],
  "work_experience": [{ "job_title": "...", "company": "...", "location": "...", "start_date": "...", "end_date": "... or 'Present'", "description": "..." }],
  "education": [{ "degree": "...", "institution": "...", "location": "...", "graduation_year": "..." }],
  "certifications": ["cert1"],
  "languages": ["English"],
  "summary": "Professional summary or null"
}

Rules: Accurate, concise, preserve original wording. Detect SA-specific elements (provinces, BEE, matric, etc.). Output ONLY valid JSON.
`

export const COVER_LETTER_PROMPT = `You are a professional career coach helping South African job seekers.

Generate a tailored, concise cover letter (max 350 words) for this job.

Job Details:
{{JOB_DESCRIPTION}}

Candidate Profile:
{{PARSED_CV_JSON}}

Use warm, professional SA-appropriate tone. Highlight matches, show enthusiasm. Return only the full letter text.
`

export const SKILLS_GAP_PROMPT = `You are an expert South African career coach familiar with NQF, SETAs, and learnership funding.

Analyze skills vs. job and return structured JSON including overall_match_score, strong_matches, skill_gaps (with seta_alignment + official links, suggested_courses, funding_options like Mandatory/Discretionary Grants, NSF, Section 12H, etc.), priority_upskilling_plan, and encouraging summary.

Candidate:
{{PARSED_CV_JSON}}

Job:
{{JOB_DESCRIPTION}}
`

export async function callAiEdge(endpoint: string, payload: any) {
  const res = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`AI edge call failed: ${res.status}`)
  }

  return res.json()
}

const setaAlignments: Record<string, { name: string; link: string }> = {
  'IT & Tech': { name: 'MICT SETA', link: 'https://www.mict.org.za' },
  'Finance & Banking': { name: 'BANKSETA', link: 'https://www.bankseta.org.za' },
  'Mining & Resources': { name: 'CHIETA', link: 'https://www.chieta.org.za' },
  Manufacturing: { name: 'merSETA', link: 'https://www.merseta.org.za' },
  Healthcare: { name: 'HWSETA', link: 'https://www.hwseta.org.za' },
  Education: { name: 'ETDP SETA', link: 'https://www.etdpseta.org.za' },
  'Retail & FMCG': { name: 'SETA Retail', link: 'https://www.faset.org.za' },
  'Construction & Engineering': { name: 'CETA', link: 'https://www.ceta.org.za' },
  'Government & Public Sector': { name: 'PSETA', link: 'https://www.pseta.org.za' },
  Agriculture: { name: 'AgriSETA', link: 'https://www.agriseta.org.za' },
}

const quickFunding = [
  'Submit your WSP/ATR to your assigned SETA before the annual deadline.',
  'Review discretionary grant opportunities for accredited skills programmes.',
  'Explore National Skills Fund (NSF) bursaries for unemployed learners and bursary-linked learnerships.',
  'Check employer-supported Section 12H incentives for skills development projects.',
  'Ask employers about stipend support for learners and apprentices.',
]

const sanitize = (value: string) => value.trim().toLowerCase()

const scoreMatch = (profile: Profile, job: Job) => {
  const profileKeywords = new Set(profile.skills.map(sanitize))
  const matchCount = job.requirements.reduce((count, requirement) => {
    const words = requirement.split(/[^a-zA-Z0-9]+/).map(sanitize)
    return count + (words.some((word) => profileKeywords.has(word)) ? 1 : 0)
  }, 0)
  return Math.round((matchCount / Math.max(job.requirements.length, 1)) * 100)
}

export function generateCoverLetter(job: Job, profile: Profile) {
  const topSkills = profile.skills.slice(0, 4).join(', ') || 'adaptable teamwork'
  const intro = profile.summary
    ? `${profile.summary} I am excited to apply for the ${job.title} role at ${job.company}.`
    : `I am a motivated ${profile.headline || 'professional'} with a strong interest in the ${job.sector} sector.`

  return `${intro}

My background includes ${topSkills}. I am confident these strengths will help me contribute to ${job.company} by supporting ${job.responsibilities[0].toLowerCase()} and delivering strong results across ${job.requirements[0].toLowerCase()}. I am particularly drawn to this role because of the opportunity to grow within a South African company that values skills development, quality delivery and SETA-aligned learning.

Thank you for considering my application. I look forward to the opportunity to discuss how I can support ${job.company} in this role.`
}

export function analyzeSkillsGap(job: Job, profile: Profile): GapAnalysis {
  const profileSkills = profile.skills.map(sanitize)
  const strongMatches = job.requirements.filter((req) =>
    req
      .split(/[^a-zA-Z0-9]+/)
      .map(sanitize)
      .some((word) => profileSkills.includes(word)),
  )

  const skillGaps = job.requirements
    .map((req) => {
      const keywords = req
        .split(/[^a-zA-Z0-9]+/)
        .map(sanitize)
        .filter(Boolean)
      const hasMatch = keywords.some((word) => profileSkills.includes(word))
      return { req, hasMatch }
    })
    .filter((item) => !item.hasMatch)
    .slice(0, 4)
    .map((item) => {
      const keyword = item.req.split(/[^a-zA-Z0-9]+/).find((word) => word.length > 4) || item.req
      const sector = setaAlignments[job.sector]?.name || 'SETA'
      const setaLink = setaAlignments[job.sector]?.link || 'https://www.saqa.org.za'
      return {
        skill: item.req,
        setaAlignment: sector,
        setaLink,
        suggestedCourses: [
          `Short course in ${keyword}`,
          `SETA-accredited programme for ${job.sector}`,
          `Learnership aligned to ${sector} training outcomes`,
        ],
      }
    })

  const score = scoreMatch(profile, job)
  const alignment = setaAlignments[job.sector]

  return {
    overallMatchScore: score,
    strongMatches,
    skillGaps,
    fundingOptions: quickFunding,
    priorityPlan: [
      'Build a targeted skills map for the role using current job requirements.',
      'Take one SETA-aligned short course or learnership in your sector.',
      'Submit your WSP/ATR and funding application early.',
    ],
    summary: `Your profile currently matches ${score}% of the role requirements. Focus on the highlighted skill gaps and follow ${alignment?.name ?? 'SETA'} guidance to strengthen your application.`,
  }
}

export function parseCvNameToProfile(fileName: string): Partial<Profile> {
  const guessName = fileName.replace(/[-_\.]/g, ' ').replace(/\bcv\b|resume|profile/gi, '').trim()
  return {
    fullName: guessName || 'Mzansi Candidate',
    headline: 'Career-focused professional with a passion for South African skills development',
    phone: '',
    email: '',
    provincePreference: '' as const,
    skills: ['Communication', 'Teamwork', 'Microsoft Office'],
    experienceYears: '2',
    summary:
      'A motivated candidate ready to grow through SETA-aligned learnerships, practical work experience and targeted skills development.',
    workExperience: [
      {
        title: 'Administrative Assistant',
        company: 'Local Business',
        location: 'South Africa',
        startDate: 'Jan 2022',
        endDate: 'Present',
        description: 'Supported day-to-day operations, customer service and reporting.',
      },
    ],
    education: ['National Senior Certificate'],
    certifications: ['Computer literacy certificate'],
    languages: ['English'],
  }
}

export function assistantResponse(message: string, profile: Profile) {
  const normalized = message.trim().toLowerCase()

  if (normalized.includes('recommend') || normalized.includes('job')) {
    return `Based on your profile and preferred province, I recommend checking roles in ${profile.provincePreference || 'Gauteng or Western Cape'} that focus on ${profile.skills.slice(0, 3).join(', ') || 'transferable workplace skills'}. Keep your CV strong, highlight learning achievements, and use the cover letter template for each application.`
  }

  if (normalized.includes('upskill') || normalized.includes('learnership') || normalized.includes('seta')) {
    return `For a stronger profile, pursue a SETA-aligned short course or learnership in ${profile.headline || 'your target sector'}. Use the official SETA links in Resources and build evidence of practical experience through volunteer or contract work.`
  }

  if (normalized.includes('interview')) {
    return 'Prepare for interviews by sharing clear examples of how you solved a problem, worked with a team, or improved a process. Practice a strong opening and ask the employer about their culture and development support.'
  }

  return 'I can help you find matching jobs, generate a tailored cover letter, and recommend learnerships. Ask me for job recommendations, skills advice, or application tips.'
}
