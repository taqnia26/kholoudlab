import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { 
  Activity, Microscope, FileText, HeartPulse, 
  Syringe, ShieldCheck, Clock, ChevronLeft, ChevronRight,
  PhoneCall, CalendarCheck, Search
} from "lucide-react"

const heroSlides = [
  {
    image: "/assets/kholoud-lab-hero.jpg",
    alt: "أخصائية مختبر تعمل على تحليل العينات داخل مختبر حديث",
    eyebrow: "دقة تبدأ من العينة",
    title: "نتائج موثوقة لصحة أكثر اطمئنانًا",
  },
  {
    image: "/assets/kholoud-offer-01.jpg",
    alt: "عرض الفحص الشامل من مختبر خلود",
    eyebrow: "عروض مختبر خلود",
    title: "اختاري الفحص الأنسب لكِ ولعائلتك",
  },
  {
    image: "/assets/kholoud-offer-10.jpg",
    alt: "عرض باقة هرمونات المرأة من مختبر خلود",
    eyebrow: "فحوصات متخصصة",
    title: "رعاية مخبرية تفهم احتياجاتك",
  },
]

const offerImages = Array.from(
  { length: 45 },
  (_, index) => `/assets/kholoud-offer-${String(index + 1).padStart(2, "0")}.jpg`,
)

