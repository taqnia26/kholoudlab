import { useEffect, useState, type FormEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "wouter"
import {
  BarChart3, Briefcase, CalendarCheck, ExternalLink, FlaskConical, History, Home, Image as ImageIcon,
  LayoutGrid, Loader2, UserCog, LogOut, Menu, Phone, Search as SearchIcon, ShieldCheck, Presentation, type LucideIcon,
} from "lucide-react"
import "@fontsource/cairo/arabic-400.css"
import "@fontsource/cairo/arabic-600.css"
import "@fontsource/cairo/arabic-700.css"
import "@fontsource/cairo/arabic-800.css"
import "@fontsource/cairo/latin-400.css"
import "@fontsource/cairo/latin-600.css"
import "@fontsource/cairo/latin-700.css"
import "@fontsource/cairo/latin-800.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { adminFetch, clearAdminSession, getAdminToken, setAdminSession } from "@/lib/admin-api"
import { cn } from "@/lib/utils"
import { Overview } from "@/components/admin/overview"
import { Bookings } from "@/components/admin/bookings"
import { Applications } from "@/components/admin/applications"
import { Slides } from "@/components/admin/slides"
import { Gallery } from "@/components/admin/gallery"
import { HomeEditor } from "@/components/admin/home-editor"
import { Settings } from "@/components/admin/settings"
import { Seo } from "@/components/admin/seo"
import { Activity } from "@/components/admin/activity"
import { Users } from "@/components/admin/users"

type TabId = "overview" | "bookings" | "applications" | "home" | "slides" | "gallery" | "settings" | "seo" | "activity" | "users"

type NavItem = { id: TabId | "results"; label: string; icon: LucideIcon; badge?: "bookings" | "applications" }
const NAV: Array<{ group: string; items: NavItem[] }> = [
  { group: "", items: [{ id: "overview", label: "نظرة عامة", icon: BarChart3 }] },
  {
    group: "الطلبات",
    items: [
      { id: "bookings", label: "الحجوزات", icon: CalendarCheck, badge: "bookings" },
      { id: "applications", label: "طلبات التوظيف", icon: Briefcase, badge: "applications" },
      { id: "results", label: "نتائج التحاليل", icon: FlaskConical },
    ],
  },
  {
    group: "محتوى الموقع",
    items: [
      { id: "home", label: "الصفحة الرئيسية", icon: Home },
      { id: "slides", label: "سلايدر العروض", icon: Presentation },
      { id: "gallery", label: "المعرض والباقات", icon: ImageIcon },
      { id: "settings", label: "التواصل والإعدادات", icon: Phone },
      { id: "seo", label: "محركات البحث", icon: SearchIcon },
    ],
  },
  { group: "النظام", items: [{ id: "users", label: "المسؤولون", icon: UserCog }, { id: "activity", label: "سجل النشاط", icon: History }] },
]
const TITLES: Record<TabId, string> = {
  overview: "نظرة عامة", bookings: "الحجوزات", applications: "طلبات التوظيف", home: "الصفحة الرئيسية", slides: "سلايدر العروض",
  gallery: "المعرض والباقات", settings: "التواصل والإعدادات", seo: "محركات البحث", activity: "سجل النشاط", users: "المسؤولون",
}

function readHash(): TabId {
  const value = window.location.hash.replace(/^#/, "") as TabId
  return value in TITLES ? value : "overview"
}

function Login({ onDone }: { onDone: () => void }) {
  const [adminId, setAdminId] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const session = await adminFetch<{ sessionToken: string; staffToken: string }>("/admin/session", {
        method: "POST",
        body: JSON.stringify({ adminId, accessCode }),
      })
      setAdminSession(session)
      onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="adm-mesh relative flex flex-col justify-between overflow-hidden p-8 text-white lg:p-12">
        <span className="adm-blob -right-16 top-10 h-64 w-64 bg-[#d6427f]" aria-hidden="true" />
        <span className="adm-blob bottom-0 left-0 h-72 w-72 bg-[#6d2bb5]" style={{ animationDelay: "-6s" }} aria-hidden="true" />
        <img src="/assets/kholoud-lab-logo.png" alt="مختبر خلود" className="relative h-14 w-auto self-start rounded-lg bg-white p-2" />
        <div className="relative my-10 max-w-md">
          <h1 className="relative text-3xl font-extrabold leading-snug lg:text-4xl">كل ما يخص الموقع في مكان واحد</h1>
          <p className="mt-4 leading-relaxed text-white/70">تابع الحجوزات وطلبات التوظيف، وعدّل العروض والنصوص وبيانات التواصل بدون الحاجة لمبرمج.</p>
        </div>
        <ul className="relative space-y-2 text-sm text-white/70">
          <li>الحجوزات الجديدة تظهر في قائمة اليوم فور وصولها</li>
          <li>كل تعديل يُسجَّل باسم من أجراه</li>
        </ul>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold">تسجيل الدخول</h2>
            <p className="mt-1 text-sm text-muted-foreground">للمسؤولين فقط</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-semibold">معرّف المسؤول</span>
            <Input value={adminId} onChange={(e) => setAdminId(e.target.value)} autoComplete="username" required className="h-11" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-semibold">رمز الدخول</span>
            <Input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} autoComplete="current-password" required className="h-11" />
          </label>
          {error && <p className="rounded-md bg-[#fbe4ee] px-3 py-2 text-sm font-semibold text-[#8f1a50]" role="alert">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  )
}

function Sidebar({ tab, onSelect, counts, adminId, onLogout }: {
  tab: TabId
  onSelect: (id: TabId | "results") => void
  counts: { bookings: number; applications: number }
  adminId: string
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-[color:var(--adm-ink)] text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><LayoutGrid className="h-5 w-5" /></div>
        <div className="leading-tight">
          <div className="font-bold">مختبر خلود</div>
          <div className="text-xs text-white/55">لوحة التحكم</div>
        </div>
      </div>
      <nav aria-label="أقسام اللوحة" className="adm-scroll flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => (
          <div key={section.group || "top"} className="mb-4">
            {section.group && <div className="mb-1.5 px-3 text-xs font-semibold text-white/45">{section.group}</div>}
            <ul className="space-y-0.5">
              {section.items.map(({ id, label, icon: Icon, badge }) => {
                const active = tab === id
                const count = badge ? counts[badge] : 0
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onSelect(id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors",
                        active ? "bg-[color:var(--adm-ink-3)] text-white" : "text-white/70 hover:bg-[color:var(--adm-ink-2)] hover:text-white",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 right-0 w-1 rounded-l bg-primary" aria-hidden="true" />}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 text-right">{label}</span>
                      {count > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold leading-5">{count}</span>}
                      {id === "results" && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-white/70 hover:bg-[color:var(--adm-ink-2)] hover:text-white">
          <ExternalLink className="h-[18px] w-[18px]" />
          عرض الموقع
        </a>
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold" aria-hidden="true">{adminId.charAt(0).toUpperCase()}</div>
            <div className="text-sm font-semibold">{adminId}</div>
          </div>
          <button type="button" onClick={onLogout} aria-label="تسجيل خروج" className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [, navigate] = useLocation()
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()))
  const [tab, setTab] = useState<TabId>(readHash)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = "لوحة التحكم | مختبر خلود"
    const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"))
    robots.setAttribute("name", "robots")
    robots.setAttribute("content", "noindex, nofollow")
    const onLogout = () => setAuthed(false)
    const onHash = () => setTab(readHash())
    window.addEventListener("kholoud-admin-logout", onLogout)
    window.addEventListener("hashchange", onHash)
    return () => {
      window.removeEventListener("kholoud-admin-logout", onLogout)
      window.removeEventListener("hashchange", onHash)
      document.title = "مختبر خلود للتحاليل الطبية | فحوصات وحجز موعد"
      robots.setAttribute("content", "index, follow")
    }
  }, [])

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch<{ totals: { bookings_new: number; applications_new: number } }>("/admin/stats"),
    enabled: authed,
    refetchInterval: 45_000,
  })

  const select = (id: TabId | "results") => {
    setMenuOpen(false)
    if (id === "results") {
      navigate("/staff/results")
      return
    }
    window.location.hash = id
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  const logout = () => {
    clearAdminSession()
    setAuthed(false)
  }

  const adminId = (() => {
    try {
      const token = getAdminToken()
      return token ? (JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))).staffId as string) : "admin"
    } catch {
      return "admin"
    }
  })()

  if (!authed) {
    return (
      <div className="adm min-h-screen" dir="rtl">
        <Login onDone={() => setAuthed(true)} />
      </div>
    )
  }

  const counts = { bookings: stats?.totals.bookings_new ?? 0, applications: stats?.totals.applications_new ?? 0 }

  return (
    <div className="adm flex min-h-screen bg-background text-foreground" dir="rtl">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <Sidebar tab={tab} onSelect={select} counts={counts} adminId={adminId} onLogout={logout} />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="adm w-72 border-0 p-0" dir="rtl">
          <SheetTitle className="sr-only">قائمة اللوحة</SheetTitle>
          <Sidebar tab={tab} onSelect={select} counts={counts} adminId={adminId} onLogout={logout} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[color:var(--adm-ok)]" />
            <span className="hidden sm:inline">لوحة التحكم</span>
            <span className="hidden sm:inline">/</span>
            <span className="font-bold text-foreground">{TITLES[tab]}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 lg:p-8">
          {tab === "overview" && <Overview adminName={adminId} onNavigate={(id) => select(id as TabId | "results")} />}
          {tab === "bookings" && <Bookings />}
          {tab === "applications" && <Applications />}
          {tab === "home" && <HomeEditor />}
          {tab === "slides" && <Slides />}
          {tab === "gallery" && <Gallery />}
          {tab === "settings" && <Settings />}
          {tab === "seo" && <Seo />}
          {tab === "activity" && <Activity />}
          {tab === "users" && <Users />}
        </main>
      </div>
    </div>
  )
}
