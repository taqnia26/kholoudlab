import { FormEvent, useEffect, useState } from "react"
import { Link } from "wouter"
import { AlertCircle, ArrowRight, CheckCircle2, FileSearch, LoaderCircle, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { homeAnchor } from "@/lib/utils"

type SearchState = "idle" | "loading" | "success" | "not-found"

export default function Results() {
  const [analysisNumber, setAnalysisNumber] = useState("")
  const [searchState, setSearchState] = useState<SearchState>("idle")
  const [inputError, setInputError] = useState("")

  useEffect(() => {
    document.title = "استعلام عن النتائج | مختبر خلود للتحاليل الطبية"
    const description = "استعلم عن حالة نتيجة تحاليلك في مختبر خلود باستخدام رقم التحليل أو الملف، مع تجربة بحث واضحة وآمنة."
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement("meta")
      tag.setAttribute("name", "description")
      document.head.appendChild(tag)
    }
    tag.setAttribute("content", description)
    return () => {
      document.title = "مختبر خلود للتحاليل الطبية | نتائج موثوقة"
    }
  }, [])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = analysisNumber.trim()
    if (value.length < 4) {
      setInputError("يرجى إدخال رقم تحليل أو ملف مكوّن من 4 خانات على الأقل.")
      setSearchState("idle")
      return
    }

    setInputError("")
    setSearchState("loading")
    window.setTimeout(() => {
      setSearchState(value.toUpperCase() === "KL-DEMO-2026" ? "success" : "not-found")
    }, 900)
  }

  const resetSearch = () => {
    setAnalysisNumber("")
    setInputError("")
    setSearchState("idle")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-primary/5 pb-20 pt-32 lg:pb-28 lg:pt-40">
          <div className="absolute -right-40 top-16 h-80 w-80 rounded-full bg-secondary/70 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </Link>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">بوابة النتائج</p>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-foreground md:text-5xl">استعلام عن نتائج التحاليل</h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                أدخل رقم التحليل أو الملف للوصول إلى حالة طلبك. ستُعرض النتائج الطبية من خلال النظام المعتمد بعد ربط هذه الصفحة بلوحة التحكم.
              </p>
            </div>

            <Card className="mx-auto mt-12 max-w-2xl overflow-hidden border-primary/10 shadow-2xl shadow-primary/10">
              <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
              <CardContent className="p-6 sm:p-9">
                {searchState === "success" ? (
                  <div className="text-center" role="status">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="mb-2 text-sm font-bold text-emerald-700">تم العثور على الملف</p>
                    <h2 className="mb-3 text-2xl font-bold text-foreground">النتيجة جاهزة للمراجعة</h2>
                    <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                      هذه حالة تجريبية للتأكد من تدفق البحث. ستظهر تفاصيل التقرير من لوحة التحكم عند تفعيل الربط مستقبلاً.
                    </p>
                    <div className="mx-auto mt-6 flex max-w-sm items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">رقم الملف</span>
                      <span className="font-en font-bold text-primary" dir="ltr">{analysisNumber.trim().toUpperCase()}</span>
                    </div>
                    <Button variant="outline" className="mt-7 rounded-full" onClick={resetSearch}>بحث برقم آخر</Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {searchState === "loading" ? <LoaderCircle className="h-8 w-8 animate-spin" /> : <FileSearch className="h-8 w-8" />}
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">ابحث عن حالة طلبك</h2>
                      <p className="mt-2 text-sm text-muted-foreground">استخدم رقم التحليل أو رقم الملف كما يظهر في إيصال الزيارة.</p>
                    </div>
                    <form onSubmit={handleSearch} className="space-y-5" noValidate>
                      <div className="space-y-2">
                        <label htmlFor="analysis-number" className="text-sm font-bold text-foreground">رقم التحليل / الملف</label>
                        <Input
                          id="analysis-number"
                          value={analysisNumber}
                          onChange={(event) => {
                            setAnalysisNumber(event.target.value)
                            if (inputError) setInputError("")
                            if (searchState === "not-found") setSearchState("idle")
                          }}
                          className="h-12 font-en text-right"
                          dir="ltr"
                          placeholder="مثال: KL-2026-0001"
                          aria-invalid={Boolean(inputError)}
                          aria-describedby={inputError ? "analysis-error" : "analysis-help"}
                        />
                        {inputError ? (
                          <p id="analysis-error" className="flex items-center gap-2 text-sm text-destructive" role="alert">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {inputError}
                          </p>
                        ) : (
                          <p id="analysis-help" className="text-xs text-muted-foreground">للتجربة: استخدم KL-DEMO-2026 لمشاهدة حالة العثور على الملف.</p>
                        )}
                      </div>
                      {searchState === "not-found" && (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                          <div>
                            <p className="font-bold">لم نعثر على نتيجة بهذا الرقم</p>
                            <p className="mt-1 leading-relaxed">تأكد من الرقم المدخل أو تواصل مع المختبر عبر الرقم 055 907 0400 للمساعدة.</p>
                          </div>
                        </div>
                      )}
                      <Button type="submit" className="h-12 w-full rounded-xl" disabled={searchState === "loading"}>
                        {searchState === "loading" ? (
                          <>
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            جاري البحث...
                          </>
                        ) : (
                          <>
                            <Search className="h-5 w-5" />
                            بحث عن النتيجة
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="leading-relaxed">نحافظ على خصوصية بياناتك. لا يتم حفظ أرقام البحث في هذه النسخة التجريبية، وسيتم ربط الوصول الآمن بالنظام المعتمد لاحقًا.</p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center md:px-6">
            <h2 className="mb-3 text-2xl font-bold text-foreground">هل تحتاج إلى إجراء تحليل جديد؟</h2>
            <p className="mb-6 text-muted-foreground">يسعد فريق مختبر خلود بخدمتك في الفرع أو عبر خدمة السحب المنزلي.</p>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={homeAnchor("book")}>احجز موعدك الآن</a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}