import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight, Briefcase, CalendarCheck, CalendarClock, CheckCheck, Inbox, MessageCircle, Phone, TrendingUp, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, whatsappLink } from "@/lib/admin-api"
import { CountUp, EmptyState, Loading, Panel, StatusPill, timeAgo } from "./ui"
import { BOOKING_STATUS_LABELS, APPLICATION_STATUS_LABELS } from "./labels"

type Booking = { id: number; name: string; phone: string; testType: string; status: string; createdAt: string }
type Stats = {
  totals: {
    bookings_total: number
    bookings_7d: number
    bookings_prev_7d: number
    bookings_today: number
    bookings_new: number
    applications_total: number
    applications_new: number
    slides_active: number
  }
  bookingsPerDay: Array<{ day: string; count: number }>
  topTests: Array<{ name: string; count: number }>
  bookingStatus: Array<{ status: string; count: number }>
  resultStatus: Array<{ status: string; count: number }>
  recentBookings: Booking[]
  recentApplications: Array<{ id: number; name: string; position: string; status: string; createdAt: string }>
}
type Audit = { id: number; adminId: string; summary: string; createdAt: string }

const STATUS_COLORS: Record<string, string> = {
  new: "#a31f5f",
  contacted: "#e0a526",
  booked: "#0b7a63",
  cancelled: "#c9c2d1",
}

