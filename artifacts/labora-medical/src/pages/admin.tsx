import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { BarChart3, CalendarCheck, FlaskConical, Image as ImageIcon, Briefcase, LogOut, Shield, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminFetch, clearAdminSession, getAdminToken, setAdminSession } from "@/lib/admin-api"
import { Overview } from "@/components/admin/overview"
import { Bookings } from "@/components/admin/bookings"
import { Applications } from "@/components/admin/applications"
import { Slides } from "@/components/admin/slides"

type Tab = "overview" | "bookings" | "applications" | "slides"

const TABS: Array<{ id: Tab | "results"; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "bookings", label: "الحجوزات", icon: CalendarCheck },
  { id: "applications", label: "طلبات التوظيف", icon: Briefcase },
  { id: "slides", label: "سلايدر العروض", icon: ImageIcon },
  { id: "results", label: "نتائج التحاليل", icon: FlaskConical },
]

function Login({ onDone }: { onDone: () => void }) {
  const [adminId, setAdminId] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
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
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm border-primary/10 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <CardTitle>لوحة تحكم مختبر خلود</CardTitle>
          <CardDescription>سجّل الدخول للمتابعة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="معرّف المسؤول" autoComplete="username" required />
            <Input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="رمز الدخول" autoComplete="current-password" required />
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "دخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Admin() {
  const [, navigate] = useLocation()
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()))
  const [tab, setTab] = useState<Tab>("overview")

  useEffect(() => {
    document.title = "لوحة التحكم | مختبر خلود"
    const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"))
    robots.setAttribute("name", "robots")
    robots.setAttribute("content", "noindex, nofollow")
    const onLogout = () => setAuthed(false)
    window.addEventListener("kholoud-admin-logout", onLogout)
    return () => {
      window.removeEventListener("kholoud-admin-logout", onLogout)
      document.title = "مختبر خلود للتحاليل الطبية | فحوصات وحجز موعد"
      robots.setAttribute("content", "index, follow")
    }
  }, [])

  const goTo = (id: string) => {
    if (id === "results") navigate("/staff/results")
    else setTab(id as Tab)
  }

  const logout = () => {
    clearAdminSession()
    setAuthed(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 font-sans" dir="rtl">
      <header className="relative z-10 flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <h1 className="text-lg font-bold sm:text-xl">لوحة تحكم مختبر خلود</h1>
        </div>
        {authed && (
          <Button variant="secondary" size="sm" onClick={logout} className="gap-2 rounded-xl font-bold">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </Button>
        )}
      </header>

      {!authed ? (
        <Login onDone={() => setAuthed(true)} />
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
          <nav aria-label="أقسام اللوحة" className="flex gap-2 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  tab === id ? "bg-primary text-primary-foreground shadow" : "bg-card text-foreground hover:bg-primary/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
          <main className="min-w-0 flex-1">
            {tab === "overview" && <Overview onNavigate={goTo} />}
            {tab === "bookings" && <Bookings />}
            {tab === "applications" && <Applications />}
            {tab === "slides" && <Slides />}
          </main>
        </div>
      )}
    </div>
  )
}
