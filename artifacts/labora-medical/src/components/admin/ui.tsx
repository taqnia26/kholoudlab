import { useEffect, useRef, useState, type ReactNode } from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  flush,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  flush?: boolean
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            {title && <h3 className="text-[15px] font-bold text-foreground">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-bold text-foreground">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  )
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  )
}

const PILL: Record<string, string> = {
  new: "bg-[#fbe4ee] text-[#8f1a50]",
  contacted: "bg-[#fdf0d5] text-[#8a4b08]",
  booked: "bg-[#d9f2ea] text-[#0b6150]",
  cancelled: "bg-muted text-muted-foreground",
  reviewed: "bg-[#e8e4f6] text-[#4b3b92]",
  shortlisted: "bg-[#d9f2ea] text-[#0b6150]",
  rejected: "bg-muted text-muted-foreground",
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", PILL[status] ?? "bg-muted text-foreground")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; count?: number }>
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
            value === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
          {option.count !== undefined && <span className="mr-1.5 text-xs opacity-70">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Two-step destructive button: first click asks, second confirms. */
export function ConfirmButton({ onConfirm, label = "حذف", confirmLabel = "تأكيد الحذف", icon: Icon, disabled }: {
  onConfirm: () => void
  label?: string
  confirmLabel?: string
  icon?: LucideIcon
  disabled?: boolean
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  if (armed) {
    return (
      <Button size="sm" variant="destructive" onClick={onConfirm} disabled={disabled}>
        {confirmLabel}
      </Button>
    )
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-destructive hover:text-destructive"
      disabled={disabled}
      onClick={() => {
        setArmed(true)
        timer.current = window.setTimeout(() => setArmed(false), 4000)
      }}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Button>
  )
}

/** Sticky bar shown while an editor has unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onReset, onRestoreDefaults }: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onReset: () => void
  onRestoreDefaults?: () => void
}) {
  return (
    <div className="sticky bottom-3 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <span className={cn("text-sm font-semibold", dirty ? "text-[color:var(--adm-warn)]" : "text-muted-foreground")}>
        {dirty ? "لديك تعديلات غير محفوظة" : "كل التعديلات محفوظة"}
      </span>
      <div className="flex items-center gap-2">
        {onRestoreDefaults && (
          <Button variant="ghost" size="sm" onClick={onRestoreDefaults} disabled={saving}>
            استرجاع النص الأصلي
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onReset} disabled={!dirty || saving}>
          تراجع
        </Button>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving} className="min-w-24 gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}

export function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `قبل ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `قبل ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `قبل ${days} يوم`
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Number that counts up from 0 once when it appears (instant when reduced motion is on). */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return <>{shown.toLocaleString("en-US")}</>
}
