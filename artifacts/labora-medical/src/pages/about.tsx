import { useEffect } from "react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { homeAnchor } from "@/lib/utils"
import { usePageSeo } from "@/lib/site-content"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Microscope,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

const values = [
  {
    icon: ShieldCheck,
    title: "جودة يمكن الوثوق بها",
    description: "نطبق إجراءات دقيقة في كل مرحلة من استقبال العينة حتى مراجعة النتيجة وتسليمها.",
  },
  {
    icon: Microscope,
    title: "تقنية متقدمة",
    description: "نستخدم أجهزة مخبرية حديثة وأنظمة ميكنة تساعد على رفع الدقة وتقليل وقت الانتظار.",
  },
  {
    icon: HeartPulse,
    title: "رعاية إنسانية",
    description: "نضع راحة المراجع ووضوح تجربته في مقدمة اهتمامنا، من الحجز وحتى استلام النتيجة.",
  },
]

const services = [
  "تحاليل الدم الروتينية والكيمياء الحيوية",
  "تحاليل الهرمونات والفيتامينات",
  "الفحوصات المناعية والحساسية",
  "البيولوجيا الجزيئية وفحوصات PCR",
  "خدمة السحب المنزلي",
]

export default function About() {
  useEffect(() => {
    document.title = "من نحن | مختبر خلود للتحاليل الطبية"
    const description = "تعرّف على مختبر خلود للتحاليل الطبية، رؤيتنا في التشخيص الدقيق، وقيم الجودة والرعاية، واعتمادنا من سباهي."
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement("meta")
      tag.setAttribute("name", "description")
      document.head.appendChild(tag)
    }
    tag.setAttribute("content", description)
    return () => {
      document.title = "مختبر خلود للتحاليل الطبية | فحوصات وحجز موعد"
    }
  }, [])
  usePageSeo("about", "من نحن | مختبر خلود للتحاليل الطبية")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-primary/5 pb-20 pt-32 lg:pb-28 lg:pt-40">
          <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-2xl">
                <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80">
                  <ArrowRight className="h-4 w-4" />
                  العودة للرئيسية
                </Link>
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">من نحن</p>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  تشخيص أدق، واطمئنان يبدأ من مختبر خلود
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  في مختبر خلود للتحاليل الطبية نؤمن أن كل عينة تحمل سؤالًا مهمًا. لذلك نعمل بخبرة طبية وتقنيات متقدمة لنقدم نتائج دقيقة، واضحة، وفي الوقت الذي تحتاجه.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button className="rounded-full" asChild>
                    <a href={homeAnchor("book")}>احجز موعدك الآن</a>
                  </Button>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-[2rem] bg-secondary/70" />
                <div className="relative rounded-[2rem] border border-primary/10 bg-white p-8 shadow-2xl shadow-primary/10">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">منذ البداية، الدقة أولًا</span>
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <img src="/assets/kholoud-lab-logo.png" alt="شعار مختبر خلود للتحاليل الطبية" className="mx-auto mb-8 h-auto w-56 object-contain" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-primary/5 p-4 text-center">
                      <p className="text-2xl font-bold text-primary">24/7</p>
                      <p className="mt-1 text-xs text-muted-foreground">اهتمام مستمر</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                      <p className="text-2xl font-bold text-primary">دقة</p>
                      <p className="mt-1 text-xs text-muted-foreground">في كل عينة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">ما يميزنا</p>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">معايير نلتزم بها في كل زيارة</h2>
              <p className="leading-relaxed text-muted-foreground">نحوّل الخبرة المخبرية إلى تجربة أسهل وأكثر طمأنينة، مع التزام واضح بالجودة وسلامة المرضى.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {values.map((value) => (
                <Card key={value.title} className="border-border/70 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                  <CardContent className="p-7">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <value.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{value.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary/5 py-20 lg:py-24">
          <div className="container mx-auto grid gap-12 px-4 md:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">رسالتنا</p>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground md:text-4xl">نضع المعلومة الصحيحة في المكان الصحيح</h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                نعمل على أن تكون رحلة التحليل واضحة ومريحة لكل فرد وعائلة. يبدأ ذلك من استقبال لطيف، ويمتد إلى إجراءات دقيقة، وينتهي بمعلومة موثوقة تساعد الطبيب والمراجع على اتخاذ الخطوة المناسبة.
              </p>
              <div className="space-y-4">
                {[
                  "مراجعة دقيقة لمراحل التعامل مع العينات",
                  "فريق مؤهل يضع سلامة المراجع في الأولوية",
                  "قنوات سهلة للحجز واستلام النتائج",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-primary/15 bg-white p-7 shadow-xl shadow-primary/5">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">اعتماد سباهي</p>
                  <h3 className="text-xl font-bold text-foreground">التزام بمعايير الجودة</h3>
                </div>
              </div>
              <img src="/assets/cbahi-logo.jpg" alt="شعار اعتماد سباهي CBAHI" className="mb-6 h-28 w-full rounded-2xl bg-white object-contain p-3" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                نفخر باعتماد مختبر خلود من المركز السعودي لاعتماد المنشآت الصحية (CBAHI)، بما يعكس التزامنا المستمر بمعايير الجودة وسلامة المرضى.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Activity className="h-7 w-7" />
                </div>
                <h2 className="mb-5 text-3xl font-bold text-foreground md:text-4xl">خدمات مخبرية شاملة</h2>
                <p className="leading-relaxed text-muted-foreground">
                  نغطي مجموعة واسعة من الفحوصات الأساسية والتخصصية، مع توفير خدمة السحب المنزلي لتكون الرعاية أقرب إليك.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <div key={service} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm font-medium text-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center md:px-6">
            <Users className="mx-auto mb-5 h-9 w-9 text-white/90" />
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">نحن هنا لراحتك</h2>
            <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-white/80">ابدأ زيارتك القادمة بخطوة بسيطة، واحجز موعدك مع فريق مختبر خلود.</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="rounded-full bg-white px-7 font-bold text-primary hover:bg-white/90" asChild>
                <a href={homeAnchor("book")}>احجز موعدك الآن</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}