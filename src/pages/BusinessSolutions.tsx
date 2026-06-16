import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calculator, GraduationCap, ArrowRight,
  CheckCircle2, Building2, Sparkles, PhoneCall,
  TrendingUp, ShieldCheck, ChevronRight, Loader2,
} from 'lucide-react'
import { Button, Card, CardContent, Input, Badge } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { SouthAfricanRegExp } from '@/lib/validations'

// ── Design tokens ─────────────────────────────────────────────────────────────
// Navy + Gold palette kept as constants so they're easy to update in one place.
const NAVY  = '#0A2540'
const GOLD  = '#C9A84C'
const GOLD2 = '#E8C96A'  // lighter gold for gradients

// ── Static data ───────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Smart Hiring',
    body: 'Match with pre-vetted candidates. 70% faster time-to-hire through AI-powered screening aligned to your sector.',
    stat: '70% faster',
    statLabel: 'time-to-hire',
  },
  {
    icon: Calculator,
    title: 'Tax Incentives',
    body: 'Calculate your ETI and Section 12H savings instantly. Maximise every rand of your SARS allowance.',
    stat: 'R80k+',
    statLabel: 'per learner saved',
  },
  {
    icon: GraduationCap,
    title: 'Skills Development',
    body: 'Upskill your workforce to boost your B-BBEE scorecard. SETA-aligned programmes, fully funded.',
    stat: '5 pts',
    statLabel: 'B-BBEE uplift avg.',
  },
]

const TRUST_LOGOS = ['Standard Bank', 'Shoprite', 'Anglo American', 'Discovery', 'Telkom']

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'] as const
const INDUSTRIES    = [
  'IT & Tech', 'Finance & Banking', 'Mining & Resources',
  'Manufacturing', 'Healthcare', 'Retail & FMCG',
  'Construction & Engineering', 'Government & Public Sector',
  'Education', 'Agriculture',
] as const

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <span
      className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
      style={{ background: `${GOLD}22`, color: GOLD }}
    >
      {children}
    </span>
  )
}

// ── ROI Calculator ────────────────────────────────────────────────────────────

function RoiCalculator() {
  const [learners, setLearners]         = useState(5)
  const [withDisability, setWithDisability] = useState(false)

  const allowance      = withDisability ? 120_000 : 80_000
  const taxSaving      = learners * allowance
  const sdlRebate      = learners * 4_500
  const totalBenefit   = taxSaving + sdlRebate

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden shadow-2xl border"
      style={{ borderColor: `${GOLD}33` }}
    >
      {/* Header */}
      <div className="px-8 py-6" style={{ background: NAVY }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}22` }}>
            <Calculator className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Section 12H</p>
            <h3 className="text-lg font-bold text-white">ROI Calculator</h3>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6 bg-white space-y-6">
        {/* Slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-slate-700">
              Number of Learners to Hire
            </label>
            <span
              className="text-2xl font-extrabold tabular-nums"
              style={{ color: NAVY }}
            >
              {learners}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={learners}
            onChange={e => setLearners(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: GOLD }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1</span><span>50</span><span>100</span>
          </div>
        </div>

        {/* Disability toggle */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={withDisability}
              onChange={e => setWithDisability(e.target.checked)}
            />
            <div className={cn(
              'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
              withDisability ? 'border-transparent' : 'border-slate-300 bg-white'
            )} style={withDisability ? { background: GOLD, borderColor: GOLD } : {}}>
              {withDisability && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Include learners with disabilities</p>
            <p className="text-xs text-slate-400 mt-0.5">+R40,000 SARS allowance per learner</p>
          </div>
        </label>

        {/* Output card */}
        <motion.div
          key={`${learners}-${withDisability}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: NAVY }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
              Estimated Tax Savings
            </p>
            <p className="text-4xl font-extrabold text-white tabular-nums">
              R {taxSaving.toLocaleString('en-ZA')}
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-0.5">SDL Rebate</p>
              <p className="text-lg font-bold text-white tabular-nums">
                R {sdlRebate.toLocaleString('en-ZA')}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-0.5">Total Benefit</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: GOLD2 }}>
                R {totalBenefit.toLocaleString('en-ZA')}
              </p>
            </div>
          </div>

          <p className="text-xs text-white/30 pt-1">
            Indicative only. Based on Section 12H of the Income Tax Act. Confirm with your tax advisor.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Demo Request Form ─────────────────────────────────────────────────────────

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface DemoFormData {
  company_name: string
  contact_name: string
  email: string
  phone: string
  industry: string
  size: string
  message: string
}

