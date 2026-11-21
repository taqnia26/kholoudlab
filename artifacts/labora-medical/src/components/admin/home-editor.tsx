import { useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SERVICE_ICONS, type FaqItem, type ServiceItem } from "@/lib/site-content"
import { useContentBlock } from "./use-content"
import { Field, Loading, PageHeader, Panel, SaveBar, Segmented } from "./ui"

type Tab = "hero" | "services" | "faq" | "cta" | "sections"

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function HeroTab() {
  const block = useContentBlock("hero")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  const set = (patch: Partial<typeof draft>) => setDraft({ ...draft, ...patch })
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="نصوص واجهة الصفحة الرئيسية">
          <div className="space-y-4">
            <Field label="الشارة فوق العنوان"><Input value={draft.badge} onChange={(e) => set({ badge: e.target.value })} maxLength={80} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="العنوان: السطر الأول"><Input value={draft.headline1} onChange={(e) => set({ headline1: e.target.value })} maxLength={60} /></Field>
              <Field label="الجزء الملوّن" hint="يظهر باللون الأساسي"><Input value={draft.headlineAccent} onChange={(e) => set({ headlineAccent: e.target.value })} maxLength={40} /></Field>
              <Field label="تكملة السطر الثاني"><Input value={draft.headline2} onChange={(e) => set({ headline2: e.target.value })} maxLength={60} /></Field>
            </div>
            <Field label="النص التعريفي"><Textarea value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} rows={4} maxLength={400} /></Field>
            <Field label="نص زر الحجز"><Input value={draft.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} maxLength={40} /></Field>
          </div>
        </Panel>
        <Panel title="معاينة" description="كما سيظهر في أعلى الصفحة">
          <div className="rounded-lg bg-[#fbf6f9] p-5 text-center">
            <span className="mb-3 inline-block rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold text-primary">{draft.badge}</span>
            <h3 className="text-2xl font-bold leading-snug">
              {draft.headline1}
              <br />
              <span className="text-primary">{draft.headlineAccent}</span> {draft.headline2}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{draft.subtitle}</p>
            <span className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">{draft.ctaLabel}</span>
          </div>
        </Panel>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

