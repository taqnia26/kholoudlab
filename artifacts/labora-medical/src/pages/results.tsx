import { useState, useEffect } from "react"
import { Link } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ArrowRight, CheckCircle2, FileSearch, LoaderCircle, Search, ShieldCheck, FileText, Calendar, User, Clock, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { homeAnchor } from "@/lib/utils"
import {
  useStartResultVerification,
  useCompleteResultVerification,
  useGetVerifiedResult,
  ResultStatus
} from "@workspace/api-client-react"

const identificationSchema = z.object({
  analysisNumber: z.string().min(4, "رقم التحليل يجب أن يكون 4 أحرف على الأقل"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة (YYYY-MM-DD)"),
  phoneLast4: z.string().regex(/^[0-9]{4}$/, "يجب إدخال آخر 4 أرقام من الجوال فقط"),
})

type IdentificationData = z.infer<typeof identificationSchema>

function formatReportDate(value: string | null): string {
  if (!value) return "غير متوفر"
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value))
}

export default function Results() {
  const [step, setStep] = useState<"identify" | "verify" | "status">("identify")

  // State from steps
  const [challenge, setChallenge] = useState<{ challengeId: string, maskedPhone: string, demoCode: string | null } | null>(null)
  const [completion, setCompletion] = useState<{ status: ResultStatus, accessToken: string | null } | null>(null)

  // API Hooks
  const startVerification = useStartResultVerification()
  const completeVerification = useCompleteResultVerification()

  const { data: verifiedResult, isLoading: isResultLoading, error: resultError } = useGetVerifiedResult({
    request: { headers: completion?.accessToken ? { Authorization: `Bearer ${completion.accessToken}` } : undefined },
    query: {
      enabled: step === "status" && completion?.status === "ready" && !!completion.accessToken,
      queryKey: ["verified-result", completion?.accessToken],
      retry: false
    }
  })

  // Identification Form
  const { register: registerId, handleSubmit: handleIdSubmit, formState: { errors: idErrors } } = useForm<IdentificationData>({
    resolver: zodResolver(identificationSchema),
    defaultValues: { analysisNumber: "", dateOfBirth: "", phoneLast4: "" }
  })

  // Verification Form
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState("")

  const onIdentify = (data: IdentificationData) => {
    startVerification.mutate({ data }, {
      onSuccess: (res) => {
        setChallenge(res)
        setStep("verify")
      }
    })
  }

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge) return
    if (code.length < 4) {
      setCodeError("رمز التحقق غير مكتمل")
      return
    }

    completeVerification.mutate({
      data: { challengeId: challenge.challengeId, code }
    }, {
      onSuccess: (res) => {
        setCompletion(res)
        setStep("status")
      },
      onError: () => {
        setCodeError("رمز التحقق غير صحيح أو منتهي الصلاحية")
      }
    })
  }

  const resetFlow = () => {
    setStep("identify")
    setChallenge(null)
    setCompletion(null)
    setCode("")
    setCodeError("")
    startVerification.reset()
    completeVerification.reset()
  }

  useEffect(() => {
    document.title = "استعلام عن النتائج | مختبر خلود للتحاليل الطبية"
    const description = "تحقق من حالة تقريرك المعتمد في مختبر خلود عبر خطوات آمنة تحافظ على خصوصية بياناتك الطبية."
    const meta = document.querySelector('meta[name="description"]') ?? document.head.appendChild(document.createElement("meta"))
    meta.setAttribute("name", "description")
    meta.setAttribute("content", description)
    return () => {
      document.title = "مختبر خلود للتحاليل الطبية | نتائج موثوقة"
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-primary/5 pb-20 pt-32 lg:pb-28 lg:pt-40 min-h-[85vh] flex flex-col justify-center">
          <div className="absolute -right-40 top-16 h-80 w-80 rounded-full bg-secondary/70 blur-3xl pointer-events-none" />
          <div className="absolute -left-40 bottom-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="container relative z-10 mx-auto px-4 md:px-6 flex-grow flex flex-col justify-center">
            <div className="mx-auto max-w-3xl text-center mb-8">
              <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </Link>
              <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">استعلام عن نتائج التحاليل</h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                منصة آمنة وموثوقة للوصول إلى تقاريرك الطبية المعتمدة.
              </p>
            </div>

            <div className="mx-auto w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {step === "identify" && (
                  <motion.div
                    key="identify"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Card className="overflow-hidden border-primary/10 shadow-2xl shadow-primary/10 bg-card/80 backdrop-blur-sm">
                      <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
                      <CardContent className="p-6 sm:p-9">
                        <div className="mb-8 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileSearch className="h-8 w-8" />
                          </div>
                          <h2 className="text-2xl font-bold text-foreground">بيانات الملف الطبي</h2>
                          <p className="mt-2 text-sm text-muted-foreground">يرجى إدخال البيانات التالية للتحقق من هويتك بأمان.</p>
                        </div>

                        {startVerification.error && (
                          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                              <p className="font-bold">عذراً، لم نتمكن من التحقق</p>
                              <p className="mt-1 leading-relaxed">تأكد من صحة البيانات المدخلة أو تواصل مع المختبر.</p>
                            </div>
                          </div>
                        )}

                        <form onSubmit={handleIdSubmit(onIdentify)} className="space-y-5" noValidate>
                          <div className="space-y-2">
                            <label htmlFor="analysisNumber" className="text-sm font-bold text-foreground">رقم التحليل أو الملف</label>
                            <Input
                              id="analysisNumber"
                              {...registerId("analysisNumber")}
                              className="h-12 font-en text-right"
                              dir="ltr"
                              placeholder="مثال: KL-2026-0001"
                              aria-invalid={Boolean(idErrors.analysisNumber)}
                            />
                            {idErrors.analysisNumber && (
                              <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {idErrors.analysisNumber.message}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <label htmlFor="dateOfBirth" className="text-sm font-bold text-foreground">تاريخ الميلاد</label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                {...registerId("dateOfBirth")}
                                className="h-12 font-en text-right"
                                dir="rtl"
                                aria-invalid={Boolean(idErrors.dateOfBirth)}
                              />
                              {idErrors.dateOfBirth && (
                                <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                  {idErrors.dateOfBirth.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="phoneLast4" className="text-sm font-bold text-foreground">آخر 4 أرقام من الجوال</label>
                              <Input
                                id="phoneLast4"
                                maxLength={4}
                                {...registerId("phoneLast4")}
                                className="h-12 font-en text-center text-lg tracking-widest"
                                dir="ltr"
                                placeholder="0000"
                                aria-invalid={Boolean(idErrors.phoneLast4)}
                              />
                              {idErrors.phoneLast4 && (
                                <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                  {idErrors.phoneLast4.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button type="submit" className="h-12 w-full rounded-xl mt-4" disabled={startVerification.isPending}>
                            {startVerification.isPending ? (
                              <>
                                <LoaderCircle className="h-5 w-5 animate-spin ml-2" />
                                جاري التحقق...
                              </>
                            ) : (
                              <>
                                متابعة
                                <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === "verify" && challenge && (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Card className="overflow-hidden border-primary/10 shadow-2xl shadow-primary/10 bg-card/80 backdrop-blur-sm">
                      <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
                      <CardContent className="p-6 sm:p-9">
                        <div className="mb-8 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ShieldCheck className="h-8 w-8" />
                          </div>
                          <h2 className="text-2xl font-bold text-foreground">رمز التحقق الآمن</h2>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            استخدم رمز الوصول المرفق بإيصالك لإكمال التحقق الآمن من تقريرك.
                            {challenge.demoCode && (
                              <span className="block mt-2 text-xs bg-primary/10 text-primary p-2 rounded-lg">بيئة العرض فقط: رمز التجربة هو {challenge.demoCode}</span>
                            )}
                          </p>
                        </div>

                        <form onSubmit={onVerify} className="space-y-6">
                          <div className="space-y-2 flex flex-col items-center">
                                <label htmlFor="verificationCode" className="text-sm font-bold text-foreground">أدخل رمز الوصول المكوّن من 4 إلى 8 أرقام</label>
                            <Input
                              id="verificationCode"
                              value={code}
                              onChange={(e) => {
                                setCode(e.target.value)
                                if (codeError) setCodeError("")
                              }}
                              className="h-14 font-en text-center text-2xl tracking-[0.3em] max-w-[200px]"
                              dir="ltr"
                              maxLength={8}
                              placeholder="••••"
                              aria-invalid={Boolean(codeError)}
                            />
                            {codeError && (
                              <p className="flex items-center gap-2 text-sm text-destructive mt-2" role="alert">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {codeError}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            <Button type="submit" className="h-12 w-full rounded-xl" disabled={completeVerification.isPending}>
                              {completeVerification.isPending ? (
                                <>
                                  <LoaderCircle className="h-5 w-5 animate-spin ml-2" />
                                  جاري التأكيد...
                                </>
                              ) : (
                                "تأكيد وعرض النتيجة"
                              )}
                            </Button>
                            <Button type="button" variant="ghost" className="h-12 w-full rounded-xl" onClick={resetFlow}>
                              العودة وتعديل البيانات
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === "status" && completion && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {completion.status === "pending" && (
                      <Card className="overflow-hidden border-amber-200 shadow-xl bg-card">
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />
                        <CardContent className="p-8 text-center">
                          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Clock className="h-10 w-10" />
                          </div>
                          <h2 className="mb-3 text-3xl font-bold text-foreground">النتيجة قيد الإجراء</h2>
                          <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground mb-8">
                            تحاليلك قيد الفحص حالياً في المختبر. سنقوم بإشعارك فور اعتماد النتائج.
                          </p>
                          <Button variant="outline" className="h-12 px-8 rounded-xl" onClick={resetFlow}>بحث برقم آخر</Button>
                        </CardContent>
                      </Card>
                    )}

                    {completion.status === "unavailable" && (
                      <Card className="overflow-hidden border-destructive/20 shadow-xl bg-card">
                        <div className="h-1 bg-gradient-to-r from-destructive to-destructive/60" />
                        <CardContent className="p-8 text-center">
                          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-10 w-10" />
                          </div>
                          <h2 className="mb-3 text-3xl font-bold text-foreground">النتيجة غير متوفرة</h2>
                          <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground mb-8">
                            لم نتمكن من العثور على تقرير معتمد لهذا الملف. يرجى مراجعة المختبر أو التأكد من الرقم.
                          </p>
                          <Button variant="outline" className="h-12 px-8 rounded-xl" onClick={resetFlow}>رجوع للبحث</Button>
                        </CardContent>
                      </Card>
                    )}

                    {completion.status === "ready" && (
                      <>
                        {isResultLoading ? (
                          <Card className="overflow-hidden border-primary/10 shadow-xl bg-card">
                            <CardContent className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                              <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
                              <p className="text-lg text-muted-foreground font-medium">جاري تحميل التقرير الطبي المعتمد...</p>
                            </CardContent>
                          </Card>
                        ) : resultError ? (
                          <Card className="overflow-hidden border-destructive/20 shadow-xl bg-card">
                            <CardContent className="p-8 text-center">
                              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                              <p className="text-lg font-bold text-foreground">تعذر تحميل التقرير</p>
                              <Button variant="outline" className="mt-6 h-12 px-8 rounded-xl" onClick={resetFlow}>إعادة المحاولة</Button>
                            </CardContent>
                          </Card>
                        ) : verifiedResult ? (
                          <Card className="overflow-hidden border-primary/20 shadow-2xl bg-card">
                            <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-secondary" />
                            <CardContent className="p-0">
                              {/* Report Header */}
                              <div className="bg-primary/5 p-6 sm:p-8 border-b border-primary/10">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                      <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <h2 className="text-xl font-bold text-foreground">تقرير معتمد</h2>
                                      <p className="text-sm text-emerald-700 font-medium">جاهز للمراجعة</p>
                                    </div>
                                  </div>
                                  <Button variant="outline" className="rounded-xl h-10 px-6 gap-2" onClick={resetFlow}>
                                    <Search className="h-4 w-4" />
                                    بحث جديد
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-primary/5">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><User className="h-3.5 w-3.5"/> اسم المراجع</p>
                                    <p className="font-bold text-foreground">{verifiedResult.patientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5"/> رقم التحليل</p>
                                    <p className="font-bold text-foreground font-en" dir="ltr">{verifiedResult.analysisNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> تاريخ العينة</p>
                                    <p className="font-bold text-foreground">{formatReportDate(verifiedResult.sampleDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> تاريخ الاعتماد</p>
                                    <p className="font-bold text-foreground">{formatReportDate(verifiedResult.approvedAt)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Results Table */}
                              <div className="p-6 sm:p-8">
                                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                  <Info className="h-5 w-5 text-primary" />
                                  تفاصيل الفحوصات
                               </h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-right">
                                    <thead className="bg-primary/5 text-primary">
                                      <tr>
                                        <th className="px-4 py-3 font-bold rounded-r-xl">اسم الفحص</th>
                                        <th className="px-4 py-3 font-bold text-center">النتيجة</th>
                                        <th className="px-4 py-3 font-bold text-center">الوحدة</th>
                                        <th className="px-4 py-3 font-bold text-left rounded-l-xl">المعدل الطبيعي</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                      {verifiedResult.results.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                          <td className="px-4 py-4 font-bold text-foreground font-en" dir="ltr">{res.name}</td>
                                          <td className="px-4 py-4 font-en text-center text-lg font-bold text-primary" dir="ltr">{res.value}</td>
                                          <td className="px-4 py-4 font-en text-center text-muted-foreground" dir="ltr">{res.unit}</td>
                                          <td className="px-4 py-4 font-en text-left text-muted-foreground" dir="ltr">{res.referenceRange}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {verifiedResult.results.length === 0 && (
                                  <div className="text-center py-10 text-muted-foreground">
                                    لا توجد تفاصيل للفحوصات في هذا التقرير.
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mx-auto mt-10 flex max-w-2xl items-start gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="leading-relaxed">نحافظ على خصوصية بياناتك. يتم تشفير جميع الاتصالات وعرض النتائج للمريض المعتمد فقط.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
