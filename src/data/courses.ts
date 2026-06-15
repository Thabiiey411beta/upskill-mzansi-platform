export interface Course {
  id: number;
  title: string;
  provider: string;
  sector: string;
  province: string;
  duration: string;
  level: string;
  funding: string;
  description: string;
  link: string;
  setas: string[];
}

export const courses: Course[] = [
  {
    id: 1,
    title: "Boilermaking Learnership",
    provider: "merSETA",
    sector: "Manufacturing",
    province: "Gauteng",
    duration: "12 months",
    level: "NQF Level 4",
    funding: "Discretionary Grant + Stipend",
    description: "Comprehensive learnership in boilermaking with practical training and SETA certification.",
    link: "https://www.merseta.org.za",
    setas: ["merSETA"]
  },
  // Add 8-10 more realistic SA courses across sectors and provinces
  {
    id: 2,
    title: "Digital Skills Programme",
    provider: "MICT SETA",
    sector: "IT & Tech",
    province: "Western Cape",
    duration: "6 months",
    level: "NQF Level 5",
    funding: "Mandatory Grant",
    description: "Coding, web development and data analytics for entry-level tech jobs.",
    link: "https://www.mict.org.za",
    setas: ["MICT SETA"]
  },
  // ... more entries for other provinces and sectors
];