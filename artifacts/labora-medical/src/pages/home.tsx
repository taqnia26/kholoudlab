import { useState, useEffect } from "react"
import { Link } from "wouter"
import { homeAnchor } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useQuery } from "@tanstack/react-query"
import { useCreateBooking } from "@workspace/api-client-react"
import { 
  Activity, Microscope, FileText, HeartPulse, 
  Syringe, ShieldCheck, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  PhoneCall, CalendarCheck, Pause, Play
} from "lucide-react"

const offerImages = Array.from(
  { length: 45 },
  (_, index) => `/assets/kholoud-offer-${String(index + 1).padStart(2, "0")}.jpg`,
)

const nationalDayOfferImages = Array.from(
  { length: 17 },
  (_, index) =>
    `/assets/white-friday/kholoud-white-friday-${String(index + 1).padStart(2, "0")}.webp`,
)

type PublicSlide = { id: number; title: string; url: string }

export default function Home() {
  // Slides managed from /admin; falls back to the static posters when none exist or the API is unreachable.
  const { data: managedSlides } = useQuery({
    queryKey: ["public-slides"],
    queryFn: async (): Promise<PublicSlide[]> => {
      const response = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/slides`)
      if (!response.ok) throw new Error("slides unavailable")
      return response.json()
    },
    staleTime: 60_000,
    retry: 1,
  })
  const heroImages =
    managedSlides && managedSlides.length > 0 ? managedSlides.map((slide) => slide.url) : nationalDayOfferImages

  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    testType: "فحص شامل",
    website: "",
  })
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [activeNationalDayOffer, setActiveNationalDayOffer] = useState(0)
  const [nationalDaySlideDirection, setNationalDaySlideDirection] = useState(1)
  const [isHeroAutoPlayPaused, setIsHeroAutoPlayPaused] = useState(false)
  const [isHeroInteractionPaused, setIsHeroInteractionPaused] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const createBooking = useCreateBooking()

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

  const heroSlideCount = heroImages.length

  // Start from the first slide whenever the slide set changes (static -> managed).
  useEffect(() => {
    setActiveNationalDayOffer(0)
  }, [heroSlideCount])

  useEffect(() => {
    if (
      isHeroAutoPlayPaused ||
      isHeroInteractionPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return

    const timer = window.setInterval(() => {
      setNationalDaySlideDirection(1)
      setActiveNationalDayOffer((current) => (current + 1) % heroImages.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [isHeroAutoPlayPaused, isHeroInteractionPaused, heroSlideCount])

  useEffect(() => {
    const adjacentOffers = [
      (activeNationalDayOffer + 1) % heroImages.length,
      (activeNationalDayOffer - 1 + heroImages.length) %
        heroImages.length,
    ]

    adjacentOffers.forEach((index) => {
      const image = new Image()
      image.src = heroImages[index]
    })
  }, [activeNationalDayOffer, heroSlideCount])

  useEffect(() => {
    let delayedScroll: number | undefined

    const scrollToAnchor = () => {
      const targetId = decodeURIComponent(window.location.hash.replace(/^#/, ""))
      if (!targetId) return

      const scroll = () => {
        const target = document.getElementById(targetId)
        if (!target) return

        const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 96
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16
        window.scrollTo(0, Math.max(0, targetTop))
      }

      window.requestAnimationFrame(scroll)
      delayedScroll = window.setTimeout(scroll, 100)
    }

    scrollToAnchor()
    window.addEventListener("hashchange", scrollToAnchor)

    return () => {
      window.removeEventListener("hashchange", scrollToAnchor)
      if (delayedScroll) window.clearTimeout(delayedScroll)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormMessage(null)

    try {
      const response = await createBooking.mutateAsync({ data: bookingForm })
      setFormMessage({ type: "success", text: response.message })
      setBookingForm({
        name: "",
        phone: "",
        testType: "فحص شامل",
        website: "",
      })
    } catch {
      setFormMessage({
        type: "error",
        text: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى أو التواصل معنا هاتفيًا.",
      })
    }
  }

  const visibleOffers = offerImages.slice(0, 8)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="fixed bottom-5 right-4 z-40 hidden flex-col gap-2 rounded-full border border-primary/15 bg-white/90 p-1.5 shadow-lg shadow-primary/10 backdrop-blur-md lg:flex">
        <button
          type="button"
          aria-label="الصعود إلى أعلى الصفحة"
          disabled={scrollPosition <= 80}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="النزول إلى أسفل الصفحة"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

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
                  }}>
                    <CalendarCheck className="h-5 w-5" />
                    احجز موعدك الآن
                  </Button>
                </div>
              </div>

              {/* Hero Slider + Interactive Portal */}
              <div id="portal" className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 reveal-on-scroll" style={{ transitionDelay: '0.2s' }}>
                <div
                  className="hero-slider-frame relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/70 bg-[#2a0620] shadow-2xl shadow-primary/15"
                  role="region"
                  aria-roledescription="سلايدر"
                  aria-label="عروض الجمعة البيضاء من مختبر خلود"
                  onMouseEnter={() => setIsHeroInteractionPaused(true)}
                  onMouseLeave={() => setIsHeroInteractionPaused(false)}
                  onFocus={() => setIsHeroInteractionPaused(true)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsHeroInteractionPaused(false)
                    }
                  }}
                >
                  <div className="hero-slider-glow pointer-events-none absolute -inset-8 z-10 rounded-[2.5rem] border border-white/40" />
                  <a
                    key={heroImages[activeNationalDayOffer]}
                    href={heroImages[activeNationalDayOffer]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`عرض الجمعة البيضاء رقم ${activeNationalDayOffer + 1} بالحجم الكامل`}
                    className={`national-day-slide absolute inset-0 flex items-center justify-center p-1.5 opacity-100 sm:p-3 ${
                      nationalDaySlideDirection > 0
                        ? "national-day-slide-from-left"
                        : "national-day-slide-from-right"
                    }`}
                  >
                    <img
                      src={heroImages[activeNationalDayOffer]}
                      alt={`عرض الجمعة البيضاء من مختبر خلود رقم ${activeNationalDayOffer + 1}`}
                      width="720"
                      height="1280"
                      fetchPriority={activeNationalDayOffer === 0 ? "high" : "auto"}
                      className="h-full w-full object-contain"
                    />
                  </a>

                  <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
                    <div className="flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-2 backdrop-blur-sm" aria-label="التنقل بين عروض الجمعة البيضاء">
                      {heroImages.map((image, index) => (
                        <button
                          key={`${image}-dot`}
                          type="button"
                          aria-label={`عرض الجمعة البيضاء رقم ${index + 1}`}
                          aria-current={activeNationalDayOffer === index ? "true" : undefined}
                          onClick={() => {
                            setNationalDaySlideDirection(index >= activeNationalDayOffer ? 1 : -1)
                            setActiveNationalDayOffer(index)
                          }}
                          className={`h-2 rounded-full transition-all ${activeNationalDayOffer === index ? "w-6 bg-white" : "w-2 bg-white/65 hover:bg-white"}`}
                        />
                      ))}
                    </div>
                    <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
                      عروض الجمعة البيضاء
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label="العرض التالي"
                    onClick={() => {
                      setNationalDaySlideDirection(1)
                      setActiveNationalDayOffer((current) => (current + 1) % heroImages.length)
                    }}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:left-5"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    aria-label={
                      isHeroAutoPlayPaused
                        ? "تشغيل الانتقال التلقائي للعروض"
                        : "إيقاف الانتقال التلقائي للعروض"
                    }
                    aria-pressed={isHeroAutoPlayPaused}
                    onClick={() => setIsHeroAutoPlayPaused((current) => !current)}
                    className="absolute bottom-3 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-3 text-xs font-bold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 sm:bottom-5"
                  >
                    {isHeroAutoPlayPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                    {isHeroAutoPlayPaused ? "تشغيل" : "إيقاف"}
                  </button>
                  <button
                    type="button"
                    aria-label="العرض السابق"
                    onClick={() => {
                      setNationalDaySlideDirection(-1)
                      setActiveNationalDayOffer((current) => (current - 1 + heroImages.length) % heroImages.length)
                    }}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:right-5"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center sm:bottom-5">
                    <span className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                      العرض {activeNationalDayOffer + 1} من {heroImages.length}
                    </span>
                  </div>
                </div>

                <Card id="book" className="relative z-10 mt-6 overflow-hidden border-primary/10 shadow-2xl shadow-primary/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <p className="mb-2 text-sm font-bold text-primary">حجز موعد</p>
                      <h2 className="text-2xl font-bold text-foreground">خطوتك الأولى نحو الاطمئنان</h2>
                      <p className="mt-2 text-sm text-muted-foreground">اترك بياناتك وسيتواصل معك فريقنا لتأكيد الموعد المناسب.</p>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="sr-only" aria-hidden="true">
                        <label htmlFor="booking-website">الموقع الإلكتروني</label>
                        <input
                          id="booking-website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={bookingForm.website}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              website: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="booking-name" className="text-sm font-medium text-foreground">الاسم الكامل</label>
                        <Input
                          id="booking-name"
                          name="name"
                          autoComplete="name"
                          placeholder="أدخل اسمك الكريم"
                          minLength={2}
                          maxLength={100}
                          value={bookingForm.name}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="booking-phone" className="text-sm font-medium text-foreground">رقم الجوال</label>
                        <Input
                          id="booking-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          dir="ltr"
                          placeholder="05x xxx xxxx"
                          className="font-en text-right"
                          minLength={9}
                          maxLength={20}
                          value={bookingForm.phone}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="booking-test-type" className="text-sm font-medium text-foreground">نوع الفحص</label>
                        <select
                          id="booking-test-type"
                          name="testType"
                          value={bookingForm.testType}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              testType: event.target.value,
                            }))
                          }
                          className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="فحص شامل">فحص شامل</option>
                          <option value="تحاليل دم روتينية">تحاليل دم روتينية</option>
                          <option value="فحص فيتامينات">فحص فيتامينات</option>
                          <option value="غير متأكد">غير متأكد</option>
                        </select>
                      </div>
                      {formMessage && (
                        <p
                          role={formMessage.type === "error" ? "alert" : "status"}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                            formMessage.type === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {formMessage.text}
                        </p>
                      )}
                      <Button type="submit" className="w-full mt-2" disabled={createBooking.isPending}>
                        {createBooking.isPending ? "جاري إرسال الطلب..." : "تأكيد الطلب"}
                      </Button>
                    </form>
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
              <p className="text-sm font-bold text-primary tracking-wider uppercase mb-3">تخصصاتنا المخبرية</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">خدمات تشخيصية شاملة</h2>
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
                <p className="text-sm font-bold text-primary tracking-wider uppercase mb-3">عروض الفحوصات</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">باقات مصممة لاحتياجاتك</h2>
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
                       onClick={() => document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })}
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
                <p className="text-sm font-bold text-primary tracking-wider uppercase mb-3">من عروضنا</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">اختاري باقتك بكل وضوح</h2>
                <p className="text-muted-foreground">
                  مجموعة من عروض مختبر خلود المصممة لتناسب احتياجاتك الصحية المختلفة، مع تفاصيل الفحوصات والأسعار داخل كل تصميم.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
                {visibleOffers.length} عروض مختارة
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
                         onClick={() => document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        احجز هذه الباقة
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
                <p className="text-sm font-bold text-primary tracking-wider uppercase mb-3">لماذا مختبر خلود؟</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">رحلة الرعاية تبدأ بتشخيص دقيق</h2>
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
                  <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                    <img
                      src="/assets/cbahi-logo.jpg"
                      alt="شعار سباهي CBAHI"
                      className="h-full w-full object-contain"
                    />
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
                  يمكن استلام النتائج عبر رسالة واتساب بعد اعتمادها، أو مطبوعة بزيارة فرع المختبر. للاستفسار تواصل معنا على الرقم الموضح في الموقع.
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
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto rounded-full font-bold px-8" asChild>
                <a href={homeAnchor("book")}>احجز موعدك الآن</a>
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
