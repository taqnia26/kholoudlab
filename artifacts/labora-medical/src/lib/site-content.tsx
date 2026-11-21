import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity, CalendarCheck, Clock, FileText, HeartPulse, Microscope, PhoneCall, ShieldCheck, Syringe,
  type LucideIcon,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Editable content blocks. Defaults reproduce the site exactly as it   */
/* was before the dashboard existed, so an empty database changes nothing. */
/* ------------------------------------------------------------------ */

export type HoursRow = { label: string; value: string }
export type Contact = {
  phoneDisplay: string
  phoneTel: string
  whatsapp: string
  whatsappMessage: string
  whatsappSecondary: string
  email: string
  address: string
  mapsUrl: string
  instagram: string
  snapchat: string
  tiktok: string
  hours: HoursRow[]
}
export type Hero = { badge: string; headline1: string; headlineAccent: string; headline2: string; subtitle: string; ctaLabel: string }
export type ServiceItem = { icon: string; title: string; desc: string; visible: boolean }
export type FaqItem = { q: string; a: string }
export type Cta = { title: string; text: string; buttonLabel: string }
export type Announcement = { enabled: boolean; text: string; linkLabel: string; linkUrl: string }
export type SeoPage = { title: string; description: string }
export type Seo = { home: SeoPage; about: SeoPage }
export type Sections = { services: boolean; packages: boolean; gallery: boolean; about: boolean; faq: boolean; cta: boolean }

export type SiteContent = {
  contact: Contact
  hero: Hero
  services: ServiceItem[]
  faq: FaqItem[]
  cta: Cta
  announcement: Announcement
  seo: Seo
  sections: Sections
}

export const SERVICE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  heartPulse: { label: "نبض القلب", Icon: HeartPulse },
  activity: { label: "نشاط", Icon: Activity },
  fileText: { label: "ملف", Icon: FileText },
  syringe: { label: "محقنة", Icon: Syringe },
  shieldCheck: { label: "درع", Icon: ShieldCheck },
  clock: { label: "ساعة", Icon: Clock },
  microscope: { label: "مجهر", Icon: Microscope },
  phone: { label: "هاتف", Icon: PhoneCall },
  calendar: { label: "موعد", Icon: CalendarCheck },
}

export const DEFAULT_CONTENT: SiteContent = {
  contact: {
    phoneDisplay: "055 907 0400",
    phoneTel: "+966559070400",
    whatsapp: "966559070400",
    whatsappMessage: "مرحباً، أرغب بالاستفسار عن خدمات مختبر خلود",
    whatsappSecondary: "966556087747",
    email: "info@kholoudlab.com",
    address: "مكة المكرمة - الزايدي - طريق الأمير نايف بن عبدالعزيز",
    mapsUrl: "https://maps.app.goo.gl/gCdW24wQmYMrLJGv6",
    instagram: "https://www.instagram.com/kholod_lab?stkn=ZGRtdmttd2Z0bG1t&utm_source=qr",
    snapchat: "https://snapchat.com/t/O3phncNw",
    tiktok: "https://www.tiktok.com/@kholod_lab?_r=1&_t=ZS-9A6x6U3yrmE",
    hours: [
      { label: "السبت - الخميس", value: "8:00 صباحاً - 10:00 مساءً" },
      { label: "الجمعة", value: "4:00 عصراً - 10:00 مساءً" },
    ],
  },
  hero: {
    badge: "مختبر معتمد من سباهي (CBAHI)",
    headline1: "دقتنا لراحتكم.",
    headlineAccent: "رعاية مخبرية",
    headline2: "تثقون بها.",
    subtitle:
      "في مختبر خلود للتحاليل الطبية، نجمع بين أحدث التقنيات العالمية والخبرات الطبية المتخصصة لنقدم لكم نتائج دقيقة وسريعة تعتمدون عليها لقراراتكم الصحية.",
    ctaLabel: "احجز موعدك الآن",
  },
  services: [
    { icon: "heartPulse", title: "تحاليل الدم الروتينية", desc: "فحوصات أساسية شاملة للدم، السكر، والكوليسترول للاطمئنان على الصحة العامة.", visible: true },
    { icon: "activity", title: "تحاليل الهرمونات", desc: "قياس دقيق لمستويات الهرمونات الوظيفية للغدد، الخصوبة، والنمو.", visible: true },
    { icon: "fileText", title: "البيولوجيا الجزيئية (PCR)", desc: "تشخيص متقدم للفيروسات والبكتيريا والأمراض الجينية بدقة متناهية.", visible: true },
    { icon: "syringe", title: "الفحوصات المناعية", desc: "تقييم كفاءة الجهاز المناعي واختبارات الحساسية والأمراض المناعية الذاتية.", visible: true },
    { icon: "shieldCheck", title: "الفحوصات الكيميائية الحيوية", desc: "فحص وظائف الكبد، الكلى، والإنزيمات الحيوية في الجسم.", visible: true },
    { icon: "clock", title: "خدمة السحب المنزلي", desc: "فريق طبي متخصص لزيارتك في المنزل أو العمل لراحتك ووقتك.", visible: true },
  ],
  faq: [
    { q: "هل أحتاج إلى الصيام قبل إجراء التحاليل؟", a: "تختلف المتطلبات حسب نوع التحليل. فحوصات السكر والدهون الثلاثية تتطلب عادة الصيام لمدة 8-12 ساعة. يُنصح بالاستفسار عن تحاليلك المحددة عند حجز الموعد." },
    { q: "كيف يمكنني استلام نتائج تحاليلي؟", a: "يمكن استلام النتائج عبر رسالة واتساب بعد اعتمادها، أو مطبوعة بزيارة فرع المختبر. للاستفسار تواصل معنا على الرقم الموضح في الموقع." },
    { q: "هل يتوفر لديكم خدمة السحب المنزلي؟", a: "نعم، نوفر خدمة السحب المنزلي بواسطة ممرضين متخصصين. يمكنك حجز الخدمة عبر الموقع أو بالاتصال على رقمنا الموحد، وسيصلك الفريق في الوقت المحدد." },
    { q: "متى تظهر نتائج التحاليل عادةً؟", a: "معظم التحاليل الروتينية (مثل صورة الدم والسكر) تظهر نتائجها في نفس اليوم خلال ساعات قليلة. بعض التحاليل التخصصية الدقيقة أو الزراعة قد تستغرق من 3 إلى 5 أيام." },
  ],
  cta: {
    title: "صحتك هي أولويتنا",
    text: "لا تؤجل الاطمئنان على صحتك. احجز موعدك اليوم بخطوات بسيطة ودع فريقنا الطبي يعتني بك.",
    buttonLabel: "احجز موعدك الآن",
  },
  announcement: { enabled: false, text: "", linkLabel: "", linkUrl: "" },
  seo: {
    home: { title: "", description: "" },
    about: { title: "", description: "" },
  },
  sections: { services: true, packages: true, gallery: true, about: true, faq: true, cta: true },
}

