import { Fragment, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileDown, Mail, Phone, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { adminDownload, adminFetch, formatDate } from "@/lib/admin-api"
import { APPLICATION_STATUS_LABELS } from "./labels"

type Application = {
  id: number
  name: string
  email: string
  phone: string
  position: string
  coverLetter: string
  fileName: string
  fileSize: number
  status: string
  notes: string
  createdAt: string
}

export function Applications() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [openId, setOpenId] = useState<number | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => adminFetch<Application[]>("/admin/job-applications"),
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; notes?: string }) =>
      adminFetch<Application>(`/admin/job-applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
    onError: (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" }),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter(
      (a) =>
        (status === "all" || a.status === status) &&
        (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.phone.includes(q) || a.position.toLowerCase().includes(q)),
    )
  }, [data, search, status])

  const download = async (a: Application) => {
    try {
      await adminDownload(`/admin/job-applications/${a.id}/file`, a.fileName)
    } catch (err) {
      toast({ title: "تعذر تحميل السيرة الذاتية", description: (err as Error).message, variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الوظيفة" className="pr-9" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="تصفية بالحالة"
          >
            <option value="all">كل الحالات</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">تعذر تحميل الطلبات</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {data.length === 0 ? "لا توجد طلبات توظيف محفوظة بعد. الطلبات الجديدة ستظهر هنا مع السيرة الذاتية." : "لا توجد نتائج مطابقة"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المتقدم</TableHead>
                  <TableHead>التواصل</TableHead>
                  <TableHead>الوظيفة</TableHead>
                  <TableHead>السيرة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <Fragment key={a.id}>
                    <TableRow>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                      <TableCell>
                        <button className="text-right font-semibold hover:text-primary" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                          {a.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          <span className="text-xs">{a.phone}</span>
                          <a href={`tel:${a.phone}`} aria-label="اتصال" className="text-primary"><Phone className="h-4 w-4" /></a>
                          <a href={`mailto:${a.email}`} aria-label="بريد" className="text-primary"><Mail className="h-4 w-4" /></a>
                        </div>
                      </TableCell>
                      <TableCell>{a.position || "طلب توظيف عام"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => download(a)}>
                          <FileDown className="h-4 w-4" />
                          تحميل
                        </Button>
                      </TableCell>
                      <TableCell>
                        <select
                          value={a.status}
                          onChange={(e) => update.mutate({ id: a.id, status: e.target.value })}
                          className="h-8 rounded-full border px-2 text-xs font-bold"
                          aria-label="حالة الطلب"
                        >
                          {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={a.notes}
                          maxLength={2000}
                          placeholder="أضف ملاحظة"
                          className="h-8 min-w-40 text-xs"
                          onBlur={(e) => {
                            if (e.target.value !== a.notes) update.mutate({ id: a.id, notes: e.target.value })
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    {openId === a.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/40 text-sm">
                          <div className="mb-1 text-xs text-muted-foreground">{a.email}</div>
                          <div className="whitespace-pre-wrap">{a.coverLetter || "لا توجد رسالة إضافية."}</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
