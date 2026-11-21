import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CalendarCheck, CalendarDays, Image as ImageIcon, Users, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminFetch } from "@/lib/admin-api"
import { BOOKING_STATUS_LABELS, RESULT_STATUS_LABELS } from "./labels"

type Stats = {
  totals: {
    bookings_total: number
    bookings_7d: number
    bookings_today: number
    applications_total: number
    slides_active: number
  }
  bookingsPerDay: Array<{ day: string; count: number }>
  topTests: Array<{ name: string; count: number }>
  bookingStatus: Array<{ status: string; count: number }>
  applicationStatus: Array<{ status: string; count: number }>
  resultStatus: Array<{ status: string; count: number }>
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Overview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch<Stats>("/admin/stats"),
    refetchInterval: 60_000,
  })

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
  if (error || !data) return <div className="py-16 text-center text-destructive">تعذر تحميل الإحصائيات</div>

  const statusCount = (rows: Array<{ status: string; count: number }>, status: string) =>
    rows.find((row) => row.status === status)?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="حجوزات اليوم" value={data.totals.bookings_today} icon={CalendarCheck} />
        <StatCard label="حجوزات آخر 7 أيام" value={data.totals.bookings_7d} icon={CalendarDays} />
        <StatCard label="إجمالي الحجوزات" value={data.totals.bookings_total} icon={Users} />
        <StatCard label="طلبات التوظيف" value={data.totals.applications_total} icon={Briefcase} />
        <StatCard label="عروض السلايدر النشطة" value={data.totals.slides_active} icon={ImageIcon} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الحجوزات خلال آخر 30 يوم</CardTitle>
          </CardHeader>
          <CardContent dir="ltr" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.bookingsPerDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval={4} />
                <YAxis allowDecimals={false} fontSize={11} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="الحجوزات" stroke="hsl(330 67% 38%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أكثر الفحوصات والباقات طلباً</CardTitle>
          </CardHeader>
          <CardContent dir="ltr" className="h-64">
            {data.topTests.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">لا توجد حجوزات بعد</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topTests} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={110} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" name="العدد" fill="hsl(330 67% 38%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">حالات الحجوزات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <b>{statusCount(data.bookingStatus, key)}</b>
              </div>
            ))}
            <button onClick={() => onNavigate("bookings")} className="pt-2 text-primary hover:underline">
              عرض الحجوزات
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">نتائج التحاليل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(RESULT_STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <b>{statusCount(data.resultStatus, key)}</b>
              </div>
            ))}
            <button onClick={() => onNavigate("results")} className="pt-2 text-primary hover:underline">
              فتح إدارة النتائج
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">طلبات التوظيف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">جديدة</span>
              <b>{statusCount(data.applicationStatus, "new")}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">قيد المراجعة / مرشحة</span>
              <b>{statusCount(data.applicationStatus, "reviewed") + statusCount(data.applicationStatus, "shortlisted")}</b>
            </div>
            <button onClick={() => onNavigate("applications")} className="pt-2 text-primary hover:underline">
              عرض الطلبات
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
