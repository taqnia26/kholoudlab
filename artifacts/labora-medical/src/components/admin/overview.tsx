import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight, CheckCheck, Inbox, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, whatsappLink } from "@/lib/admin-api"
import { EmptyState, Loading, Panel, StatusPill, timeAgo } from "./ui"
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

function Metric({ label, value, note, tone }: { label: string; value: number; note?: React.ReactNode; tone?: "alert" }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tone === "alert" && value > 0 ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="mt-1 min-h-4 text-xs text-muted-foreground">{note}</div>
    </div>
  )
}

export function Overview({ onNavigate }: { onNavigate: (tab: string) => void }) {
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
  const topMax = Math.max(1, ...data.topTests.map((x) => x.count))
  const statusCount = (status: string) => data.bookingStatus.find((row) => row.status === status)?.count ?? 0
  const resultCount = (status: string) => data.resultStatus.find((row) => row.status === status)?.count ?? 0

  return (
    <div className="adm-rise space-y-5">
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-4">
        <Metric label="حجوزات تنتظر الرد" value={t.bookings_new} tone="alert" note={t.bookings_new > 0 ? "اتصل بهم اليوم" : "لا يوجد انتظار"} />
        <Metric label="حجوزات اليوم" value={t.bookings_today} note={`الإجمالي ${t.bookings_total}`} />
        <Metric
          label="آخر 7 أيام"
          value={t.bookings_7d}
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
        <Metric label="طلبات توظيف جديدة" value={t.applications_new} tone="alert" note={`الإجمالي ${t.applications_total}`} />
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe4ee] text-sm font-bold text-[#8f1a50]" aria-hidden="true">
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
            <div dir="ltr" className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.bookingsPerDay} margin={{ left: -20, right: 4, top: 4 }}>
                  <defs>
                    <linearGradient id="admFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(330 67% 38%)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="hsl(330 67% 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(270 18% 89%)" />
                  <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval={6} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(v) => `التاريخ: ${v}`} formatter={(v) => [v, "حجوزات"]} />
                  <Area type="monotone" dataKey="count" stroke="hsl(330 67% 38%)" strokeWidth={2} fill="url(#admFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="أكثر الفحوصات طلباً">
            {data.topTests.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">تظهر هنا بعد وصول أول حجز.</p>
            ) : (
              <ul className="space-y-3">
                {data.topTests.slice(0, 5).map((row) => (
                  <li key={row.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate font-semibold">{row.name}</span>
                      <span className="font-bold">{row.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(row.count / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="توزيع حالات الحجوزات">
          {bookingTotal === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
          ) : (
            <>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
                {(["new", "contacted", "booked", "cancelled"] as const).map((status) => (
                  <div
                    key={status}
                    title={BOOKING_STATUS_LABELS[status]}
                    style={{ width: `${(statusCount(status) / bookingTotal) * 100}%` }}
                    className={{ new: "bg-primary", contacted: "bg-[#e0a526]", booked: "bg-[color:var(--adm-ok)]", cancelled: "bg-[#c9c2d1]" }[status]}
                  />
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {(["new", "contacted", "booked", "cancelled"] as const).map((status) => (
                  <li key={status} className="flex items-center justify-between">
                    <StatusPill status={status} label={BOOKING_STATUS_LABELS[status]} />
                    <b>{statusCount(status)}</b>
                  </li>
                ))}
              </ul>
            </>
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
