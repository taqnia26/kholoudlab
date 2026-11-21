import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Briefcase, FileDown, Mail, MessageCircle, Phone, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { adminDownload, adminFetch, formatDate, whatsappLink } from "@/lib/admin-api"
import { EmptyState, Loading, PageHeader, Panel, Segmented, StatusPill, timeAgo } from "./ui"
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

function formatSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
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

  const open = data.find((a) => a.id === openId) ?? null

  const download = async (a: Application) => {
    try {
      await adminDownload(`/admin/job-applications/${a.id}/file`, a.fileName)
    } catch (err) {
      toast({ title: "تعذر تحميل السيرة الذاتية", description: (err as Error).message, variant: "destructive" })
    }
  }

  return (
    <div className="adm-rise">
      <PageHeader title="طلبات التوظيف" subtitle="الطلبات المرسلة من صفحة الوظائف مع السيرة الذاتية. غيّر الحالة وأضف ملاحظات التقييم." />
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            label="تصفية بالحالة"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "الكل", count: data.length },
              ...Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label, count: data.filter((a) => a.status === value).length })),
            ]}
          />
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الوظيفة" className="h-9 pr-9" aria-label="بحث في الطلبات" />
          </div>
        </div>

        {isLoading ? (
          <Loading rows={5} />
        ) : error ? (
          <div className="py-14 text-center text-destructive">تعذر تحميل الطلبات</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={data.length === 0 ? "لا توجد طلبات توظيف محفوظة بعد" : "لا توجد نتائج مطابقة"}
            text={data.length === 0 ? "الطلبات الجديدة تُحفظ هنا مع السيرة الذاتية، وتصلك أيضاً على الإيميل." : "غيّر الفلتر أو كلمة البحث."}
          />
        ) : (
          <div className="adm-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-36">وصل</TableHead>
                  <TableHead>المتقدم</TableHead>
                  <TableHead>الوظيفة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-28">السيرة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpenId(a.id)}>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">{timeAgo(a.createdAt)}</div>
                      {formatDate(a.createdAt, false)}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{a.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{a.email}</div>
                    </TableCell>
                    <TableCell>{a.position || "طلب توظيف عام"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <select
                        value={a.status}
                        onChange={(e) => update.mutate({ id: a.id, status: e.target.value })}
                        aria-label={`حالة طلب ${a.name}`}
                        className="h-8 rounded-md border border-input bg-background px-2 text-[13px] font-semibold"
                      >
                        {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => download(a)}>
                        <FileDown className="h-4 w-4" />
                        تحميل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Sheet open={open !== null} onOpenChange={(value) => !value && setOpenId(null)}>
        <SheetContent side="left" className="adm w-full overflow-y-auto sm:max-w-lg" dir="rtl">
          {open && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle className="text-xl">{open.name}</SheetTitle>
                <SheetDescription>{open.position || "طلب توظيف عام"} · {formatDate(open.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                <StatusPill status={open.status} label={APPLICATION_STATUS_LABELS[open.status] ?? open.status} />
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-lg bg-muted/60 p-4 text-sm">
                  <dt className="text-muted-foreground">الجوال</dt>
                  <dd className="font-semibold" dir="ltr" style={{ textAlign: "right" }}>{open.phone}</dd>
                  <dt className="text-muted-foreground">البريد</dt>
                  <dd className="font-semibold break-all" dir="ltr" style={{ textAlign: "right" }}>{open.email}</dd>
                  <dt className="text-muted-foreground">الملف</dt>
                  <dd className="font-semibold">{open.fileName} ({formatSize(open.fileSize)})</dd>
                </dl>
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild variant="outline" className="gap-1.5"><a href={`tel:${open.phone}`}><Phone className="h-4 w-4" />اتصال</a></Button>
                  <Button asChild variant="outline" className="gap-1.5"><a href={`mailto:${open.email}`}><Mail className="h-4 w-4" />بريد</a></Button>
                  <Button asChild className="gap-1.5 bg-[#25D366] text-white hover:bg-[#25D366]/90">
                    <a href={whatsappLink(open.phone, `مرحباً ${open.name}، معك مختبر خلود بخصوص طلب التوظيف.`)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />واتساب</a>
                  </Button>
                </div>
                <Button className="w-full gap-2" onClick={() => download(open)}>
                  <FileDown className="h-4 w-4" />
                  تحميل السيرة الذاتية
                </Button>
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold">رسالة المتقدم</div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border p-3 text-sm leading-relaxed">{open.coverLetter || "لا توجد رسالة إضافية."}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold">تغيير الحالة</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                      <Button key={key} size="sm" variant={open.status === key ? "default" : "outline"} onClick={() => update.mutate({ id: open.id, status: key })} disabled={update.isPending}>
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Notes key={open.id} initial={open.notes} saving={update.isPending} onSave={(notes) => update.mutate({ id: open.id, notes })} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Notes({ initial, onSave, saving }: { initial: string; onSave: (value: string) => void; saving: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold" htmlFor="application-notes">ملاحظات التقييم</label>
      <Textarea id="application-notes" value={value} onChange={(e) => setValue(e.target.value)} maxLength={2000} rows={4} placeholder="انطباع المقابلة، الراتب المتوقع، موعد المتابعة" />
      <Button size="sm" onClick={() => onSave(value)} disabled={saving || value === initial}>حفظ الملاحظة</Button>
    </div>
  )
}
