import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck, ChevronLeft, ChevronRight, Download, MessageCircle, Phone, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, downloadCsv, formatDate, whatsappLink } from "@/lib/admin-api"
import { EmptyState, Loading, PageHeader, Panel, Segmented, StatusPill, timeAgo } from "./ui"
import { BOOKING_STATUS_LABELS } from "./labels"

type Booking = {
  id: number
  name: string
  phone: string
  testType: string
  status: string
  notes: string
  emailSent: number
  createdAt: string
}

const PAGE_SIZE = 20
type Range = "all" | "today" | "7d" | "30d"

function inRange(value: string, range: Range): boolean {
  if (range === "all") return true
  const created = new Date(value).getTime()
  if (range === "today") {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return created >= start.getTime()
  }
  return created >= Date.now() - (range === "7d" ? 7 : 30) * 86_400_000
}

export function Bookings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [range, setRange] = useState<Range>("all")
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => adminFetch<Booking[]>("/admin/bookings"),
    refetchInterval: 30_000,
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; notes?: string }) =>
      adminFetch<Booking>(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" }),
  })

  const ranged = useMemo(() => data.filter((b) => inRange(b.createdAt, range)), [data, range])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ranged.filter(
      (b) =>
        (status === "all" || b.status === status) &&
        (!q || b.name.toLowerCase().includes(q) || b.phone.includes(q) || b.testType.toLowerCase().includes(q)),
    )
  }, [ranged, search, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const open = data.find((b) => b.id === openId) ?? null
  const count = (s: string) => ranged.filter((b) => b.status === s).length

  const exportCsv = () =>
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["#", "التاريخ", "الاسم", "الجوال", "الفحص", "الحالة", "ملاحظات"],
      ...filtered.map((b) => [b.id, formatDate(b.createdAt), b.name, b.phone, b.testType, BOOKING_STATUS_LABELS[b.status] ?? b.status, b.notes]),
    ])

  return (
    <div className="adm-rise">
      <PageHeader
        title="الحجوزات"
        subtitle="كل طلبات الحجز القادمة من الموقع. غيّر الحالة من الجدول أو افتح الطلب لإضافة ملاحظة."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        }
      />

      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <Segmented
            label="تصفية بالحالة"
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
            options={[
              { value: "all", label: "الكل", count: ranged.length },
              ...Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label, count: count(value) })),
            ]}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Segmented
              label="الفترة"
              value={range}
              onChange={(v) => {
                setRange(v)
                setPage(1)
              }}
              options={[
                { value: "all", label: "الكل" },
                { value: "today", label: "اليوم" },
                { value: "7d", label: "7 أيام" },
                { value: "30d", label: "30 يوم" },
              ]}
            />
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="بحث بالاسم أو الجوال"
                className="h-9 pr-9"
                aria-label="بحث في الحجوزات"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loading rows={6} />
        ) : error ? (
          <div className="py-14 text-center text-destructive">تعذر تحميل الحجوزات</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={data.length === 0 ? "لا توجد حجوزات محفوظة بعد" : "لا توجد نتائج مطابقة"}
            text={data.length === 0 ? "الحجوزات الجديدة من نموذج الموقع تُحفظ هنا تلقائياً." : "غيّر الفلتر أو كلمة البحث."}
          />
        ) : (
          <div className="adm-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-44">وصل</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الفحص</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-36">تواصل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">{timeAgo(b.createdAt)}</div>
                      {formatDate(b.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{b.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{b.phone}</div>
                    </TableCell>
                    <TableCell>{b.testType}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <select
                        value={b.status}
                        onChange={(e) => update.mutate({ id: b.id, status: e.target.value })}
                        aria-label={`حالة حجز ${b.name}`}
                        className="h-8 rounded-md border border-input bg-background px-2 text-[13px] font-semibold"
                      >
                        {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <a href={`tel:${b.phone}`} aria-label={`اتصال بـ ${b.name}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-primary hover:bg-muted">
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={whatsappLink(b.phone, `مرحباً ${b.name}، معك مختبر خلود بخصوص طلب حجز ${b.testType}.`)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`واتساب ${b.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-[#25D366] text-white hover:opacity-90"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>{filtered.length} حجز</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="الصفحة السابقة">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="min-w-16 text-center font-semibold text-foreground">{current} / {pages}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="الصفحة التالية">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Sheet open={open !== null} onOpenChange={(value) => !value && setOpenId(null)}>
        <SheetContent side="left" className="adm w-full overflow-y-auto sm:max-w-md" dir="rtl">
          {open && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle className="text-xl">{open.name}</SheetTitle>
                <SheetDescription>حجز رقم {open.id} · {formatDate(open.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <StatusPill status={open.status} label={BOOKING_STATUS_LABELS[open.status] ?? open.status} />
                  <span className="text-xs text-muted-foreground">{open.emailSent ? "وصل إشعار بالإيميل" : "لم يُرسل إشعار إيميل"}</span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-lg bg-muted/60 p-4 text-sm">
                  <dt className="text-muted-foreground">الجوال</dt>
                  <dd className="font-semibold" dir="ltr" style={{ textAlign: "right" }}>{open.phone}</dd>
                  <dt className="text-muted-foreground">الفحص</dt>
                  <dd className="font-semibold">{open.testType}</dd>
                </dl>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="gap-2">
                    <a href={`tel:${open.phone}`}><Phone className="h-4 w-4" />اتصال</a>
                  </Button>
                  <Button asChild className="gap-2 bg-[#25D366] text-white hover:bg-[#25D366]/90">
                    <a href={whatsappLink(open.phone, `مرحباً ${open.name}، معك مختبر خلود بخصوص طلب حجز ${open.testType}.`)} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" />واتساب
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold">تغيير الحالة</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
                      <Button
                        key={key}
                        variant={open.status === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => update.mutate({ id: open.id, status: key })}
                        disabled={update.isPending}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <NotesBox key={open.id} initial={open.notes} onSave={(notes) => update.mutate({ id: open.id, notes })} saving={update.isPending} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function NotesBox({ initial, onSave, saving }: { initial: string; onSave: (value: string) => void; saving: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold" htmlFor="booking-notes">ملاحظات داخلية</label>
      <Textarea id="booking-notes" value={value} onChange={(e) => setValue(e.target.value)} maxLength={2000} rows={4} placeholder="مثال: طلب الاتصال بعد العصر" />
      <Button size="sm" onClick={() => onSave(value)} disabled={saving || value === initial}>
        حفظ الملاحظة
      </Button>
    </div>
  )
}
