import { FaWhatsapp } from "react-icons/fa6"
import { useLocation } from "wouter"

const whatsappUrl =
  "https://wa.me/966559070400?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%20%D8%AE%D9%84%D9%88%D8%AF"

export function WhatsAppFloat() {
  const [location] = useLocation()

  if (location === "/our-services-contacts" || location === "/whatsapp") {
    return null
  }

  return (
    <a
      href={whatsappUrl}
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