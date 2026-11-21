import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, KeyRound, ShieldCheck, UserPlus, Users as UsersIcon, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, formatDate } from "@/lib/admin-api"
import { ConfirmButton, EmptyState, Field, Loading, PageHeader, Panel, timeAgo } from "./ui"

type AdminUser = {
  id: number
  adminId: string
  displayName: string
  active: boolean
  createdBy: string
  createdAt: string
  lastLoginAt: string | null
}
type UsersResponse = { me: string; system: string[]; users: AdminUser[] }

function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint32Array(14))
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("")
}

function PasswordInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input id={id} dir="ltr" type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required className="pl-10" />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "إخفاء" : "إظهار"} className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <Button type="button" variant="outline" className="gap-1.5" onClick={() => { onChange(generatePassword()); setVisible(true) }}>
        <Wand2 className="h-4 w-4" />
        توليد
      </Button>
    </div>
  )
}

export function Users() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ adminId: "", displayName: "", password: "" })
  const [resetPassword, setResetPassword] = useState("")
  const [created, setCreated] = useState<{ adminId: string; password: string } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminFetch<UsersResponse>("/admin/users"),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "audit"] })
  }
  const onError = (err: Error) => toast({ title: "تعذر التنفيذ", description: err.message, variant: "destructive" })

  const create = useMutation({
    mutationFn: (body: typeof form) => adminFetch<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_row, body) => {
      setCreated({ adminId: body.adminId.trim().toLowerCase(), password: body.password })
      setForm({ adminId: "", displayName: "", password: "" })
      setCreateOpen(false)
      refresh()
    },
    onError,
  })
  const patch = useMutation({
    mutationFn: ({ id, ...body }: { id: number; displayName?: string; active?: boolean; password?: string }) =>
      adminFetch<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast({ title: "تم الحفظ" })
      refresh()
    },
    onError,
  })
  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "تم حذف الحساب" })
      setEditId(null)
      refresh()
    },
    onError,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(form)
  }

  const editing = data?.users.find((u) => u.id === editId) ?? null

  return (
    <div className="adm-rise">
      <PageHeader
        title="المسؤولون"
        subtitle="كل مسؤول يدخل بمعرّفه وكلمة مروره الخاصة وله صلاحية كاملة على اللوحة. كلمات المرور تُحفظ مشفّرة ولا يمكن لأحد قراءتها، ويظهر في سجل النشاط من نفّذ كل عملية."
        actions={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            إضافة مسؤول
          </Button>
        }
      />

      {created && (
        <div className="mb-5 rounded-xl border border-[color:var(--adm-ok)]/40 bg-[#e9f7f2] p-5" role="status">
          <div className="flex items-center gap-2 font-bold text-[#0b6150]">
            <ShieldCheck className="h-5 w-5" />
            تم إنشاء الحساب. سلّم البيانات للمسؤول الآن
          </div>
          <dl className="mt-3 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">المعرّف</dt>
            <dd className="font-bold" dir="ltr" style={{ textAlign: "right" }}>{created.adminId}</dd>
            <dt className="text-muted-foreground">كلمة المرور</dt>
            <dd className="font-bold" dir="ltr" style={{ textAlign: "right" }}>{created.password}</dd>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">كلمة المرور تظهر هنا مرة واحدة فقط. بعد إغلاق هذا المربع لا يمكن عرضها، وتقدر تعيّن كلمة جديدة في أي وقت.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreated(null)}>تم، أغلق</Button>
        </div>
      )}

      <Panel flush>
        {isLoading ? (
          <Loading rows={3} />
        ) : error || !data ? (
          <div className="py-14 text-center text-destructive">تعذر تحميل الحسابات</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.system.map((id) => (
              <li key={`sys-${id}`} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#260a21] to-[#8f1a50] text-lg font-bold text-white">{id.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-bold">
                    {id}
                    {id === data.me && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">أنت</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">حساب النظام الرئيسي · صلاحية كاملة · يُدار من إعدادات السيرفر</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8e4f6] px-2.5 py-0.5 text-xs font-bold text-[#4b3b92]"><ShieldCheck className="h-3.5 w-3.5" />مالك</span>
              </li>
            ))}
            {data.users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold ${u.active ? "bg-[#fbe4ee] text-[#8f1a50]" : "bg-muted text-muted-foreground"}`}>{u.adminId.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-bold">
                    {u.displayName || u.adminId}
                    {u.adminId === data.me && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">أنت</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span dir="ltr">{u.adminId}</span> · أُضيف {formatDate(u.createdAt, false)}{u.createdBy ? ` بواسطة ${u.createdBy}` : ""} · {u.lastLoginAt ? `آخر دخول ${timeAgo(u.lastLoginAt)}` : "لم يدخل بعد"}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <Switch checked={u.active} disabled={u.adminId === data.me || patch.isPending} onCheckedChange={(active) => patch.mutate({ id: u.id, active })} aria-label={`تفعيل ${u.adminId}`} />
                  {u.active ? "فعّال" : "موقوف"}
                </label>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditId(u.id); setResetPassword("") }}>
                  <KeyRound className="h-4 w-4" />
                  إدارة
                </Button>
              </li>
            ))}
            {data.users.length === 0 && (
              <li>
                <EmptyState icon={UsersIcon} title="لا يوجد مسؤولون إضافيون" text="أضف مدراءك هنا وكل واحد يدخل بحسابه الخاص بدل مشاركة رمز واحد." />
              </li>
            )}
          </ul>
        )}
      </Panel>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="left" className="adm w-full overflow-y-auto sm:max-w-md" dir="rtl">
          <SheetHeader className="text-right">
            <SheetTitle className="text-xl">إضافة مسؤول</SheetTitle>
            <SheetDescription>يحصل على صلاحية كاملة: الحجوزات والتوظيف والمحتوى والصور وإدارة المسؤولين.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <Field label="الاسم (اختياري)"><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} maxLength={80} placeholder="مثال: أحمد المدير" /></Field>
            <Field label="معرّف الدخول" hint="إنجليزي صغير وأرقام، من 3 إلى 32 حرفاً"><Input dir="ltr" value={form.adminId} onChange={(e) => setForm({ ...form, adminId: e.target.value.toLowerCase() })} autoComplete="off" required pattern="[a-z0-9][a-z0-9._-]{2,31}" maxLength={32} /></Field>
            <Field label="كلمة المرور" hint="10 أحرف على الأقل. اضغط «توليد» لكلمة قوية جاهزة.">
              <PasswordInput value={form.password} onChange={(password) => setForm({ ...form, password })} />
            </Field>
            <Button type="submit" className="w-full" disabled={create.isPending}>{create.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}</Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditId(null)}>
        <SheetContent side="left" className="adm w-full overflow-y-auto sm:max-w-md" dir="rtl">
          {editing && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle className="text-xl">{editing.displayName || editing.adminId}</SheetTitle>
                <SheetDescription dir="ltr" style={{ textAlign: "right" }}>{editing.adminId}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Field label="الاسم">
                  <Input defaultValue={editing.displayName} maxLength={80} onBlur={(e) => e.target.value !== editing.displayName && patch.mutate({ id: editing.id, displayName: e.target.value })} />
                </Field>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    patch.mutate({ id: editing.id, password: resetPassword }, { onSuccess: () => { setCreated({ adminId: editing.adminId, password: resetPassword }); setResetPassword(""); setEditId(null) } })
                  }}
                >
                  <Field label="كلمة مرور جديدة" hint="تُلغي القديمة فوراً، لكن الجلسة المفتوحة تبقى حتى تنتهي مدتها أو تُوقف الحساب.">
                    <PasswordInput value={resetPassword} onChange={setResetPassword} />
                  </Field>
                  <Button type="submit" variant="outline" disabled={patch.isPending || resetPassword.length < 10}>تغيير كلمة المرور</Button>
                </form>
                <div className="border-t border-border pt-5">
                  <div className="mb-2 text-[13px] font-semibold text-destructive">حذف الحساب</div>
                  <p className="mb-3 text-xs text-muted-foreground">يمنع الدخول نهائياً ويبقى اسمه في سجل النشاط. للإيقاف المؤقت استخدم مفتاح «فعّال» في القائمة.</p>
                  <ConfirmButton onConfirm={() => remove.mutate(editing.id)} disabled={remove.isPending || editing.adminId === data?.me} label="حذف الحساب" />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
