import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, DownloadCloud, EyeOff, ImageIcon, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { adminFetch } from "@/lib/admin-api"
import { ConfirmButton, EmptyState, Loading, PageHeader, Panel } from "./ui"

export type ManagedImage = {
  id: number
  title: string
  caption?: string
  sortOrder: number
  active: boolean
  startsAt?: string | null
  endsAt?: string | null
  url: string
}

type ImportItem = { path: string; title: string; active?: boolean }

type Config = {
  title: string
  subtitle: string
  listPath: string // e.g. /admin/slides or /admin/gallery?kind=gallery
  basePath: string // e.g. /admin/slides
  extraBody?: Record<string, unknown>
  queryKey: string
  publicQueryKeys: string[][]
  aspect: "9/16" | "16/9"
  maxWidth: number
  schedule?: boolean
  caption?: boolean
  importItems?: ImportItem[]
  importLabel?: string
  emptyHint: string
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"))
    reader.readAsDataURL(blob)
  })
}

async function prepareImage(file: Blob, maxWidth: number): Promise<{ mimeType: string; imageData: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
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

export function ImageManager({ config }: { config: Config }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", config.queryKey],
    queryFn: () => adminFetch<ManagedImage[]>(config.listPath),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", config.queryKey] })
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "audit"] })
    for (const key of config.publicQueryKeys) queryClient.invalidateQueries({ queryKey: key })
  }
  const onError = (err: Error) => toast({ title: "تعذر الحفظ", description: err.message, variant: "destructive" })

  const patch = useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; caption?: string; active?: boolean; startsAt?: string | null; endsAt?: string | null }) =>
      adminFetch(`${config.basePath}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`${config.basePath}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "تم الحذف" })
      refresh()
    },
    onError,
  })
  const reorder = useMutation({
    mutationFn: (ids: number[]) => adminFetch(`${config.basePath}/reorder`, { method: "POST", body: JSON.stringify({ ids }) }),
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

  const create = (body: Record<string, unknown>) =>
    adminFetch(config.basePath, { method: "POST", body: JSON.stringify({ ...config.extraBody, ...body }) })

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy("upload")
    let done = 0
    try {
      for (const file of Array.from(files)) {
        const prepared = await prepareImage(file, config.maxWidth)
        await create({ title: file.name.replace(/\.[^.]+$/, ""), ...prepared })
        done += 1
      }
      toast({ title: "تم رفع الصور", description: `${done} صورة` })
    } catch (err) {
      toast({ title: `توقف الرفع بعد ${done} صورة`, description: (err as Error).message, variant: "destructive" })
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ""
      refresh()
    }
  }

  const importCurrent = async () => {
    if (!config.importItems) return
    setBusy("import")
    let done = 0
    try {
      for (const item of config.importItems) {
        const response = await fetch(`${import.meta.env.BASE_URL}${item.path.replace(/^\//, "")}`)
        if (!response.ok) throw new Error(`تعذر قراءة ${item.path}`)
        const prepared = await prepareImage(await response.blob(), config.maxWidth)
        const created = (await create({ title: item.title, ...prepared })) as ManagedImage
        if (item.active === false && created?.id) {
          await adminFetch(`${config.basePath}/${created.id}`, { method: "PATCH", body: JSON.stringify({ active: false }) })
        }
        done += 1
      }
      toast({ title: "تم الاستيراد", description: `${done} صورة` })
    } catch (err) {
      toast({ title: `توقف الاستيراد بعد ${done} صورة`, description: (err as Error).message, variant: "destructive" })
    } finally {
      setBusy(null)
      refresh()
    }
  }

  const activeCount = data.filter((s) => s.active).length

  return (
    <div className="adm-rise">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            {data.length === 0 && config.importItems && (
              <Button variant="outline" onClick={importCurrent} disabled={busy !== null} className="gap-2">
                <DownloadCloud className="h-4 w-4" />
                {busy === "import" ? "جاري الاستيراد..." : config.importLabel ?? "استيراد الصور الحالية"}
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            <Button onClick={() => fileRef.current?.click()} disabled={busy !== null} className="gap-2">
              <Upload className="h-4 w-4" />
              {busy === "upload" ? "جاري الرفع..." : "رفع صور"}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <Panel flush><Loading rows={4} /></Panel>
      ) : error ? (
        <div className="py-14 text-center text-destructive">تعذر تحميل الصور</div>
      ) : data.length === 0 ? (
        <Panel flush>
          <EmptyState icon={ImageIcon} title="لا توجد صور في اللوحة" text={config.emptyHint} />
        </Panel>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{activeCount} ظاهرة من {data.length}. الترتيب هنا هو نفس الترتيب في الموقع.</p>
          <div className={config.aspect === "9/16" ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid grid-cols-1 gap-4 md:grid-cols-2"}>
            {data.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative bg-[#260a21]">
                  <img
                    src={item.url}
                    alt={item.title || `صورة ${index + 1}`}
                    loading="lazy"
                    className={`mx-auto w-full object-contain ${config.aspect === "9/16" ? "aspect-[9/16] max-h-72" : "aspect-[16/10]"} ${item.active ? "" : "opacity-40"}`}
                  />
                  <span className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-xs font-bold text-white">{index + 1}</span>
                  {!item.active && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-xs font-bold text-foreground">
                      <EyeOff className="h-3 w-3" />
                      مخفية
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 p-3">
                  <Input
                    defaultValue={item.title}
                    placeholder="عنوان داخلي"
                    maxLength={120}
                    className="h-8 text-[13px]"
                    aria-label="عنوان الصورة"
                    onBlur={(e) => e.target.value !== item.title && patch.mutate({ id: item.id, title: e.target.value })}
                  />
                  {config.caption && (
                    <Input
                      defaultValue={item.caption ?? ""}
                      placeholder="وصف يظهر تحت الصورة (اختياري)"
                      maxLength={200}
                      className="h-8 text-[13px]"
                      aria-label="وصف الصورة"
                      onBlur={(e) => e.target.value !== (item.caption ?? "") && patch.mutate({ id: item.id, caption: e.target.value })}
                    />
                  )}
                  {config.schedule && (
                    <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground 2xl:grid-cols-2">
                      <label className="space-y-1">
                        <span>يبدأ</span>
                        <Input
                          type="datetime-local"
                          defaultValue={toLocalInput(item.startsAt)}
                          className="h-8 px-1 text-[11px]"
                          onBlur={(e) => {
                            const next = e.target.value ? new Date(e.target.value).toISOString() : null
                            if (next !== (item.startsAt ?? null)) patch.mutate({ id: item.id, startsAt: next })
                          }}
                        />
                      </label>
                      <label className="space-y-1">
                        <span>ينتهي</span>
                        <Input
                          type="datetime-local"
                          defaultValue={toLocalInput(item.endsAt)}
                          className="h-8 px-1 text-[11px]"
                          onBlur={(e) => {
                            const next = e.target.value ? new Date(e.target.value).toISOString() : null
                            if (next !== (item.endsAt ?? null)) patch.mutate({ id: item.id, endsAt: next })
                          }}
                        />
                      </label>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <Switch checked={item.active} onCheckedChange={(active) => patch.mutate({ id: item.id, active })} aria-label="إظهار الصورة" />
                      {item.active ? "ظاهرة" : "مخفية"}
                    </label>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} aria-label="تقديم">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === data.length - 1 || reorder.isPending} onClick={() => move(index, 1)} aria-label="تأخير">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <ConfirmButton icon={Trash2} label="" onConfirm={() => remove.mutate(item.id)} disabled={remove.isPending} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
