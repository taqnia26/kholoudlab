import { useEffect } from "react"
import { Link } from "wouter"
import { homeAnchor } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { 
  CalendarCheck, 
  House,
  MapPin, 
  PhoneCall, 
  Globe, 
  FileText,
  Clock
} from "lucide-react"
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaSnapchat, 
  FaTiktok 
} from "react-icons/fa6"

const labWhatsAppUrl = "https://wa.me/966559070400?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%20%D8%AE%D9%84%D9%88%D8%AF"
const resultsWhatsAppUrl = "https://wa.me/966559070400?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%B9%D9%84%D8%A7%D9%85%20%D8%B9%D9%86%20%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D8%AA%D8%AD%D8%A7%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%D8%A9%20%D8%A8%D9%8A."
const homeVisitWhatsAppUrl = `https://wa.me/966559070400?text=${encodeURIComponent("مرحباً، أرغب بطلب زيارة منزلية لسحب العينة.")}`

type ActionItem = {
  id: string
  label: string
  subtitle?: string
  icon: React.ElementType
  href?: string
  disabled?: boolean
  newTab?: boolean
  isInternalAnchor?: boolean
}

const actions: { title: string; items: ActionItem[] }[] = [
  {
    title: "الخدمات المباشرة",
    items: [
      {
        id: "booking",
        label: "احجز موعدك الآن",
        subtitle: "سجل بياناتك لترتيب زيارتك",
        icon: CalendarCheck,
        href: homeAnchor("book"),
        isInternalAnchor: true,
      },
      {
        id: "home-visit",
        label: "طلب زيارة منزلية",
        subtitle: "اطلب خدمة سحب العينات من منزلك",
        icon: House,
        href: homeVisitWhatsAppUrl,
        newTab: true,
      },
      {
        id: "results",
        label: "نتائج التحاليل",
        subtitle: "تواصل معنا لاستلام نتائجك عبر واتساب",
        icon: FileText,
        href: resultsWhatsAppUrl,
        newTab: true,
      },
      {
        id: "website",
        label: "الموقع الإلكتروني",
        subtitle: "تصفح خدماتنا وباقات الفحص الشاملة",
        icon: Globe,
        href: "/",
        isInternalAnchor: true,
      }
    ]
  },
  {
    title: "التواصل والزيارة",
    items: [
      {
        id: "location",
        label: "موقع المختبر",
        subtitle: "احصل على الاتجاهات عبر خرائط جوجل",
        icon: MapPin,
        href: "https://maps.app.goo.gl/gCdW24wQmYMrLJGv6",
        newTab: true,
      },
      {
        id: "phone",
        label: "الاتصال المباشر",
        subtitle: "055 907 0400",
        icon: PhoneCall,
        href: "tel:+966559070400",
      },
      {
        id: "whatsapp-lab",
        label: "واتساب (المختبر)",
        subtitle: "للاستفسارات والخدمات الطبية",
        icon: FaWhatsapp,
        href: labWhatsAppUrl,
        newTab: true,
      },
      {
        id: "whatsapp-admin",
        label: "واتساب (الإدارة)",
        subtitle: "قريباً",
        icon: FaWhatsapp,
        disabled: true,
      }
    ]
  },
  {
    title: "منصات التواصل",
    items: [
      {
        id: "instagram",
        label: "إنستغرام",
        icon: FaInstagram,
        disabled: true,
      },
      {
        id: "snapchat",
        label: "سناب شات",
        icon: FaSnapchat,
        disabled: true,
      },
      {
        id: "tiktok",
        label: "تيك توك",
        icon: FaTiktok,
        disabled: true,
      }
    ]
  }
]