export default function Home() {
  const [activeTab, setActiveTab] = useState<'book' | 'results'>('book')
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [showAllOffers, setShowAllOffers] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setTimeout(() => {
      setFormState('success')
      setTimeout(() => setFormState('idle'), 3000)
    }, 1500)
  }

  const visibleOffers = showAllOffers ? offerImages : offerImages.slice(0, 8)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] z-0 mix-blend-multiply" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              {/* Hero Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-right reveal-on-scroll">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                  <ShieldCheck className="h-4 w-4" />
                  <span>مختبر معتمد من سباهي (CBAHI)</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.2] mb-6">
                  دقتنا لراحتكم.<br />
                  <span className="text-primary">رعاية مخبرية</span> تثقون بها.
                </h1>
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  في مختبر خلود للتحاليل الطبية، نجمع بين أحدث التقنيات العالمية والخبرات الطبية المتخصصة لنقدم لكم نتائج دقيقة وسريعة تعتمدون عليها لقراراتكم الصحية.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full" onClick={() => {
                    document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })
                    setActiveTab('book')
                  }}>
                    <CalendarCheck className="h-5 w-5" />
                    احجز موعدك الآن
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-full" onClick={() => {
                    document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })
                    setActiveTab('results')
                  }}>
                    <FileText className="h-5 w-5" />
                    استعلام عن النتائج
                  </Button>
                </div>
              </div>

              {/* Hero Slider + Interactive Portal */}
              <div id="portal" className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 reveal-on-scroll" style={{ transitionDelay: '0.2s' }}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/70 bg-primary/10 shadow-2xl shadow-primary/15">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={slide.image}
                      className={`absolute inset-0 transition-opacity duration-700 ${activeHeroSlide === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
                      aria-hidden={activeHeroSlide !== index}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                        <p className="mb-2 text-sm font-bold text-white/80">{slide.eyebrow}</p>
                        <p className="max-w-sm text-xl font-bold leading-tight md:text-2xl">{slide.title}</p>
                      </div>
                    </div>
                  ))}

                  <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm" aria-label="التنقل بين صور السلايدر">
                      {heroSlides.map((slide, index) => (
                        <button
                          key={`${slide.image}-dot`}
                          type="button"
                          aria-label={`عرض الصورة ${index + 1}`}
                          aria-current={activeHeroSlide === index}
                          onClick={() => setActiveHeroSlide(index)}
                          className={`h-2 rounded-full transition-all ${activeHeroSlide === index ? "w-7 bg-white" : "w-2 bg-white/60 hover:bg-white"}`}
                        />
                      ))}
                    </div>
                    <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">مختبر خلود</span>
                  </div>

                  <button
                    type="button"
                    aria-label="الصورة السابقة"
                    onClick={() => setActiveHeroSlide((activeHeroSlide - 1 + heroSlides.length) % heroSlides.length)}
                    className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition-transform hover:scale-105 md:left-5"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="الصورة التالية"
                    onClick={() => setActiveHeroSlide((activeHeroSlide + 1) % heroSlides.length)}
                    className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition-transform hover:scale-105 md:right-5"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <Card id="book" className="relative z-10 mt-6 overflow-hidden border-primary/10 shadow-2xl shadow-primary/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                  <div className="flex bg-muted/30 border-b border-border/50">
                    <button 
                      onClick={() => setActiveTab('book')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'book' ? 'text-primary bg-background border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      حجز موعد
                    </button>
                    <button 
                      id="results"
                      onClick={() => setActiveTab('results')}
                      className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'results' ? 'text-primary bg-background border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      استلام النتائج
                    </button>
                  </div>
                  <CardContent className="p-8">
                    {activeTab === 'book' ? (
                      <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">الاسم الكامل</label>
                          <Input placeholder="أدخل اسمك الكريم" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">رقم الجوال</label>
                          <Input type="tel" dir="rtl" placeholder="05x xxx xxxx" className="font-en text-right" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">نوع الفحص (اختياري)</label>
                          <select className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                            <option>فحص شامل</option>
                            <option>تحاليل دم روتينية</option>
                            <option>فحص فيتامينات</option>
                            <option>غير متأكد</option>
                          </select>
                        </div>
                        <Button type="submit" className="w-full mt-2" disabled={formState !== 'idle'}>
                          {formState === 'idle' && "تأكيد الطلب"}
                          {formState === 'loading' && "جاري الإرسال..."}
                          {formState === 'success' && "تم استلام طلبك بنجاح!"}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleFormSubmit} className="space-y-5">
                        <div className="text-center mb-6">
                          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <Search className="h-8 w-8" />
                          </div>
                          <p className="text-sm text-muted-foreground">أدخل بياناتك للوصول الآمن إلى نتائج تحاليلك الطبية.</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">رقم الهوية / الإقامة</label>
                          <Input type="text" className="font-en text-right" placeholder="10xxxxxxxx" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">رقم الفاتورة أو الملف</label>
                          <Input type="text" className="font-en text-right" placeholder="INV-xxxxx" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={formState !== 'idle'}>
                          {formState === 'idle' && "عرض النتائج"}
                          {formState === 'loading' && "جاري البحث..."}
                          {formState === 'success' && "تم العثور على النتائج"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
              <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-3">تخصصاتنا المخبرية</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">خدمات تشخيصية شاملة</h3>
              <p className="text-muted-foreground">نغطي كافة التخصصات المخبرية الدقيقة لضمان توفير صورة كاملة وواضحة عن حالتك الصحية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: HeartPulse, title: "تحاليل الدم الروتينية", desc: "فحوصات أساسية شاملة للدم، السكر، والكوليسترول للاطمئنان على الصحة العامة." },
                { icon: Activity, title: "تحاليل الهرمونات", desc: "قياس دقيق لمستويات الهرمونات الوظيفية للغدد، الخصوبة، والنمو." },
                { icon: FileText, title: "البيولوجيا الجزيئية (PCR)", desc: "تشخيص متقدم للفيروسات والبكتيريا والأمراض الجينية بدقة متناهية." },
                { icon: Syringe, title: "الفحوصات المناعية", desc: "تقييم كفاءة الجهاز المناعي واختبارات الحساسية والأمراض المناعية الذاتية." },
                { icon: ShieldCheck, title: "الفحوصات الكيميائية الحيوية", desc: "فحص وظائف الكبد، الكلى، والإنزيمات الحيوية في الجسم." },
                { icon: Clock, title: "خدمة السحب المنزلي", desc: "فريق طبي متخصص لزيارتك في المنزل أو العمل لراحتك ووقتك." },
              ].map((service, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 reveal-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="h-14 w-14 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <service.icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-3">{service.title}</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-6">{service.desc}</p>
                  <a href="#book" className="inline-flex items-center gap-2 text-sm font-bold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <span>طلب الخدمة</span>
                    <ChevronLeft className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES SECTION */}
        <section id="packages" className="py-24 bg-primary/5 relative overflow-hidden">
          <div className="absolute -left-40 top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 reveal-on-scroll">
              <div className="max-w-2xl">
                <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-3">عروض الفحوصات</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">باقات مصممة لاحتياجاتك</h3>
              <p className="text-muted-foreground">استعرض أحدث عروض مختبر خلود واختر الفحص الأنسب لك ولعائلتك براحة ووضوح.</p>
              </div>
              <Button variant="outline" className="hidden md:flex mt-6 md:mt-0 rounded-full">
                عرض كافة الباقات
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  image: "/assets/kholoud-packages-1.png",
                  alt: "عروض باقة الفحص الشامل بلس والباقة الفضية وباقة الفحص الشامل من مختبر خلود",
                  label: "عروض الفحص الشامل",
                },
                {
                  image: "/assets/kholoud-packages-2.png",
                  alt: "عروض باقة تساقط الشعر والغدة الدرقية والمعادن والفيتامينات من مختبر خلود",
                  label: "عروض الفحوصات التخصصية",
                },
              ].map((offer, i) => (
                <Card
                  key={offer.image}
                  className="overflow-hidden border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 reveal-on-scroll"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <img
                    src={offer.image}
                    alt={offer.alt}
                    className="block h-auto w-full object-cover"
                  />
                  <CardContent className="flex flex-col items-stretch gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-foreground">{offer.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">العروض والأسعار موضحة في الصورة</p>
                    </div>
                    <Button
                      className="w-full shrink-0 rounded-full sm:w-auto"
                      onClick={() => {
                        document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })
                        setActiveTab('book')
                      }}
                    >
                      احجز الآن
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-8 md:hidden rounded-full">
              عرض كافة الباقات
            </Button>
          </div>
        </section>

        {/* OFFER GALLERY */}
        <section id="gallery" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-start justify-between gap-6 mb-12 md:flex-row md:items-end reveal-on-scroll">
              <div className="max-w-2xl">
                <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-3">من عروضنا</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">اختاري باقتك بكل وضوح</h3>
                <p className="text-muted-foreground">
                  مجموعة من عروض مختبر خلود المصممة لتناسب احتياجاتك الصحية المختلفة، مع تفاصيل الفحوصات والأسعار داخل كل تصميم.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
                {offerImages.length} عرضًا متاحًا
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {visibleOffers.map((image, index) => (
                <Card
                  key={image}
                  className="group overflow-hidden border-border/70 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 reveal-on-scroll"
                  style={{ transitionDelay: `${(index % 8) * 0.05}s` }}
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-secondary/30">
                    <img
                      src={image}
                      alt={`عرض مختبر خلود رقم ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 transition-transform duration-300 group-hover:translate-y-0">
                      <Button
                        size="sm"
                        className="w-full rounded-full bg-white text-primary hover:bg-white/90"
                        onClick={() => {
                          document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })
                          setActiveTab('book')
                        }}
                      >
                        احجز هذه الباقة
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                className="rounded-full px-8"
                onClick={() => setShowAllOffers((current) => !current)}
              >
                {showAllOffers ? "إظهار عروض أقل" : "عرض جميع العروض"}
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section id="about" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="w-full lg:w-1/2 reveal-on-scroll">
                {/* Decorative arrangement */}
                <div className="relative aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] transform rotate-3" />
                  <div className="absolute inset-0 bg-secondary/30 rounded-[2.5rem] transform -rotate-3 transition-transform hover:rotate-0 duration-500" />
                  <div className="absolute inset-4 bg-white rounded-3xl border border-border/50 shadow-xl p-8 flex flex-col items-center justify-center text-center">
                    <img 
                      src="/assets/kholoud-lab-logo.png" 
                      alt="مختبر خلود" 
                      className="w-48 h-auto object-contain mb-8"
                    />
                    <p className="text-xl font-bold text-foreground mb-2">جودة تثق بها</p>
                    <p className="text-sm text-muted-foreground px-4">نلتزم بأعلى معايير الجودة العالمية في مجالات الفحص والتحليل المخبري.</p>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2 reveal-on-scroll">
                <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-3">لماذا مختبر خلود؟</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">رحلة الرعاية تبدأ بتشخيص دقيق</h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  نحن ندرك أن وراء كل عينة إنسان ينتظر إجابات. لذلك، صممنا مختبرنا ليكون بيئة مريحة وموثوقة، تعتمد على تقنيات الذكاء الاصطناعي والميكنة الكاملة لتقليل التدخل البشري وضمان دقة مطلقة في وقت قياسي.
                </p>
                
                <div className="space-y-6">
                  {[
                    { title: "أجهزة متطورة", desc: "أحدث التقنيات الطبية المعتمدة عالمياً لتحليل العينات." },
                    { title: "سرعة في الإنجاز", desc: "معظم النتائج تظهر في نفس اليوم ويمكن الوصول إليها عبر الجوال." },
                    { title: "طاقم طبي محترف", desc: "أخصائيون واستشاريون ذوو خبرة عالية لضمان دقة القراءات." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-primary">
                        <HeartPulse className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div id="accreditation" className="mt-10 flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-bold text-foreground">اعتماد سباهي (CBAHI)</h4>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">معتمد</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      نفخر باعتماد مختبر خلود من المركز السعودي لاعتماد المنشآت الصحية، التزامًا بأعلى معايير الجودة وسلامة المرضى.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-primary/5">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl reveal-on-scroll">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">الأسئلة الشائعة</h2>
              <p className="text-muted-foreground">كل ما تود معرفته عن زيارتك لمختبرنا وإجراء التحاليل.</p>
            </div>

            <Accordion type="single" collapsible className="w-full bg-white rounded-2xl shadow-sm border border-border/50 p-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>هل أحتاج إلى الصيام قبل إجراء التحاليل؟</AccordionTrigger>
                <AccordionContent>
                  تختلف المتطلبات حسب نوع التحليل. فحوصات السكر والدهون الثلاثية تتطلب عادة الصيام لمدة 8-12 ساعة. يُنصح بالاستفسار عن تحاليلك المحددة عند حجز الموعد.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>كيف يمكنني استلام نتائج تحاليلي؟</AccordionTrigger>
                <AccordionContent>
                  نوفر عدة طرق لاستلام النتائج لراحتكم: عبر بوابتنا الإلكترونية (أعلاه) بإدخال رقم الهوية، عبر رسالة واتساب مجرد صدور النتيجة، أو مطبوعة بزيارة فرع المختبر.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>هل يتوفر لديكم خدمة السحب المنزلي؟</AccordionTrigger>
                <AccordionContent>
                  نعم، نوفر خدمة السحب المنزلي بواسطة ممرضين متخصصين. يمكنك حجز الخدمة عبر الموقع أو بالاتصال على رقمنا الموحد، وسيصلك الفريق في الوقت المحدد.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>متى تظهر نتائج التحاليل عادةً؟</AccordionTrigger>
                <AccordionContent>
                  معظم التحاليل الروتينية (مثل صورة الدم والسكر) تظهر نتائجها في نفس اليوم خلال ساعات قليلة. بعض التحاليل التخصصية الدقيقة أو الزراعة قد تستغرق من 3 إلى 5 أيام.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center reveal-on-scroll">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">صحتك هي أولويتنا</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
              لا تؤجل الاطمئنان على صحتك. احجز موعدك اليوم بخطوات بسيطة ودع فريقنا الطبي يعتني بك.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto rounded-full font-bold px-8">
                احجز موعدك الآن
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto rounded-full gap-2">
                <PhoneCall className="h-5 w-5" />
                <span className="font-en" dir="ltr">055 907 0400</span>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
