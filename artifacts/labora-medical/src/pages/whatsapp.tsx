import { useEffect } from "react"
import { ExternalLink } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa6"

const phoneNumber = "966559070400"
const message = "مرحباً، أرغب بالاستفسار عن خدمات مختبر خلود"
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

export default function WhatsApp() {
  useEffect(() => {
    const previousTitle = document.title
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = metaDescription?.content

    document.title = "تواصل عبر واتساب | مختبر خلود"
    if (metaDescription) {
      metaDescription.content = "ابدأ محادثة واتساب مباشرة مع مختبر خلود للتحاليل الطبية."
    }
    window.scrollTo(0, 0)

    return () => {
      document.title = previousTitle
      if (metaDescription && previousDescription) {
        metaDescription.content = previousDescription
      }
    }
  }, [])

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-white px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#25D366]/5 to-transparent" />

      <section className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <img
          src="/assets/kholoud-lab-logo.png"
          alt="مختبر خلود للتحاليل الطبية"
          className="mb-8 h-auto w-28 object-contain sm:w-32"
        />

        <div className="mb-7 flex items-center justify-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DA1F2] text-[11px] font-bold text-white" aria-label="حساب موثق">
            ✓
          </span>
          <h1 className="text-xl font-bold leading-relaxed sm:text-2xl">
            مختبر خلود للتحاليل الطبية
            <span className="font-en mr-1" dir="ltr">Kholoud Lab</span>
          </h1>
        </div>

        <div className="mb-6 w-full rounded-2xl bg-[#f4f4f4] px-5 py-5 text-base font-medium text-[#555] shadow-sm sm:text-lg">
          {message}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-lg font-bold text-white shadow-lg shadow-[#25D366]/20 transition hover:bg-[#20bd5a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/25"
        >
          <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
          فتح المحادثة
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>

        <p className="mt-5 text-sm text-muted-foreground">
          سيتم فتح واتساب على الرقم
          <span className="font-en mx-1 font-semibold text-foreground" dir="ltr">+966 55 907 0400</span>
        </p>
      </section>
    </main>
  )
}