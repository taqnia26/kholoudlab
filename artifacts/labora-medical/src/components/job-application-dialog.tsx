import { useState, type FormEvent, type ReactNode } from "react"
import { useCreateJobApplication } from "@workspace/api-client-react"
import { BriefcaseBusiness, CheckCircle2, FileCheck2, Loader2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

type JobApplicationDialogProps = {
  children: ReactNode
  triggerClassName: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      const base64 = result.split(",", 2)[1]
      if (!base64) {
        reject(new Error("تعذر قراءة الملف."))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."))
    reader.readAsDataURL(file)
  })
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "error" in error.data &&
    typeof error.data.error === "string"
  ) {
    return error.data.error
  }

  return "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى."
}

export function JobApplicationDialog({
  children,
  triggerClassName,
}: JobApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    coverLetter: "",
  })
  const createJobApplication = useCreateJobApplication()

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", position: "", coverLetter: "" })
    setFile(null)
    setFileError(null)
    setSubmitError(null)
    setSuccessMessage(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen && successMessage) resetForm()
  }

  const handleFileChange = (nextFile: File | null) => {
    setFileError(null)

    if (!nextFile) {
      setFile(null)
      return
    }

    if (
      !ACCEPTED_FILE_TYPES.includes(
        nextFile.type as (typeof ACCEPTED_FILE_TYPES)[number],
      )
    ) {
      setFile(null)
      setFileError("ارفع السيرة الذاتية بصيغة PDF أو DOC أو DOCX.")
      return
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null)
      setFileError("حجم الملف يجب ألا يتجاوز 5 ميجابايت.")
      return
    }

    setFile(nextFile)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    if (!file) {
      setFileError("يرجى إرفاق السيرة الذاتية.")
      return
    }

    try {
      const fileData = await fileToBase64(file)
      const response = await createJobApplication.mutateAsync({
        data: {
          ...form,
          position: form.position || undefined,
          coverLetter: form.coverLetter || undefined,
          fileName: file.name,
          fileType: file.type as (typeof ACCEPTED_FILE_TYPES)[number],
          fileData,
        },
      })
      setSuccessMessage(response.message)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {children}
        </button>
      </DialogTrigger>

      <DialogContent
        dir="rtl"
        className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-primary/15 p-0"
      >
        {successMessage ? (
          <div className="px-6 py-10 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            <DialogTitle className="mb-3 text-xl">تم إرسال طلب التوظيف</DialogTitle>
            <DialogDescription className="mx-auto max-w-sm leading-7">
              {successMessage}
            </DialogDescription>
            <Button className="mt-7 w-full" onClick={() => setOpen(false)}>
              تم
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-primary to-[#7d174b] px-6 py-6 text-primary-foreground">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
              </span>
              <DialogHeader>
                <DialogTitle className="text-xl text-white">الفرص الوظيفية</DialogTitle>
                <DialogDescription className="text-white/80">
                  أرسل طلبك وسيرتك الذاتية إلى فريق التوظيف.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
              <div className="space-y-1.5">
                <label htmlFor="job-name" className="text-sm font-bold">
                  الاسم الكامل
                </label>
                <Input
                  id="job-name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="job-email" className="text-sm font-bold">
                    البريد الإلكتروني
                  </label>
                  <Input
                    id="job-email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="job-phone" className="text-sm font-bold">
                    رقم الجوال
                  </label>
                  <Input
                    id="job-phone"
                    type="tel"
                    required
                    minLength={9}
                    maxLength={20}
                    autoComplete="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="job-position" className="text-sm font-bold">
                  الوظيفة المطلوبة <span className="font-normal text-muted-foreground">(اختياري)</span>
                </label>
                <Input
                  id="job-position"
                  maxLength={100}
                  placeholder="مثال: أخصائي مختبر"
                  value={form.position}
                  onChange={(event) => setForm({ ...form, position: event.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="job-message" className="text-sm font-bold">
                  رسالة مختصرة <span className="font-normal text-muted-foreground">(اختياري)</span>
                </label>
                <Textarea
                  id="job-message"
                  maxLength={3000}
                  rows={3}
                  className="resize-none rounded-xl"
                  value={form.coverLetter}
                  onChange={(event) =>
                    setForm({ ...form, coverLetter: event.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-bold">السيرة الذاتية</span>
                <label
                  htmlFor="job-cv"
                  className="flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/[0.035] px-4 py-3 transition hover:border-primary hover:bg-primary/[0.06]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {file ? (
                      <FileCheck2 className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <UploadCloud className="h-6 w-6" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {file?.name || "اختر ملف السيرة الذاتية"}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      PDF أو DOC أو DOCX — بحد أقصى 5 ميجابايت
                    </span>
                  </span>
                </label>
                <input
                  id="job-cv"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                />
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                className="h-12 w-full"
                disabled={createJobApplication.isPending}
              >
                {createJobApplication.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    جارٍ الإرسال
                  </>
                ) : (
                  "إرسال طلب التوظيف"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}