export function mergeBlock<T>(fallback: T, saved: unknown): T {
  if (Array.isArray(fallback)) return (Array.isArray(saved) && saved.length > 0 ? saved : fallback) as T
  if (fallback && typeof fallback === "object") {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return fallback
    const out: Record<string, unknown> = { ...(fallback as Record<string, unknown>) }
    for (const key of Object.keys(out)) {
      const value = (saved as Record<string, unknown>)[key]
      if (value !== undefined && value !== null) out[key] = mergeBlock(out[key], value)
    }
    return out as T
  }
  return (typeof saved === typeof fallback ? saved : fallback) as T
}

const apiBase = () => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`

export function useSiteContent(): SiteContent {
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const response = await fetch(`${apiBase()}/content`)
      if (!response.ok) throw new Error("content unavailable")
      return response.json()
    },
    staleTime: 60_000,
    retry: 1,
  })
  return useMemo(() => {
    const saved = data ?? {}
    const result = { ...DEFAULT_CONTENT }
    for (const key of Object.keys(DEFAULT_CONTENT) as Array<keyof SiteContent>) {
      ;(result as Record<string, unknown>)[key] = mergeBlock(DEFAULT_CONTENT[key], saved[key])
    }
    return result
  }, [data])
}

export type RemoteImage = { id: number; title: string; caption: string; url: string }

/** Managed gallery/package images; null while loading or when none exist (callers then use the built-in images). */
export function useGalleryImages(kind: "gallery" | "package"): RemoteImage[] | null {
  const { data } = useQuery({
    queryKey: ["public-gallery", kind],
    queryFn: async (): Promise<RemoteImage[]> => {
      const response = await fetch(`${apiBase()}/gallery?kind=${kind}`)
      if (!response.ok) throw new Error("gallery unavailable")
      return response.json()
    },
    staleTime: 60_000,
    retry: 1,
  })
  return data && data.length > 0 ? data : null
}

export function whatsappUrl(contact: Contact, message?: string): string {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message ?? contact.whatsappMessage)}`
}

/** Applies title/description from the SEO block for a page; empty fields keep the page defaults. */
export function usePageSeo(page: keyof Seo, fallbackTitle: string) {
  const { seo } = useSiteContent()
  const title = seo[page].title.trim()
  const description = seo[page].description.trim()
  useEffect(() => {
    const previousTitle = document.title
    document.title = title || fallbackTitle
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute("content") ?? null
    if (description && meta) meta.setAttribute("content", description)
    const og = document.querySelector('meta[property="og:title"]')
    if (title && og) og.setAttribute("content", title)
    return () => {
      document.title = previousTitle
      if (description && meta && previousDescription !== null) meta.setAttribute("content", previousDescription)
    }
  }, [title, description, fallbackTitle])
}
