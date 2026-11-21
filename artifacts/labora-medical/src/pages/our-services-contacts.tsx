import { useEffect, type ElementType } from "react"
import { Link } from "wouter"
import { BriefcaseBusiness, CalendarCheck, Globe, House, MapPin, PhoneCall } from "lucide-react"
import { FaInstagram, FaSnapchat, FaTiktok, FaWhatsapp } from "react-icons/fa6"
import { JobApplicationDialog } from "@/components/job-application-dialog"
import { cn, homeAnchor } from "@/lib/utils"
import { useSiteContent, whatsappUrl as buildWhatsappUrl, type Contact } from "@/lib/site-content"

type Brand = "primary" | "whatsapp" | "instagram" | "snapchat" | "tiktok"

type ActionItem = {
  id: string
  label: string
  icon: ElementType
  href?: string
  brand: Brand
  newTab?: boolean
  disabled?: boolean
}

const buildActions = (contact: Contact): ActionItem[] => {
  const whatsappUrl = (message: string) => buildWhatsappUrl(contact, message)
  return [
  {
    id: "whatsapp-lab",
    label: "واتساب المختبر",
    icon: FaWhatsapp,
    brand: "whatsapp",
    href: whatsappUrl("مرحباً، أرغب بالاستفسار عن خدمات مختبر خلود."),
    newTab: true,
  },
  {
    id: "whatsapp-admin",
    label: "واتساب الإدارة",
    icon: FaWhatsapp,
    brand: "whatsapp",
    href: `https://wa.me/${contact.whatsappSecondary}`,
    newTab: true,
  },
  {
    id: "booking",
    label: "حجز موعد",
    icon: CalendarCheck,
    brand: "primary",
    href: homeAnchor("book"),
  },
  {
    id: "home-visit",
    label: "زيارة منزلية",
    icon: House,
    brand: "primary",
    href: whatsappUrl("مرحباً، أرغب بطلب زيارة منزلية لسحب العينة."),
    newTab: true,
  },
  {
    id: "careers",
    label: "الفرص الوظيفية",
    icon: BriefcaseBusiness,
    brand: "primary",
  },
  {
    id: "location",
    label: "الموقع بمكة",
    icon: MapPin,
    brand: "primary",
    href: contact.mapsUrl,
    newTab: true,
  },
  {
    id: "phone",
    label: "اتصل بنا",
    icon: PhoneCall,
    brand: "primary",
    href: `tel:${contact.phoneTel}`,
  },
  {
    id: "instagram",
    label: "إنستغرام",
    icon: FaInstagram,
    brand: "instagram",
    href: contact.instagram,
    newTab: true,
  },
  {
    id: "snapchat",
    label: "سناب شات",
    icon: FaSnapchat,
    brand: "snapchat",
    href: contact.snapchat,
    newTab: true,
  },
  {
    id: "tiktok",
    label: "تيك توك",
    icon: FaTiktok,
    brand: "tiktok",
    href: contact.tiktok,
    newTab: true,
  },
  {
    id: "website",
    label: "الموقع الرئيسي",
    icon: Globe,
    brand: "primary",
    href: "/",
  },
  ]
}

const iconClasses: Record<Brand, string> = {
  primary: "bg-primary text-primary-foreground",
  whatsapp: "bg-[#25D366] text-white",
  instagram: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
  snapchat: "bg-[#FFFC00] text-black",
  tiktok: "bg-black text-white",
}

export default function OurServicesContacts() {
  const { contact } = useSiteContent()
  const actions = buildActions(contact)
  useEffect(() => {
    const previousTitle = document.title
    const description =
      "خدمات مختبر خلود في مكة المكرمة: حجز موعد، زيارة منزلية، واتساب، التوظيف، الاتصال وموقع المختبر."
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    const previousDescription = metaDescription?.content
    const previousOgTitle = ogTitle?.content
    const previousOgDescription = ogDescription?.content

    document.title = "خدمات مختبر خلود | KHOLOUD LAB"
    if (metaDescription) metaDescription.content = description
    if (ogTitle) ogTitle.content = document.title
    if (ogDescription) ogDescription.content = description
    window.scrollTo(0, 0)

    return () => {
      document.title = previousTitle
      if (metaDescription && previousDescription) metaDescription.content = previousDescription
      if (ogTitle && previousOgTitle) ogTitle.content = previousOgTitle
      if (ogDescription && previousOgDescription) ogDescription.content = previousOgDescription
    }
  }, [])

  return (
    <main className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:items-center sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="rounded-[1.35rem] border border-primary/10 bg-white p-3 shadow-lg shadow-primary/10">
            <img
              src="/assets/kholoud-lab-logo.png"
              alt="مختبر خلود للتحاليل الطبية"
              className="h-auto w-28 object-contain"
            />
          </div>
          <h1 className="text-lg font-extrabold text-foreground">خدمات مختبر خلود</h1>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((item, index) => {
            const Icon = item.icon
            const isDisabled = Boolean(item.disabled)
            const className = cn(
              "group relative flex min-h-16 items-center gap-2.5 rounded-2xl border border-border bg-white px-3 py-3 text-right shadow-sm transition duration-300",
              isDisabled
                ? "cursor-default opacity-65"
                : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )

            const content = (
              <>
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm transition-transform duration-300",
                    iconClasses[item.brand],
                    !isDisabled && "group-hover:scale-105",
                  )}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold leading-tight">
                  {item.label}
                </span>
                {isDisabled && (
                  <span className="absolute -top-2 left-2 rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                    قريباً
                  </span>
                )}
              </>
            )

            if (item.id === "careers") {
              return (
                <JobApplicationDialog
                  key={item.id}
                  triggerClassName={className}
                >
                  {content}
                </JobApplicationDialog>
              )
            }

            if (isDisabled || !item.href) {
              return (
                <div
                  key={item.id}
                  aria-disabled="true"
                  className={className}
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  {content}
                </div>
              )
            }

            if (item.id === "website") {
              return (
                <Link key={item.id} href={item.href} className={className}>
                  {content}
                </Link>
              )
            }

            return (
              <a
                key={item.id}
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                className={className}
              >
                {content}
              </a>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          مختبر خلود للتحاليل الطبية
        </p>
      </div>
    </main>
  )
}