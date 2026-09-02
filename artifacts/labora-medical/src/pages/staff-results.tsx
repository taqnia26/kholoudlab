import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Shield, Lock, LayoutDashboard, Search, LogOut, CheckCircle2, Clock, AlertCircle, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useCreateStaffSession,
  useListStaffResults,
  useUpdateResultStatus,
  getListStaffResultsQueryKey,
  type ResultStatus,
  type StaffResult
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"

const loginSchema = z.object({
  staffId: z.string().min(2, "يرجى إدخال معرّف الموظف"),
  accessCode: z.string().min(6, "رمز الدخول يجب أن يكون 6 أحرف على الأقل"),
})

type LoginData = z.infer<typeof loginSchema>

function formatStaffDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat("ar-SA", includeTime
    ? { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric" }
    : { year: "numeric", month: "short", day: "numeric" },
  ).format(new Date(value))
}

export default function StaffResults() {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  
  // Try to load token from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem("kholoud_staff_token")
    if (token) setSessionToken(token)
  }, [])

  const handleSetSession = (token: string) => {
    sessionStorage.setItem("kholoud_staff_token", token)
    setSessionToken(token)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("kholoud_staff_token")
    setSessionToken(null)
  }

  useEffect(() => {
    document.title = "بوابة الموظفين | مختبر خلود"
    const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"))
    robots.setAttribute("name", "robots")
    robots.setAttribute("content", "noindex, nofollow")
    return () => {
      document.title = "مختبر خلود للتحاليل الطبية | فحوصات وحجز موعد"
      robots.setAttribute("content", "index, follow")
    }
  }, [])

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col font-sans" dir="rtl">
      {/* Simple Staff Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <h1 className="text-xl font-bold">بوابة موظفي المختبر</h1>
        </div>
        {sessionToken && (
          <Button variant="secondary" size="sm" onClick={handleLogout} className="rounded-xl gap-2 font-bold hover:bg-white hover:text-primary">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </Button>
        )}
      </header>

      <main className="flex-grow flex flex-col p-4 md:p-8 relative">
        {!sessionToken ? (
          <StaffLogin onLogin={handleSetSession} />
        ) : (
          <StaffDashboard sessionToken={sessionToken} onLogout={handleLogout} />
        )}
      </main>
    </div>
  )
}

function StaffLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const createSession = useCreateStaffSession()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginData) => {
    createSession.mutate({ data }, {
      onSuccess: (res) => {
        onLogin(res.sessionToken)
      }
    })
  }

  return (
    <div className="flex-grow flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl border-primary/10 overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">تسجيل الدخول للموظفين</CardTitle>
          <CardDescription className="text-base mt-2">
            يرجى إدخال رمز الوصول الخاص بك لإدارة نتائج التحاليل
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {createSession.error && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-bold">رمز الدخول غير صحيح. حاول مرة أخرى.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="staffId" className="text-sm font-bold text-foreground">معرّف الموظف</label>
              <Input
                id="staffId"
                autoComplete="username"
                {...register("staffId")}
                className="h-12 font-en text-center"
                dir="ltr"
                placeholder="مثال: lab-demo"
                aria-invalid={Boolean(errors.staffId)}
              />
              {errors.staffId && (
                <p className="text-sm text-destructive">{errors.staffId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-bold text-foreground">رمز الوصول</label>
              <Input
                id="accessCode"
                type="password"
                  autoComplete="current-password"
                {...register("accessCode")}
                className="h-14 font-en text-center text-2xl tracking-widest bg-muted/50"
                dir="ltr"
                placeholder="••••••"
                aria-invalid={Boolean(errors.accessCode)}
              />
              {errors.accessCode && (
                <p className="text-sm text-destructive">{errors.accessCode.message}</p>
              )}
            </div>

            <Button type="submit" className="h-14 w-full rounded-xl text-lg font-bold" disabled={createSession.isPending}>
              {createSession.isPending ? (
                <LoaderCircle className="h-6 w-6 animate-spin" />
              ) : (
                "دخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function StaffDashboard({ sessionToken, onLogout }: { sessionToken: string, onLogout: () => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  
  const { data: results, isLoading, isError, error } = useListStaffResults({
    request: { headers: { Authorization: `Bearer ${sessionToken}` } },
    query: {
      queryKey: getListStaffResultsQueryKey(),
      retry: false,
    }
  })

  // Handle unauthorized gracefully by auto-logout
  useEffect(() => {
    if (isError && typeof error === "object" && error !== null && "status" in error && error.status === 401) {
      onLogout()
    }
  }, [isError, error, onLogout])

  const filteredResults = results?.filter(r => 
    r.analysisNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            إدارة نتائج التحاليل
          </h2>
          <p className="text-muted-foreground mt-2">تحديث حالة تقارير المرضى وتوافرها للمراجعة.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="بحث بالرقم أو الاسم..." 
            className="pl-4 pr-10 h-12 rounded-xl border-primary/20 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden bg-card/90 backdrop-blur-sm">
        <div className="overflow-x-auto min-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
              <p>جاري جلب قائمة النتائج...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
              <AlertCircle className="h-10 w-10 mb-4" />
              <p>حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg">لا توجد نتائج تطابق بحثك</p>
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-primary/5 text-primary border-b border-primary/10">
                <tr>
                  <th className="px-6 py-5 font-bold">رقم التحليل</th>
                  <th className="px-6 py-5 font-bold">اسم المريض</th>
                  <th className="px-6 py-5 font-bold">تاريخ العينة</th>
                  <th className="px-6 py-5 font-bold">آخر تحديث</th>
                  <th className="px-6 py-5 font-bold">الحالة</th>
                  <th className="px-6 py-5 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredResults.map(result => (
                  <ResultRow key={result.id} result={result} sessionToken={sessionToken} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

function ResultRow({ result, sessionToken }: { result: StaffResult, sessionToken: string }) {
  const queryClient = useQueryClient()
  const updateStatus = useUpdateResultStatus({
    request: { headers: { Authorization: `Bearer ${sessionToken}` } }
  })
  
  // Local state for optimistic update feeling in select
  const [status, setStatus] = useState<ResultStatus>(result.status)

  const handleStatusChange = (newStatus: ResultStatus) => {
    setStatus(newStatus)
    updateStatus.mutate(
      { id: result.id, data: { status: newStatus } },
      {
        onSuccess: (updatedData) => {
          // Patch cache
          queryClient.setQueryData(getListStaffResultsQueryKey(), (old: StaffResult[] | undefined) => {
            if (!old) return old;
            return old.map(r => r.id === result.id ? { ...r, status: newStatus, updatedAt: updatedData.updatedAt } : r);
          });
        },
        onError: () => {
          // Revert on error
          setStatus(result.status)
        }
      }
    )
  }

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4 font-bold font-en text-primary" dir="ltr">{result.analysisNumber}</td>
      <td className="px-6 py-4 font-bold text-foreground">{result.patientName}</td>
      <td className="px-6 py-4 text-muted-foreground">{formatStaffDate(result.sampleDate)}</td>
      <td className="px-6 py-4 text-muted-foreground text-xs">{formatStaffDate(result.updatedAt, true)}</td>
      <td className="px-6 py-4">
        <StatusBadge status={status} />
      </td>
      <td className="px-6 py-4 text-center">
        <Select value={status} onValueChange={(val) => handleStatusChange(val as ResultStatus)} disabled={updateStatus.isPending}>
          <SelectTrigger className="w-[140px] h-10 mx-auto rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="flex items-center gap-2">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> قيد الإجراء</span>
            </SelectItem>
            <SelectItem value="ready" className="flex items-center gap-2" disabled={!result.canMarkReady}>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> جاهزة</span>
            </SelectItem>
            <SelectItem value="unavailable" className="flex items-center gap-2">
              <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> غير متوفرة</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: ResultStatus }) {
  switch (status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> جاهزة
        </span>
      )
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
          <Clock className="h-3.5 w-3.5" /> قيد الإجراء
        </span>
      )
    case 'unavailable':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
          <AlertCircle className="h-3.5 w-3.5" /> غير متوفرة
        </span>
      )
    default:
      return null
  }
}
