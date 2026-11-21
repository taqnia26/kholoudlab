import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SeoPage } from "@/lib/site-content"
import { useContentBlock } from "./use-content"
import { Field, Loading, PageHeader, Panel, SaveBar } from "./ui"

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return <span className={`text-xs ${over ? "font-bold text-primary" : "text-muted-foreground"}`}>{value.length} / {max} حرف (الأفضل ألا يتجاوز)</span>
}

function PagePanel({ label, path, value, onChange, fallbackTitle }: { label: string; path: string; value: SeoPage; onChange: (v: SeoPage) => void; fallbackTitle: string }) {
  return (
    <Panel title={label} description="اترك الحقل فارغاً لاستخدام النص الافتراضي للصفحة">
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <Field label="عنوان الصفحة"><Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} maxLength={90} placeholder={fallbackTitle} /></Field>
          <Counter value={value.title} max={60} />
          <Field label="الوصف"><Textarea value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} rows={3} maxLength={200} placeholder="جملة أو جملتان تلخص الصفحة لمحركات البحث" /></Field>
          <Counter value={value.description} max={160} />
        </div>
        <div>
          <div className="mb-2 text-[13px] font-semibold">كيف تظهر في نتائج Google</div>
          <div className="rounded-lg border border-border bg-white p-4" dir="rtl">
            <div className="text-xs text-[#4d5156]" dir="ltr" style={{ textAlign: "right" }}>kholoudlab.com{path}</div>
            <div className="mt-1 text-lg leading-snug text-[#1a0dab]">{value.title || fallbackTitle}</div>
            <div className="mt-1 text-sm leading-relaxed text-[#4d5156]">{value.description || "يُستخدم الوصف الافتراضي المكتوب في الصفحة."}</div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function Seo() {
  const block = useContentBlock("seo")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  return (
    <div className="adm-rise">
      <PageHeader title="محركات البحث (SEO)" subtitle="العنوان والوصف اللي يظهر في Google وعند مشاركة الرابط." />
      <div className="space-y-5">
        <PagePanel label="الصفحة الرئيسية" path="/" value={draft.home} onChange={(home) => setDraft({ ...draft, home })} fallbackTitle="مختبر خلود للتحاليل الطبية | فحوصات وحجز موعد" />
        <PagePanel label="صفحة من نحن" path="/about" value={draft.about} onChange={(about) => setDraft({ ...draft, about })} fallbackTitle="من نحن | مختبر خلود للتحاليل الطبية" />
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </div>
  )
}
