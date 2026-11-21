import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, ArrowLeft, DownloadCloud, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { adminFetch } from "@/lib/admin-api"

type Slide = {
  id: number
  title: string
  sortOrder: number
  active: boolean
  startsAt: string | null
  endsAt: string | null
  url: string
}

const STATIC_COUNT = 17
const MAX_WIDTH = 1080

function toLocalInput(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"))
    reader.readAsDataURL(blob)
  })
}

// Resizes to <=1080px wide and re-encodes as WebP so uploads stay small and fast.
async function prepareImage(file: Blob): Promise<{ mimeType: string; imageData: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
  if (webp && webp.type === "image/webp") return { mimeType: "image/webp", imageData: await blobToBase64(webp) }
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88))
  if (!jpeg) throw new Error("تعذر معالجة الصورة")
  return { mimeType: "image/jpeg", imageData: await blobToBase64(jpeg) }
}

export function Slides() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "slides"],
    queryFn: () => adminFetch<Slide[]>("/admin/slides"),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "slides"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    queryClient.invalidateQueries({ queryKey: ["public-slides"] })
  }
  const onError = (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" })

  const patch = useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; active?: boolean; startsAt?: string | null; endsAt?: string | null }) =>
      adminFetch(`/admin/slides/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setConfirmId(null)
      refresh()
    },
    onError,
  })
  const reorder = useMutation({
    mutationFn: (ids: number[]) => adminFetch("/admin/slides/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
    onSuccess: refresh,
    onError,
  })

  const move = (index: number, delta: number) => {
    const ids = data.map((s) => s.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    let done = 0
    try {
      for (const file of Array.from(files)) {
        const prepared = await prepareImage(file)
        await adminFetch("/admin/slides", {
          method: "POST",
          body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, ""), ...prepared }),
        })
        done += 1
      }
      toast({ title: "تم رفع الصور", description: `${done} صورة` })
    } catch (err) {
      toast({ title: `توقف الرفع بعد ${done} صورة`, description: (err as Error).message, variant: "destructive" })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
      refresh()
    }
  }

  const importCurrent = async () => {
    setBusy(true)
    let done = 0
    try {
      for (let i = 1; i <= STATIC_COUNT; i += 1) {
        const name = `kholoud-white-friday-${String(i).padStart(2, "0")}.webp`
        const response = await fetch(`${import.meta.env.BASE_URL}assets/white-friday/${name}`)
        if (!response.ok) throw new Error(`تعذر قراءة ${name}`)
        const blob = await response.blob()
        await adminFetch("/admin/slides", {
          method: "POST",
          body: JSON.stringify({ title: `عرض ${i}`, mimeType: "image/webp", imageData: await blobToBase64(blob) }),
        })
        done += 1
      }
      toast({ title: "تم استيراد العروض الحالية", description: `${done} عرض` })
    } catch (err) {
      toast({ title: `توقف الاستيراد بعد ${done} عرض`, description: (err as Error).message, variant: "destructive" })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="text-sm text-muted-foreground">
            الصور تظهر في السلايدر بالصفحة الرئيسية حسب الترتيب. يفضّل صور طولية 9:16 (مثل 1080×1920). تُصغَّر تلقائياً قبل الرفع.
            {data.length === 0 && " الموقع يعرض حالياً العروض الثابتة، وبمجرد إضافة أي عرض هنا تُعرض عروض اللوحة فقط."}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.length === 0 && (
              <Button variant="outline" onClick={importCurrent} disabled={busy} className="gap-2">
                <DownloadCloud className="h-4 w-4" />
                استيراد العروض الحالية ({STATIC_COUNT})
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            <Button onClick={() => fileRef.current?.click()} disabled={busy} className="gap-2">
              <Upload className="h-4 w-4" />
              {busy ? "جاري الرفع..." : "رفع صور جديدة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">تعذر تحميل العروض</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((slide, index) => (
            <Card key={slide.id} className={slide.active ? "" : "opacity-60"}>
              <CardContent className="space-y-3 p-3">
                <div className="relative overflow-hidden rounded-xl bg-[#2a0620]">
                  <img src={slide.url} alt={slide.title || `عرض ${index + 1}`} className="mx-auto aspect-[9/16] max-h-80 object-contain" loading="lazy" />
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">{index + 1}</span>
                </div>
                <Input
                  defaultValue={slide.title}
                  placeholder="عنوان داخلي (للتنظيم فقط)"
                  maxLength={120}
                  className="h-8 text-xs"
                  onBlur={(e) => {
                    if (e.target.value !== slide.title) patch.mutate({ id: slide.id, title: e.target.value })
                  }}
                />
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <label className="space-y-1">
                    <span>يبدأ</span>
                    <Input
                      type="datetime-local"
                      defaultValue={toLocalInput(slide.startsAt)}
                      className="h-8 px-1 text-[11px]"
                      onBlur={(e) => {
                        const next = e.target.value ? new Date(e.target.value).toISOString() : null
                        if (next !== slide.startsAt) patch.mutate({ id: slide.id, startsAt: next })
                      }}
                    />
                  </label>
                  <label className="space-y-1">
                    <span>ينتهي</span>
                    <Input
                      type="datetime-local"
                      defaultValue={toLocalInput(slide.endsAt)}
                      className="h-8 px-1 text-[11px]"
                      onBlur={(e) => {
                        const next = e.target.value ? new Date(e.target.value).toISOString() : null
                        if (next !== slide.endsAt) patch.mutate({ id: slide.id, endsAt: next })
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <Switch checked={slide.active} onCheckedChange={(active) => patch.mutate({ id: slide.id, active })} />
                    {slide.active ? "ظاهر" : "مخفي"}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === 0} onClick={() => move(index, -1)} aria-label="تقديم">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === data.length - 1} onClick={() => move(index, 1)} aria-label="تأخير">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {confirmId === slide.id ? (
                      <Button size="sm" variant="destructive" className="h-8" onClick={() => remove.mutate(slide.id)}>
                        تأكيد الحذف
                      </Button>
                    ) : (
                      <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setConfirmId(slide.id)} aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