export default function OurServicesContacts() {
  useEffect(() => {
    const previousTitle = document.title
    const description =
      "روابط خدمات مختبر خلود: حجز موعد، زيارة منزلية، نتائج التحاليل، واتساب، الاتصال وموقع المختبر."
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    const previousDescription = metaDescription?.content
    const previousOgTitle = ogTitle?.content
    const previousOgDescription = ogDescription?.content

    document.title = "خدمات وروابط مختبر خلود | KHOLOUD LAB"
    if (metaDescription) metaDescription.content = description
    if (ogTitle) ogTitle.content = document.title
    if (ogDescription) ogDescription.content = description

    window.scrollTo(0, 0)

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

    document.querySelectorAll(".reveal-item").forEach((el) => {
      observer.observe(el)
    })

    return () => {
      observer.disconnect()
      document.title = previousTitle
      if (metaDescription && previousDescription) metaDescription.content = previousDescription
      if (ogTitle && previousOgTitle) ogTitle.content = previousOgTitle
      if (ogDescription && previousOgDescription) ogDescription.content = previousOgDescription
    }
  }, [])

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20 selection:text-primary pb-20 relative overflow-hidden flex flex-col items-center">
      
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.08),transparent_32%)] pointer-events-none z-0" />

      <main className="w-full max-w-xl mx-auto px-4 md:px-6 relative z-10 pt-16 flex flex-col items-center">
        
        <div className="flex flex-col items-center text-center mb-12 reveal-item opacity-0 translate-y-4 transition-all duration-700 ease-out">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-primary/5 mb-6 border border-primary/10">
            <img 
              src="/assets/kholoud-lab-logo.png" 
              alt="مختبر خلود للتحاليل الطبية | Kholoud Lab" 
              className="w-32 h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">مرحباً بكم في مختبر خلود</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-sm">
            رعاية مخبرية تثقون بها. نوفر لك كافة قنوات التواصل لخدمتك بشكل أسرع وأفضل.
          </p>
        </div>

        <div className="w-full space-y-10">
          {actions.map((section, sectionIdx) => (
            <div key={section.title} className="w-full">
              <h2 className="text-xs font-bold text-primary tracking-wider uppercase mb-4 text-center reveal-item opacity-0 translate-y-4 transition-all duration-700 delay-100 ease-out">
                {section.title}
              </h2>
              
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => {
                  const delay = 100 + (sectionIdx * 100) + (itemIdx * 50)
                  
                  const isComingSoon = item.disabled
                  const Icon = item.icon
                  
                  const content = (
                    <div className={cn(
                      "flex items-center p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                      isComingSoon 
                        ? "bg-secondary/30 border-transparent opacity-80" 
                        : "bg-white border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                    )}>
                      
                      {!isComingSoon && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
                      )}

                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-colors duration-300",
                        isComingSoon 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="mr-4 flex-grow flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "font-bold text-base",
                            isComingSoon ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {item.label}
                          </span>
                          
                          {isComingSoon && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              قريباً
                            </span>
                          )}
                        </div>
                        
                        {item.subtitle && (
                          <span className={cn(
                            "text-sm mt-0.5",
                            item.id === "phone" ? "font-en tracking-wide text-right block w-full" : "",
                            isComingSoon ? "text-muted-foreground/70" : "text-muted-foreground"
                          )}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  )

                  const wrapperClass = "block w-full reveal-item opacity-0 translate-y-4 transition-all duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"

                  if (isComingSoon || !item.href) {
                    return (
                      <div 
                        key={item.id}
                        className={wrapperClass}
                        style={{ transitionDelay: `${delay}ms` }}
                        aria-disabled="true"
                      >
                        {content}
                      </div>
                    )
                  }

                  if (item.isInternalAnchor) {
                    return item.id === "website" ? (
                      <Link 
                        key={item.id} 
                        href={item.href} 
                        className={wrapperClass}
                        style={{ transitionDelay: `${delay}ms` }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a 
                        key={item.id} 
                        href={item.href}
                        className={wrapperClass}
                        style={{ transitionDelay: `${delay}ms` }}
                      >
                        {content}
                      </a>
                    )
                  }

                  return (
                    <a 
                      key={item.id} 
                      href={item.href} 
                      target={item.newTab ? "_blank" : undefined}
                      rel={item.newTab ? "noopener noreferrer" : undefined}
                      className={wrapperClass}
                      style={{ transitionDelay: `${delay}ms` }}
                    >
                      {content}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center reveal-item opacity-0 translate-y-4 transition-all duration-700 delay-500 ease-out">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} مختبر خلود للتحاليل الطبية. جميع الحقوق محفوظة.
          </p>
        </div>
      </main>

      <style>{`
        .reveal-item.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-item {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
