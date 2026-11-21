import { FaWhatsapp } from "react-icons/fa6"
import { useLocation } from "wouter"
import { useSiteContent, whatsappUrl } from "@/lib/site-content"

export function WhatsAppFloat() {
  const [location] = useLocation()
  const { contact } = useSiteContent()

  if (location === "/our-services-contacts" || location === "/whatsapp" || location.startsWith("/admin") || location.startsWith("/staff")) {
    return null
  }

  return (
    <a
      href={whatsappUrl(contact, "مرحباً، أرغب بالاستفسار عن خدمات مختبر خلود")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل مع مختبر خلود عبر واتساب"
      title="تواصل معنا عبر واتساب"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30 transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/30 md:bottom-6 md:left-6 md:z-40 md:h-14 md:w-14"
    >
      <FaWhatsapp className="h-7 w-7 md:h-8 md:w-8" aria-hidden="true" />
      <span className="sr-only">تواصل مع مختبر خلود عبر واتساب</span>
    </a>
  )
}