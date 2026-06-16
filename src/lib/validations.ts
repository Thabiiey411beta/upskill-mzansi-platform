import { z } from 'zod';

export const SouthAfricanRegExp = {
  cipcReg: /^\d{4}\/\d{6}\/\d{2}$/,
  saPhone: /^\+?(27|0)[6-8][0-9]{8}$/,
};

const SA_PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Remote',
] as const;

export const ProfileSchema = z.object({
  fullName:    z.string().min(2, 'Full name must be at least 2 characters'),
  role:        z.enum(['job_seeker', 'business_admin', 'platform_super_admin']),
  email:       z.string().email('Please supply a valid email address'),
  phoneNumber: z.string().regex(SouthAfricanRegExp.saPhone, 'Please supply a valid SA phone number').optional(),
});

export const JobPostSchema = z.object({
  title:         z.string().min(3, 'Job title is required'),
  company:       z.string().min(1, 'Company name is required'),
  location:      z.string().min(2, 'Location is required'),
  province:      z.enum(SA_PROVINCES),
  type:          z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Learnership']),
  salaryMin:     z.number().nonnegative('Minimum salary cannot be negative'),
  salaryMax:     z.number().nonnegative(),
  sector:        z.string().min(2, 'Sector is required'),
  setaAlignment: z.string().optional(),
  description:   z.string().min(20, 'Description must be at least 20 characters'),
  requirements:  z.array(z.string()).min(1, 'At least one requirement is required'),
}).refine(data => data.salaryMax >= data.salaryMin, {
  message: 'Maximum salary cannot be less than minimum salary',
  path: ['salaryMax'],
});

export const BusinessRegistrationSchema = z.object({
  companyName:        z.string().min(2, 'Company name is required'),
  registrationNumber: z.string().regex(SouthAfricanRegExp.cipcReg, 'Invalid CIPC format (YYYY/NNNNNN/NN)'),
  industry:           z.string().min(2, 'Industry is required'),
  companySize:        z.enum(['1-10', '11-50', '51-200', '201+']),
  beeLevel:           z.number().int().min(1).max(8),
});
