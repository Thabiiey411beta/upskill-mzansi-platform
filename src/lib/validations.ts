import { z } from 'zod';

export const SouthAfricanRegExp = {
  cipcReg: /^\d{4}\/\d{6}\/\d{2}$/,
  saPhone: /^\+?(27|0)[6-8][0-9]{8}$/,
};

export const JobPostSchema = z.object({
  title: z.string().min(3),
  company: z.string().min(1),
  location: z.string().min(2),
  province: z.string(),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Learnership']),
  salaryMin: z.number().nonnegative(),
  salaryMax: z.number().nonnegative(),
  sector: z.string(),
  description: z.string().min(20),
  requirements: z.array(z.string()).min(1),
});
