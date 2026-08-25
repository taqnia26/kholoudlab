import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Phone, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "الرئيسية", href: "/" },
    { label: "خدماتنا", href: "#services" },
    { label: "باقات الفحص", href: "#packages" },
    { label: "النتائج", href: "#results" },
    { label: "من نحن", href: "#about" },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-border/50 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            <img 
              src="/assets/kholoud-lab-logo.png" 
              alt="مختبر خلود للتحاليل الطبية | Kholoud Lab" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+966123456789" className="flex items-center gap-2 text-primary font-medium hover:opacity-80 transition-opacity">
              <span className="font-en text-sm mt-1" dir="ltr">+966 50 123 4567</span>
              <Phone className="h-4 w-4" />
            </a>
            <Button asChild className="rounded-full px-6">
              <a href="#book">احجز موعدك</a>
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden z-50 p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 bg-background/95 backdrop-blur-xl z-40 transition-transform duration-300 md:hidden pt-24 px-6 flex flex-col",
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="flex flex-col gap-6 text-center mt-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xl font-medium text-foreground hover:text-primary transition-colors pb-4 border-b border-border/20"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto pb-12 flex flex-col gap-4">
          <a href="tel:+966123456789" className="flex items-center justify-center gap-2 text-primary font-medium p-4 bg-primary/5 rounded-xl">
            <Phone className="h-5 w-5" />
            <span className="font-en text-lg" dir="ltr">+966 50 123 4567</span>
          </a>
          <Button size="lg" className="w-full rounded-xl" asChild onClick={() => setMobileMenuOpen(false)}>
            <a href="#book">احجز موعدك الآن</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
