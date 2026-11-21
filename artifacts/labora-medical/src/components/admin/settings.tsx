import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useContentBlock } from "./use-content"
import { Field, Loading, PageHeader, Panel, SaveBar, Segmented } from "./ui"

function ContactEditor() {
  const block = useContentBlock("contact")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  const set = (patch: Partial<typeof draft>) => setDraft({ ...draft, ...patch })
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="الهاتف والواتساب" description="تظهر في الشريط العلوي والفوتر وزر الواتساب العائم وصفحة التواصل">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم الهاتف (للعرض)"><Input dir="ltr" value={draft.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} maxLength={30} /></Field>
              <Field label="رقم الاتصال" hint="بصيغة دولية، مثال +966559070400"><Input dir="ltr" value={draft.phoneTel} onChange={(e) => set({ phoneTel: e.target.value })} maxLength={20} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="واتساب المختبر" hint="أرقام فقط بدون + مثال 966559070400"><Input dir="ltr" value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} maxLength={15} /></Field>
              <Field label="واتساب الإدارة"><Input dir="ltr" value={draft.whatsappSecondary} onChange={(e) => set({ whatsappSecondary: e.target.value.replace(/\D/g, "") })} maxLength={15} /></Field>
            </div>
            <Field label="رسالة واتساب الجاهزة"><Input value={draft.whatsappMessage} onChange={(e) => set({ whatsappMessage: e.target.value })} maxLength={160} /></Field>
            <Field label="البريد الإلكتروني"><Input dir="ltr" type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} maxLength={80} /></Field>
          </div>
        </Panel>

        <Panel title="العنوان والخريطة">
          <div className="space-y-4">
            <Field label="العنوان"><Textarea value={draft.address} onChange={(e) => set({ address: e.target.value })} rows={2} maxLength={200} /></Field>
            <Field label="رابط الموقع على خرائط Google"><Input dir="ltr" value={draft.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} maxLength={300} /></Field>
          </div>
        </Panel>

        <Panel title="ساعات العمل">
          <div className="space-y-3">
            {draft.hours.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={row.label} onChange={(e) => set({ hours: draft.hours.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)) })} placeholder="الأيام" maxLength={40} aria-label="الأيام" />
                <Input value={row.value} onChange={(e) => set({ hours: draft.hours.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)) })} placeholder="الساعات" maxLength={60} aria-label="الساعات" />
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 text-destructive" onClick={() => set({ hours: draft.hours.filter((_, i) => i !== index) })} aria-label="حذف الصف"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => set({ hours: [...draft.hours, { label: "", value: "" }] })}><Plus className="h-4 w-4" />إضافة صف</Button>
          </div>
        </Panel>

        <Panel title="حسابات التواصل الاجتماعي">
          <div className="space-y-4">
            <Field label="إنستغرام"><Input dir="ltr" value={draft.instagram} onChange={(e) => set({ instagram: e.target.value })} maxLength={300} /></Field>
            <Field label="سناب شات"><Input dir="ltr" value={draft.snapchat} onChange={(e) => set({ snapchat: e.target.value })} maxLength={300} /></Field>
            <Field label="تيك توك"><Input dir="ltr" value={draft.tiktok} onChange={(e) => set({ tiktok: e.target.value })} maxLength={300} /></Field>
          </div>
        </Panel>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

function AnnouncementEditor() {
  const block = useContentBlock("announcement")
  if (block.isLoading) return <Loading />
  const { draft, setDraft } = block
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Panel
          title="شريط الإعلان"
          description="شريط ملوّن أعلى كل صفحات الموقع، مناسب للعروض الموسمية. الزائر يقدر يغلقه."
          actions={<Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} aria-label="تفعيل الشريط" />}
        >
          <div className="space-y-4">
            <Field label="نص الإعلان"><Input value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} maxLength={140} placeholder="مثال: عروض الجمعة البيضاء بخصم 15% على الباقات" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نص الرابط (اختياري)"><Input value={draft.linkLabel} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} maxLength={30} placeholder="احجز الآن" /></Field>
              <Field label="الرابط" hint="مثال: /#book أو رابط كامل"><Input dir="ltr" value={draft.linkUrl} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} maxLength={300} /></Field>
            </div>
          </div>
        </Panel>
        <Panel title="معاينة">
          {draft.enabled && draft.text ? (
            <div className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-white">
              {draft.text}
              {draft.linkLabel && <span className="mr-3 font-bold underline underline-offset-4">{draft.linkLabel}</span>}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">الشريط مخفي. فعّله واكتب نصاً ليظهر هنا.</p>
          )}
        </Panel>
      </div>
      <SaveBar dirty={block.dirty} saving={block.saving} onSave={block.save} onReset={block.reset} onRestoreDefaults={block.restoreDefaults} />
    </>
  )
}

export function Settings() {
  const [tab, setTab] = useState<"contact" | "announcement">("contact")
  return (
    <div className="adm-rise">
      <PageHeader title="التواصل والإعدادات" subtitle="بيانات المختبر التي تظهر في كل صفحات الموقع. غيّرها هنا مرة وحدة وتتحدث في كل مكان." />
      <div className="mb-5">
        <Segmented<"contact" | "announcement">
          label="أقسام الإعدادات"
          value={tab}
          onChange={setTab}
          options={[
            { value: "contact", label: "بيانات التواصل" },
            { value: "announcement", label: "شريط الإعلان" },
          ]}
        />
      </div>
      {tab === "contact" ? <ContactEditor /> : <AnnouncementEditor />}
    </div>
  )
}
