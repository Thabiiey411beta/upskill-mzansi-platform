import { motion } from 'framer-motion'
import { Search, Briefcase, Sparkles, GraduationCap, ArrowRight, TrendingUp, Users, Award } from 'lucide-react'
import { Button, Card, CardContent, Input, Badge } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Active Jobs', value: '12,450+', icon: Briefcase, color: 'text-blue-500' },
  { label: 'Registered Users', value: '45,000+', icon: Users, color: 'text-green-500' },
  { label: 'AI Parsed CVs', value: '28,000+', icon: Sparkles, color: 'text-orange-500' },
  { label: 'SETA Partners', value: '15+', icon: Award, color: 'text-purple-500' },
]

const categories = [
  { name: 'IT & Tech', count: '1,200+', icon: '💻' },
  { name: 'Finance', count: '850+', icon: '💰' },
  { name: 'Healthcare', count: '640+', icon: '🏥' },
  { name: 'Mining', count: '420+', icon: '⛏️' },
  { name: 'Manufacturing', count: '510+', icon: '🏭' },
  { name: 'Education', count: '380+', icon: '🎓' },
]

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative pt-16 pb-24 overflow-hidden hero-mesh border-b border-border">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full">
              Made for South Africa 🇿🇦
            </Badge>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent leading-tight">
              Unlock Your Potential <br /> in the Mzansi Market
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Find more than just a job. Discover learnerships, upskill with SETA-aligned AI recommendations, and build a career that matters.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card p-2 md:p-3 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2 md:gap-4 max-w-4xl mx-auto"
          >
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Job title, skills, or keywords"
                className="pl-12 h-14 md:h-16 border-none bg-transparent text-lg focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="w-full md:w-1/3 relative group border-t md:border-t-0 md:border-l border-border/50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors rotate-90" />
              <Input
                placeholder="Location (e.g. Gauteng)"
                className="pl-12 h-14 md:h-16 border-none bg-transparent text-lg focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
            </div>
            <Button className="h-14 md:h-16 px-10 rounded-xl md:rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-2 shrink-0">
              Search Jobs
            </Button>
          </motion.div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
             <span className="text-sm font-medium text-muted-foreground">Popular:</span>
             {['Remote', 'Learnership', 'Admin', 'Internship', 'Retail'].map(tag => (
               <button key={tag} className="text-sm font-semibold hover:text-primary transition-colors">
                 {tag}
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────── */}
      <section className="py-12 border-b border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className={cn('h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-heading font-bold">{stat.value}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories Section ──────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-heading font-extrabold mb-2">Browse by Sector</h2>
              <p className="text-muted-foreground">Find opportunities in the industries driving South Africa's growth.</p>
            </div>
            <Button variant="outline" className="gap-2 font-bold group">
              View All Sectors <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 group overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                    <h3 className="font-bold text-sm mb-1">{cat.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{cat.count} Jobs</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Upskill Banner ───────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary skew-y-1 origin-right translate-y-10" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-primary-foreground text-center lg:text-left">
            <Badge className="bg-accent text-accent-foreground mb-6 font-bold px-4 py-1.5 rounded-full border-none">
              AI-Powered Growth
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-extrabold mb-6 leading-tight">
              Bridge Your Skills Gap <br /> with SETA Alignment
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
              Upload your CV and let our AI analyze your profile against current market demands. Receive a personalized upskilling plan including learnerships and funding guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-14 rounded-xl gap-2 shadow-xl shadow-black/20">
                <Sparkles className="h-5 w-5" /> Start AI Skills Audit
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-bold px-8 h-14 rounded-xl gap-2">
                <GraduationCap className="h-5 w-5" /> Explore Learnerships
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full translate-x-10 translate-y-10" />
            <motion.div
              initial={{ rotate: -2, scale: 0.9 }}
              whileInView={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative glass-card p-6 rounded-3xl border-primary-foreground/20 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-foreground/50 uppercase tracking-widest">Market Demand</p>
                  <p className="text-sm font-bold text-primary-foreground">+14% Tech Jobs in Cape Town</p>
                </div>
              </div>
              <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="h-12 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 animate-pulse" />
                 ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Jobs ──────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-extrabold mb-4">Latest Opportunities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Discover the latest jobs from top employers across South Africa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-none bg-card shadow-lg shadow-black/5 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🏦
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-bold px-3 py-1 rounded-lg">
                      Full-time
                    </Badge>
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">Senior Software Engineer</h3>
                  <p className="text-sm font-bold text-muted-foreground mb-6">Standard Bank · Johannesburg</p>
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-lg font-bold text-primary">R85,000</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">/ Month</span>
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold group">
                    View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="ghost" className="text-primary font-bold hover:bg-primary/5 px-10 h-14 rounded-xl gap-2">
              Browse All Jobs <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