function Metric({
  label, value, note, icon: Icon, tone, spark,
}: {
  label: string
  value: number
  note?: React.ReactNode
  icon: LucideIcon
  tone: "magenta" | "teal" | "amber" | "violet"
  spark?: number[]
}) {
  const tones = {
    magenta: "from-[#a31f5f] to-[#d6427f]",
    teal: "from-[#0b7a63] to-[#25b394]",
    amber: "from-[#d98a0b] to-[#f2b84a]",
    violet: "from-[#4b3b92] to-[#7a63d6]",
  }
  const points = (spark ?? []).map((v, i) => ({ i, v }))
  return (
    <div className="adm-lift relative overflow-hidden rounded-xl border border-border bg-card p-5 pb-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-4xl font-extrabold leading-none text-foreground">
            <CountUp value={value} />
          </div>
          <div className="mt-2 min-h-4 text-xs text-muted-foreground">{note}</div>
        </div>
        <div className={`adm-sheen flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {points.length > 1 && (
        <div dir="ltr" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={{ magenta: "#a31f5f", teal: "#0b7a63", amber: "#d98a0b", violet: "#4b3b92" }[tone]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={{ magenta: "#a31f5f", teal: "#0b7a63", amber: "#d98a0b", violet: "#4b3b92" }[tone]} strokeWidth={1.5} fill={`url(#spark-${tone})`} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }).format(new Date()))
  return hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور"
}

export function Overview({ onNavigate, adminName }: { onNavigate: (tab: string) => void; adminName: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch<Stats>("/admin/stats"),
    refetchInterval: 45_000,
  })
  const { data: audit } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => adminFetch<Audit[]>("/admin/audit"),
  })

  const markContacted = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: "contacted" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
    onError: (err: Error) => toast({ title: "تعذر التحديث", description: err.message, variant: "destructive" }),
  })

  if (isLoading) return <Loading rows={6} />
  if (error || !data) return <div className="py-16 text-center text-destructive">تعذر تحميل الإحصائيات. تأكد من تشغيل الخادم ثم أعد المحاولة.</div>

  const t = data.totals
  const waiting = data.recentBookings.filter((b) => b.status === "new").slice(0, 8)
  const delta = t.bookings_7d - t.bookings_prev_7d
  const bookingTotal = data.bookingStatus.reduce((sum, row) => sum + row.count, 0)
  const sparkData = data.bookingsPerDay.slice(-14).map((d) => d.count)
  const statusCount = (status: string) => data.bookingStatus.find((row) => row.status === status)?.count ?? 0
  const donut = (['new', 'contacted', 'booked', 'cancelled'] as const).map((status) => ({ status, name: BOOKING_STATUS_LABELS[status], value: statusCount(status) })).filter((d) => d.value > 0)
  const resultCount = (status: string) => data.resultStatus.find((row) => row.status === status)?.count ?? 0

  return (
    <div className="adm-rise space-y-5">
      <div className="adm-mesh relative overflow-hidden rounded-2xl p-6 text-white lg:p-8">
        <span className="adm-blob -right-10 -top-16 h-56 w-56 bg-[#d6427f]" aria-hidden="true" />
        <span className="adm-blob -bottom-24 left-10 h-64 w-64 bg-[#6d2bb5]" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">{greeting()}</p>
            <h2 className="mt-1 text-3xl font-extrabold lg:text-4xl">{adminName}</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {t.bookings_new > 0
                ? `عندك ${t.bookings_new} حجز ينتظر الرد${t.applications_new > 0 ? ` و${t.applications_new} طلب توظيف جديد` : ""}.`
                : "كل الحجوزات تم الرد عليها. الموقع يشتغل بدون أي طلبات معلّقة."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="bg-white/15 text-white backdrop-blur hover:bg-white/25" onClick={() => onNavigate("bookings")}>
              فتح الحجوزات
            </Button>
            <Button variant="secondary" className="bg-white text-[#5a1649] hover:bg-white/90" onClick={() => onNavigate("home")}>
              تعديل الموقع
            </Button>
          </div>
        </div>
      </div>

      <div className="adm-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="حجوزات تنتظر الرد" value={t.bookings_new} icon={CalendarClock} tone="magenta" note={t.bookings_new > 0 ? "اتصل بهم اليوم" : "لا يوجد انتظار"} spark={sparkData} />
        <Metric label="حجوزات اليوم" value={t.bookings_today} icon={CalendarCheck} tone="teal" note={`الإجمالي ${t.bookings_total}`} spark={sparkData} />
        <Metric
          label="آخر 7 أيام"
          value={t.bookings_7d}
          icon={TrendingUp}
          tone="amber"
          spark={sparkData}
          note={
            delta === 0 ? (
              "مثل الأسبوع السابق"
            ) : (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${delta > 0 ? "text-[color:var(--adm-ok)]" : "text-primary"}`}>
                {delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(delta)} عن الأسبوع السابق
              </span>
            )
          }
        />
        <Metric label="طلبات توظيف جديدة" value={t.applications_new} icon={Briefcase} tone="violet" note={`الإجمالي ${t.applications_total}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="قائمة اليوم"
          description="حجوزات جديدة لم يتم التواصل معها بعد"
          flush
          actions={
            <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>
              كل الحجوزات
            </Button>
          }
        >
          {waiting.length === 0 ? (
            <EmptyState icon={CheckCheck} title="كل الحجوزات تم الرد عليها" text="الحجوزات الجديدة من الموقع تظهر هنا فور وصولها." />
          ) : (
            <ul className="divide-y divide-border">
              {waiting.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="adm-dot-ping flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe4ee] text-sm font-bold text-[#8f1a50]" aria-hidden="true">
                    {b.name.trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-foreground">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {b.testType} · {timeAgo(b.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <a
                      href={`tel:${b.phone}`}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
                      aria-label={`اتصال بـ ${b.name}`}
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      {b.phone}
                    </a>
                    <a
                      href={whatsappLink(b.phone, `مرحباً ${b.name}، معك مختبر خلود بخصوص طلب حجز ${b.testType}.`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`واتساب ${b.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366] text-white hover:opacity-90"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                  <Button size="sm" variant="outline" disabled={markContacted.isPending} onClick={() => markContacted.mutate(b.id)} className="gap-1.5">
                    <CheckCheck className="h-4 w-4" />
                    تم التواصل
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="الحجوزات خلال 30 يوماً">
            <div dir="ltr" className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.bookingsPerDay} margin={{ left: -20, right: 4, top: 4 }}>
                  <defs>
                    <linearGradient id="admFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(330 67% 38%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(330 67% 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(270 18% 89%)" />
                  <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval={6} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(v) => `التاريخ: ${v}`} formatter={(v) => [v, "حجوزات"]} />
                  <Area type="monotone" dataKey="count" stroke="hsl(330 67% 38%)" strokeWidth={2.5} fill="url(#admFill)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="أكثر الفحوصات طلباً">
            {data.topTests.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">تظهر هنا بعد وصول أول حجز.</p>
            ) : (
              <div dir="ltr" style={{ height: Math.max(150, Math.min(5, data.topTests.length) * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topTests.slice(0, 5)} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "hsl(270 22% 94%)" }} formatter={(v) => [v, "حجوزات"]} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16} animationDuration={1000} label={{ position: "right", fontSize: 12, fontWeight: 700 }}>
                      {data.topTests.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={["#a31f5f", "#c13a78", "#d6427f", "#df6d9d", "#e898b9"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="توزيع حالات الحجوزات">
          {bookingTotal === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div dir="ltr" className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={3} cornerRadius={5} stroke="none" animationDuration={1100}>
                      {donut.map((d) => (
                        <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold"><CountUp value={bookingTotal} /></span>
                  <span className="text-[11px] text-muted-foreground">حجز</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {(["new", "contacted", "booked", "cancelled"] as const).map((status) => (
                  <li key={status} className="flex items-center justify-between gap-2">
                    <StatusPill status={status} label={BOOKING_STATUS_LABELS[status]} />
                    <b>{statusCount(status)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel
          title="طلبات التوظيف الأخيرة"
          flush
          actions={
            <Button variant="ghost" size="sm" onClick={() => onNavigate("applications")}>
              عرض الكل
            </Button>
          }
        >
          {data.recentApplications.length === 0 ? (
            <EmptyState icon={Inbox} title="لا توجد طلبات توظيف" text="الطلبات المرسلة من صفحة الوظائف تُحفظ هنا مع السيرة الذاتية." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentApplications.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{a.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.position || "طلب توظيف عام"} · {timeAgo(a.createdAt)}</div>
                  </div>
                  <StatusPill status={a.status} label={APPLICATION_STATUS_LABELS[a.status] ?? a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="آخر النشاطات"
          flush
          actions={
            <Button variant="ghost" size="sm" onClick={() => onNavigate("activity")}>
              السجل
            </Button>
          }
        >
          {!audit || audit.length === 0 ? (
            <EmptyState icon={Inbox} title="لا يوجد نشاط بعد" text="كل تعديل تجريه من اللوحة يُسجَّل هنا." />
          ) : (
            <ul className="divide-y divide-border">
              {audit.slice(0, 6).map((entry) => (
                <li key={entry.id} className="px-5 py-3 text-sm">
                  <div className="font-semibold">{entry.summary}</div>
                  <div className="text-xs text-muted-foreground">{entry.adminId} · {timeAgo(entry.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-xs text-muted-foreground">
        نتائج التحاليل: {resultCount("pending")} قيد التحليل · {resultCount("ready")} جاهزة · {resultCount("unavailable")} غير متاحة
      </p>
    </div>
  )
}
