import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'
import {
  Home,
  Briefcase,
  Sparkles,
  ClipboardList,
  Bookmark,
  GraduationCap,
  Building2,
  Settings,
  LogOut,
  PanelLeft,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
  badge?: string
}

const MAIN_NAV_ITEMS: NavItemDef[] = [
  { href: '/', icon: <Home className="h-4 w-4" />, label: 'Home' },
  { href: '/jobs', icon: <Search className="h-4 w-4" />, label: 'Find Jobs' },
  { href: '/ai-hub', icon: <Sparkles className="h-4 w-4" />, label: 'AI Career Hub', badge: 'New' },
]

const USER_NAV_ITEMS: NavItemDef[] = [
  { href: '/applications', icon: <ClipboardList className="h-4 w-4" />, label: 'My Applications' },
  { href: '/saved', icon: <Bookmark className="h-4 w-4" />, label: 'Saved Jobs' },
]

const RESOURCE_NAV_ITEMS: NavItemDef[] = [
  { href: '/upskilling', icon: <GraduationCap className="h-4 w-4" />, label: 'Upskilling Hub' },
  { href: '/companies', icon: <Building2 className="h-4 w-4" />, label: 'Companies' },
]

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  const link = (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md text-sm transition-colors group',
          collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
          isActive ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )
      }
    >
      <span className={cn('shrink-0 transition-transform group-hover:scale-110', 'text-current')}>
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {item.badge && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-accent text-[10px] font-bold text-accent-foreground leading-none animate-pulse">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {item.label}
        {item.badge && <span className="px-1 py-0.5 rounded bg-accent text-[9px] font-bold">{item.badge}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

export function AppSidebarShell() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-background border-r border-border overflow-hidden',
          'transition-[width] duration-300 ease-in-out shrink-0 relative group/sidebar',
          collapsed ? 'w-[4rem]' : 'w-[16rem]'
        )}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-2 shrink-0 border-b border-border h-[64px] px-4',
            collapsed && 'justify-center px-2'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight text-primary">Upskill-Mzansi</span>
                <span className="text-[10px] font-medium text-muted-foreground">Career Platform</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
               <Briefcase className="h-5 w-5" />
            </div>
          )}
          {!collapsed && (
             <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity"
                onClick={toggle}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
          )}
        </div>

        {/* ── Nav (only this section scrolls) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-2">Discovery</p>}
            {MAIN_NAV_ITEMS.map(item => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-2">My Career</p>}
            {USER_NAV_ITEMS.map(item => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-2">Resources</p>}
            {RESOURCE_NAV_ITEMS.map(item => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className={cn('shrink-0 border-t border-border p-3 space-y-2', collapsed && 'items-center')}>
          <NavItem item={{ href: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' }} collapsed={collapsed} />
          
          <div className={cn('pt-2 flex items-center gap-3', collapsed ? 'flex-col' : 'px-3 py-2 rounded-xl bg-muted/30')}>
            <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold font-heading">TZ</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Thabiso Zondo</p>
                <p className="text-[10px] text-muted-foreground truncate">Free Plan</p>
              </div>
            )}
            {!collapsed && (
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut className="h-4 w-4" />
               </Button>
            )}
          </div>
        </div>
        
        {collapsed && (
           <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-20 -right-3 h-6 w-6 rounded-full p-0 shadow-md border border-border"
            onClick={toggle}
          >
            <PanelLeft className="h-3 w-3 rotate-180" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}
