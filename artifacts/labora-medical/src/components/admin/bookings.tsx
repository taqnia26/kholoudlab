import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, MessageCircle, Phone, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, downloadCsv, formatDate, whatsappLink } from "@/lib/admin-api"
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

const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  contacted: "bg-amber-50 text-amber-700 border-amber-300",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-300",
  cancelled: "bg-muted text-muted-foreground border-border",
}

export function Bookings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => adminFetch<Booking[]>("/admin/bookings"),
    refetchInterval: 30_000,
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; notes?: string }) =>
      adminFetch<Booking>(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
    onError: (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" }),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter(
      (b) =>
        (status === "all" || b.status === status) &&
        (!q || b.name.toLowerCase().includes(q) || b.phone.includes(q) || b.testType.toLowerCase().includes(q)),
    )
  }, [data, search, status])

  const exportCsv = () =>
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["#", "التاريخ", "الاسم", "الجوال", "الفحص", "الحالة", "ملاحظات"],
      ...filtered.map((b) => [b.id, formatDate(b.createdAt), b.name, b.phone, b.testType, BOOKING_STATUS_LABELS[b.status] ?? b.status, b.notes]),
    ])

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال أو الفحص" className="pr-9" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="تصفية بالحالة"
          >
            <option value="all">كل الحالات</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">تعذر تحميل الحجوزات</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {data.length === 0 ? "لا توجد حجوزات محفوظة بعد. الحجوزات الجديدة من الموقع ستظهر هنا." : "لا توجد نتائج مطابقة"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الجوال</TableHead>
                  <TableHead>الفحص</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="font-semibold">{b.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" dir="ltr">
                        <span>{b.phone}</span>
                        <a href={`tel:${b.phone}`} aria-label="اتصال" className="text-primary"><Phone className="h-4 w-4" /></a>
                        <a
                          href={whatsappLink(b.phone, `مرحباً ${b.name}، معك مختبر خلود بخصوص طلب حجز ${b.testType}.`)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="واتساب"
                          className="text-emerald-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{b.testType}</TableCell>
                    <TableCell>
                      <select
                        value={b.status}
                        onChange={(e) => update.mutate({ id: b.id, status: e.target.value })}
                        className={`h-8 rounded-full border px-2 text-xs font-bold ${STATUS_STYLES[b.status] ?? ""}`}
                        aria-label="حالة الحجز"
                      >
                        {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={b.notes}
                        maxLength={2000}
                        placeholder="أضف ملاحظة"
                        className="h-8 min-w-40 text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== b.notes) update.mutate({ id: b.id, notes: e.target.value })
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="text-xs text-muted-foreground">{filtered.length} من {data.length} حجز</div>
      </CardContent>
    </Card>
  )
}