const EMPTY_FORM: DemoFormData = {
  company_name: '', contact_name: '', email: '',
  phone: '', industry: '', size: '', message: '',
}

function DemoForm() {
  const [form, setForm]       = useState<DemoFormData>(EMPTY_FORM)
  const [status, setStatus]   = useState<FormState>('idle')
  const [fieldErrors, setFieldErrors] = useState<Partial<DemoFormData>>({})

  function set(field: keyof DemoFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const errs: Partial<DemoFormData> = {}
    if (!form.company_name.trim()) errs.company_name = 'Required'
    if (!form.contact_name.trim()) errs.contact_name = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required'
    if (form.phone && !SouthAfricanRegExp.saPhone.test(form.phone))
      errs.phone = 'Enter a valid SA number e.g. 0821234567'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('submitting')

    const { error } = await supabase.from('demo_requests').insert({
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim(),
      email:        form.email.trim().toLowerCase(),
      phone:        form.phone.trim() || null,
      industry:     form.industry     || null,
      size:         form.size         || null,
      message:      form.message.trim() || null,
    })

    if (error) {
      console.error('Demo request error:', error.message)
      setStatus('error')
      return
    }

    setStatus('success')
    setForm(EMPTY_FORM)
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-16 px-8 gap-4"
      >
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-2" style={{ background: `${GOLD}22` }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: GOLD }} />
        </div>
        <h3 className="text-xl font-bold" style={{ color: NAVY }}>Request Received!</h3>
        <p className="text-slate-500 max-w-xs text-sm leading-relaxed">
          Our team will reach out within one business day to schedule your personalised demo.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setStatus('idle')}
        >
          Submit another request
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company Name *" error={fieldErrors.company_name}>
          <Input
            placeholder="Acme (Pty) Ltd"
            value={form.company_name}
            onChange={e => set('company_name', e.target.value)}
          />
        </Field>
        <Field label="Your Name *" error={fieldErrors.contact_name}>
          <Input
            placeholder="Thabo Dlamini"
            value={form.contact_name}
            onChange={e => set('contact_name', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Work Email *" error={fieldErrors.email}>
          <Input
            type="email"
            placeholder="thabo@acme.co.za"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </Field>
        <Field label="Phone (optional)" error={fieldErrors.phone}>
          <Input
            type="tel"
            placeholder="0821234567"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Industry">
          <select
            value={form.industry}
            onChange={e => set('industry', e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field label="Company Size">
          <select
            value={form.size}
            onChange={e => set('size', e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select size…</option>
            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </Field>
      </div>

      <Field label="Message (optional)">
        <textarea
          rows={3}
          placeholder="Tell us about your hiring or compliance challenge…"
          value={form.message}
          onChange={e => set('message', e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      {status === 'error' && (
        <p className="text-sm text-destructive">
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full h-12 font-bold text-base rounded-xl gap-2"
        style={{ background: NAVY }}
      >
        {status === 'submitting' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><PhoneCall className="h-4 w-4" /> Request a Demo</>
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        No spam. Your data is protected under POPIA.
      </p>
    </form>
  )
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessSolutions() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-20 pb-28 px-4"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #0d3060 60%, #0f3d7a 100%)`,
        }}
      >
        {/* Gold orb accents */}
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: GOLD }}
        />
        <div
          className="absolute bottom-0 -left-16 h-64 w-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: GOLD2 }}
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge
              className="mb-6 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border-none"
              style={{ background: `${GOLD}25`, color: GOLD2 }}
            >
              Upskill Mzansi for Business 🇿🇦
            </Badge>

            <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white leading-tight mb-6">
              Grow Your Business with{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD2})` }}
              >
                AI-Powered Talent
              </span>{' '}
              &amp; Compliance
            </h1>

            <p className="text-lg text-white/70 mb-10 max-w-2xl leading-relaxed">
              Match with pre-vetted South African candidates, maximise your SARS tax incentives,
              and build a SETA-aligned workforce — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-14 px-8 rounded-xl font-bold text-base gap-2 shadow-xl"
                style={{ background: GOLD, color: NAVY }}
                onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Building2 className="h-5 w-5" /> Start Hiring
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-xl font-bold text-base gap-2 border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-5 w-5" /> Get Business Coaching
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Trusted by
            </span>
            {TRUST_LOGOS.map(name => (
              <span key={name} className="text-sm font-bold text-white/30">
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Value Proposition Grid ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Why Upskill Mzansi B2B</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-heading font-extrabold mb-4"
              style={{ color: NAVY }}
            >
              Everything Your Business Needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              One platform to hire smarter, claim tax incentives, and develop your workforce
              in line with South Africa's skills agenda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <Card className="h-full border-0 shadow-lg shadow-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardContent className="p-8 flex flex-col h-full">
                    {/* Icon */}
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: `${GOLD}18` }}
                    >
                      <vp.icon className="h-7 w-7" style={{ color: GOLD }} />
                    </div>

                    <h3
                      className="text-xl font-heading font-bold mb-3"
                      style={{ color: NAVY }}
                    >
                      {vp.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1">{vp.body}</p>

                    {/* Stat pill */}
                    <div
                      className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full self-start"
                      style={{ background: NAVY }}
                    >
                      <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD }} />
                      <span className="text-sm font-bold text-white">{vp.stat}</span>
                      <span className="text-xs text-white/50">{vp.statLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Calculator + Demo Form ────────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-50" id="demo-form">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Tools &amp; Lead Gen</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-heading font-extrabold mb-4"
              style={{ color: NAVY }}
            >
              Calculate Your Savings, Then Let's Talk
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              Use the calculator to estimate your Section 12H benefit, then request a personalised
              demo from our B2B team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <RoiCalculator />

            {/* Demo form card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-3xl bg-white shadow-xl shadow-slate-100 border overflow-hidden"
              style={{ borderColor: `${GOLD}33` }}
            >
              <div className="px-8 py-6" style={{ background: NAVY }}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${GOLD}22` }}
                  >
                    <PhoneCall className="h-5 w-5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                      Book a Session
                    </p>
                    <h3 className="text-lg font-bold text-white">Request a Demo</h3>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6">
                <DemoForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Compliance strip ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: ShieldCheck, label: 'POPIA Compliant', sub: 'Your data is protected under SA law' },
              { icon: CheckCircle2, label: 'SETA Accredited',  sub: 'All programmes are SETA-registered' },
              { icon: ArrowRight,   label: 'CIPC Verified',    sub: 'Business profiles CIPC-validated' },
            ].map(({ icon: Icon, label, sub }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${GOLD}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: GOLD }} />
                </div>
                <p className="font-bold text-white">{label}</p>
                <p className="text-xs text-white/40">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionLabel>Ready to start?</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-heading font-extrabold mb-6"
              style={{ color: NAVY }}
            >
              Join South Africa's Leading Talent Platform
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Over 450 companies already use Upskill Mzansi to hire faster, claim tax incentives,
              and develop compliant, future-ready workforces.
            </p>
            <Button
              size="lg"
              className="h-14 px-10 rounded-xl font-bold text-base gap-2 shadow-xl"
              style={{ background: NAVY, color: 'white' }}
              onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started Today <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