function ServicesTab() {
  const block = useContentBlock("services")
  if (block.isLoading) return <Loading />
  const list = block.draft
  const update = (index: number, patch: Partial<ServiceItem>) => block.setDraft(list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  return (
    <>
      <div className="space-y-3">
        {list.map((item, index) => {
          const Icon = (SERVICE_ICONS[item.icon] ?? SERVICE_ICONS.heartPulse).Icon
          return (
            <Panel key={index} className={item.visible ? "" : "opacity-60"}>
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex shrink-0 items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                  <select
                    value={item.icon}
                    onChange={(e) => update(index, { icon: e.target.value })}
                    aria-label="أيقونة الخدمة"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {Object.entries(SERVICE_ICONS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                  </select>
                </div>
                <div className="grid flex-1 gap-3">
                  <Input value={item.title} onChange={(e) => update(index, { title: e.target.value })} placeholder="اسم الخدمة" maxLength={60} aria-label="اسم الخدمة" className="font-bold" />
                  <Textarea value={item.desc} onChange={(e) => update(index, { desc: e.target.value })} rows={2} placeholder="وصف قصير" maxLength={220} aria-label="وصف الخدمة" />
                </div>
                <div className="flex shrink-0 items-center gap-1.5 lg:flex-col lg:items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <Switch checked={item.visible} onCheckedChange={(visible) => update(index, { visible })} aria-label="إظهار الخدمة" />
                    {item.visible ? "ظاهرة" : "مخفية"}
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === 0} onClick={() => block.setDraft(move(list, index, -1))} aria-label="تقديم"><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === list.length - 1} onClick={() => block.setDraft(move(list, index, 1))} aria-label="تأخير"><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => block.setDraft(list.filter((_, i) => i !== index))} aria-label="حذف الخدمة"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}
        <Button variant="outline" className="gap-2" onClick={() => block.setDraft([...list, { icon: "heartPulse", title: "خدمة جديدة", desc: "", visible: true }])}>
          <Plus className="h-4 w-4" />إضافة خدمة
        </Button>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

function FaqTab() {
  const block = useContentBlock("faq")
  if (block.isLoading) return <Loading />
  const list = block.draft
  const update = (index: number, patch: Partial<FaqItem>) => block.setDraft(list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  return (
    <>
      <div className="space-y-3">
        {list.map((item, index) => (
          <Panel key={index}>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="grid flex-1 gap-3">
                <Input value={item.q} onChange={(e) => update(index, { q: e.target.value })} placeholder="السؤال" maxLength={140} aria-label="السؤال" className="font-bold" />
                <Textarea value={item.a} onChange={(e) => update(index, { a: e.target.value })} rows={3} placeholder="الجواب" maxLength={800} aria-label="الجواب" />
              </div>
              <div className="flex shrink-0 gap-1 lg:flex-col">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === 0} onClick={() => block.setDraft(move(list, index, -1))} aria-label="تقديم"><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={index === list.length - 1} onClick={() => block.setDraft(move(list, index, 1))} aria-label="تأخير"><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => block.setDraft(list.filter((_, i) => i !== index))} aria-label="حذف السؤال"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Panel>
        ))}
        <Button variant="outline" className="gap-2" onClick={() => block.setDraft([...list, { q: "", a: "" }])}>
          <Plus className="h-4 w-4" />إضافة سؤال
        </Button>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

function CtaTab() {
  const block = useContentBlock("cta")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="قسم الدعوة للحجز (أسفل الصفحة)">
          <div className="space-y-4">
            <Field label="العنوان"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={80} /></Field>
            <Field label="النص"><Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={3} maxLength={300} /></Field>
            <Field label="نص الزر" hint="رقم الهاتف في هذا القسم يؤخذ من «التواصل والإعدادات»"><Input value={draft.buttonLabel} onChange={(e) => setDraft({ ...draft, buttonLabel: e.target.value })} maxLength={40} /></Field>
          </div>
        </Panel>
        <Panel title="معاينة">
          <div className="rounded-lg bg-primary p-6 text-center text-white">
            <h3 className="text-2xl font-bold">{draft.title}</h3>
            <p className="mt-2 text-sm text-white/80">{draft.text}</p>
            <span className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-primary">{draft.buttonLabel}</span>
          </div>
        </Panel>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

const SECTION_LABELS: Record<string, { label: string; hint: string }> = {
  services: { label: "الخدمات", hint: "بطاقات التخصصات المخبرية" },
  packages: { label: "بنرات الباقات", hint: "«باقات مصممة لاحتياجاتك»" },
  gallery: { label: "معرض العروض", hint: "«من عروضنا»" },
  about: { label: "لماذا مختبر خلود", hint: "قسم التعريف والاعتماد" },
  faq: { label: "الأسئلة الشائعة", hint: "قائمة الأسئلة والأجوبة" },
  cta: { label: "قسم الدعوة للحجز", hint: "الشريط الملوّن أسفل الصفحة" },
}

function SectionsTab() {
  const block = useContentBlock("sections")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  return (
    <>
      <Panel flush title="إظهار الأقسام" description="أخفِ أي قسم من الصفحة الرئيسية بدون حذف محتواه. واجهة الصفحة ونموذج الحجز يبقيان ظاهرين دائماً.">
        <ul className="divide-y divide-border">
          {Object.entries(SECTION_LABELS).map(([key, meta]) => (
            <li key={key} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <div className="font-bold">{meta.label}</div>
                <div className="text-xs text-muted-foreground">{meta.hint}</div>
              </div>
              <Switch
                checked={draft[key as keyof typeof draft]}
                onCheckedChange={(value) => setDraft({ ...draft, [key]: value })}
                aria-label={`إظهار ${meta.label}`}
              />
            </li>
          ))}
        </ul>
      </Panel>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

export function HomeEditor() {
  const [tab, setTab] = useState<Tab>("hero")
  return (
    <div className="adm-rise">
      <PageHeader
        title="الصفحة الرئيسية"
        subtitle="عدّل نصوص الموقع وأقسامه. التعديل يظهر في الموقع فور الحفظ، وزر «استرجاع النص الأصلي» يرجّع كل قسم كما كان."
        actions={
          <Button asChild variant="outline"><a href="/" target="_blank" rel="noreferrer">فتح الموقع</a></Button>
        }
      />
      <div className="mb-5">
        <Segmented<Tab>
          label="أقسام التحرير"
          value={tab}
          onChange={setTab}
          options={[
            { value: "hero", label: "الواجهة" },
            { value: "services", label: "الخدمات" },
            { value: "faq", label: "الأسئلة الشائعة" },
            { value: "cta", label: "قسم الحجز" },
            { value: "sections", label: "ظهور الأقسام" },
          ]}
        />
      </div>
      {tab === "hero" && <HeroTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "faq" && <FaqTab />}
      {tab === "cta" && <CtaTab />}
      {tab === "sections" && <SectionsTab />}
    </div>
  )
}
